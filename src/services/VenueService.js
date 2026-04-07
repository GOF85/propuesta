/**
 * VenueService.js
 * Propósito: Scraping de venues desde micecatering.com + Descarga/optimización de imágenes
 * Pattern: Puppeteer scraping → ImageService processing → DB persistence
 * 
 * ✅ Deep insert/update con transacciones
 */

const puppeteer = require('puppeteer');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const ImageService = require('./ImageService');
const SyncService = require('./SyncService');
const { pool } = require('../config/db');

class VenueService {
  constructor() {
    this.scraperTimeout = 30000; // 30s timeout
    this.maxRetries = 3;
  }

  /**
   * 🛡️ HELPER: Parse JSON seguro
   * Intenta parsear JSON, si falla retorna default
   * Maneja casos donde el valor ya es un objeto
   * @param {string|object|array} value - String, objeto o array a procesar
   * @param {*} defaultValue - Valor por defecto si falla
   * @returns {*} Array u objeto parseado, o defaultValue
   */
  safeJsonParse(value, defaultValue = null) {
    try {
      // Si ya es un array u objeto, devolverlo tal cual
      if (Array.isArray(value)) {
        return value;
      }
      if (typeof value === 'object' && value !== null) {
        return value;
      }
      
      // Si es string, intentar parsear
      if (typeof value === 'string') {
        return JSON.parse(value);
      }
      
      // Tipo inválido, retornar default
      return defaultValue;
    } catch (err) {
      const preview = typeof value === 'string' ? value.substring(0, 50) : String(value).substring(0, 50);
      console.warn(`⚠️  JSON parse error: ${preview}... → Using default`);
      return defaultValue;
    }
  }

  /**
   * Extrae venue desde URL específica proporcionada por usuario
   * Soporta páginas individuales de venues (no listados)
   * 
   * @param {String} targetUrl - URL completa del venue a scrapear
   * @returns {Promise<Object|null>} Datos del venue o null si falla
   * 
   * Ejemplo:
   *   const venue = await VenueService.scrapeFromCustomUrl('https://www.micecatering.com/venues/salon-madrid');
   *   // Retorna: {name, description, images: [...], external_url}
   */
  async scrapeFromCustomUrl(targetUrl) {
    let browser;
    try {
      console.log(`🚀 Scrapeando venue desde: ${targetUrl}`);

      // Validar URL
      if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
        throw new Error('URL inválida. Debe comenzar con http:// o https://');
      }

      // Lanzar navegador
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ],
        timeout: this.scraperTimeout
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      );

      console.log(`📍 Navegando a: ${targetUrl}`);
      await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: this.scraperTimeout });

      // Esperar a que cargue completamente
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Extraer datos del venue (selectores genéricos adaptables)
      const venueData = await page.evaluate(() => {
        // Función helper para limpiar texto
        const cleanText = (text) => {
          if (!text) return '';
          return text.trim().replace(/\s+/g, ' ');
        };

        // Extraer nombre (selectores comunes)
        let name = document.querySelector('h1')?.textContent ||
                   document.querySelector('.venue-name, .title, [class*="title"]')?.textContent ||
                   document.title;
        name = cleanText(name);

        // Extraer descripción
        let description = '';
        
        // 1. Buscar en divs de tabs Elementor activos - pero solo párrafos largos
        const elementorTabContent = document.querySelector('[class*="elementor-tab-content"][class*="elementor-active"]');
        if (elementorTabContent) {
          const paragraphs = elementorTabContent.querySelectorAll('p');
          // Buscar el párrafo más largo (probable descripción)
          let longestPara = '';
          paragraphs.forEach(p => {
            const text = cleanText(p.textContent);
            if (text.length > longestPara.length) {
              longestPara = text;
            }
          });
          if (longestPara.length > 100) {
            description = longestPara;
          }
        }
        
        // 2. Si no encontró descripción larga en tabs, buscar todos los párrafos largos
        if (!description || description.length < 100) {
          const allParas = document.querySelectorAll('p');
          let longestFound = '';
          allParas.forEach(p => {
            const text = cleanText(p.textContent);
            // Filtrar párrafos que parecen ser descripciones (100+ caracteres, sin ser demasiado cortos)
            if (text.length > 100 && text.length > longestFound.length) {
              // Evitar párrafos que son claramente CTAs o widgets
              if (!text.includes('presupuesto') && !text.includes('favoritos') && !text.includes('compartir')) {
                longestFound = text;
              }
            }
          });
          if (longestFound.length > 100) {
            description = longestFound;
          }
        }
        
        // 3. Fallback a meta description si todo lo anterior falla
        if (!description || description.length < 50) {
          description = document.querySelector('meta[name="description"]')?.content || 
                       document.querySelector('.venue-description, .description, [class*="description"]')?.textContent || '';
        }
        
        description = cleanText(description);

      // Extraer dirección - MEJORADO para micecatering.com
      let address = '';
      // Selector específico para micecatering.com
      const addressElement = document.querySelector('.d-block.my-3.text-dark.text-big05, [data-address]');
      if (addressElement) {
        // Extraer solo el texto de la dirección (sin el icono)
        address = cleanText(addressElement.textContent);
      } else {
        // Fallback a selectores genéricos
        address = document.querySelector('.address, [class*="address"]')?.textContent || '';
        address = cleanText(address);
      }
        const images = [];
        
        // 1. Intentar slider específico (swiper, gallery)
        const sliderImages = document.querySelectorAll('.swiper-slide-image, .slider img, .gallery img, [class*="slider"] img, [class*="gallery"] img');
        sliderImages.forEach(img => {
          const src = img.src || img.dataset.src || img.getAttribute('data-src');
          if (src && src.length > 10) {
            images.push(src);
          }
        });
        
        // 2. Si no hay slider, buscar imágenes generales (excluyendo logos/iconos)
        if (images.length === 0) {
          const allImages = document.querySelectorAll('img');
          allImages.forEach(img => {
            const src = img.src || img.dataset.src;
            if (src && !src.includes('logo') && !src.includes('icon') && src.length > 10) {
              images.push(src);
            }
          });
        }

        return {
          name,
          description,
          // Capacidad: se da manualmente en BD (no se scraepea)
          address,
          images: [...new Set(images)] // Todas las imágenes del slider (sin límite)
        };
      });

      console.log(`✅ Datos extraídos: ${venueData.name}`);

      // Procesar imágenes
      const processedImages = [];
      if (venueData.images && venueData.images.length > 0) {
        // Generar carpeta con nombre del venue (sanitizado para filename)
        const venueFolderName = venueData.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remover acentos
          .replace(/[^a-z0-9-]/g, '-') // Solo letras, números, guiones
          .replace(/-+/g, '-') // Guiones múltiples -> uno
          .replace(/^-|-$/g, ''); // Quitar guiones de inicio/fin
        
        for (const imageUrl of venueData.images) {
          try {
            const processed = await this.downloadAndOptimizeImage(imageUrl, venueData.name, venueFolderName);
            if (processed) {
              processedImages.push(processed.path);
              console.log(`   📸 Imagen procesada: ${processed.path}`);
            }
          } catch (imgErr) {
            console.warn(`   ⚠️  Error con imagen: ${imageUrl}`);
          }
        }
      }

      // Construir venue final
      const venue = {
        name: venueData.name || 'Venue sin nombre',
        description: venueData.description || '',
        address: venueData.address,
        external_url: targetUrl,
        images: processedImages,
        map_iframe: venueData.address ? this.generateMapIframe(venueData.address) : null
      };

      await page.close();
      await browser.close();

      console.log(`✅ Scraping completado exitosamente`);
      return venue;

    } catch (err) {
      console.error(`❌ Error en scrapeFromCustomUrl: ${err.message}`);
      if (browser) await browser.close();
      throw err;
    }
  }

  /**
   * 🌐 SCRAPING PRINCIPAL (LISTA DE VENUES)
   * Extrae venues de micecatering.com usando Puppeteer
   * Incluye: nombre, descripción, imágenes
   * 
   * @returns {Promise<Array>} Array de venues scrapeados
   * 
   * Ejemplo:
   *   const venues = await VenueService.scrapeVenues();
   *   // Retorna: [{name, description, images_processed: [...]}]
   */
  async scrapeVenues() {
    let browser;
    try {
      console.log('🚀 Iniciando scraping de micecatering.com...');

      // Lanzar navegador con --no-sandbox para Linux compatibility
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ],
        timeout: this.scraperTimeout
      });

      const page = await browser.newPage();

      // Configurar viewport y user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      );

      // Navegar a página de venues
      const venuesUrl = 'https://micecatering.com/espacios/'; 
      
      console.log(`📍 Navegando a: ${venuesUrl}`);
      await page.goto(venuesUrl, { waitUntil: 'networkidle2', timeout: this.scraperTimeout });

      // Esperar a que carguen elementos de venue (ajustar según estructura HTML real)
      await page.waitForSelector('article, .elementor-post, a[href*="/espacio/"]', {
        timeout: 10000
      }).catch(() => {
        console.warn('⚠️  Selector de venue no encontrado, usando alternativa...');
      });

      // Extraer datos de venues
      const venuesData = await page.evaluate(() => {
        const venues = [];
        
        // Selectores comunes
        const venueElements = document.querySelectorAll(
          'article, .elementor-post, .venue-card'
        );

        venueElements.forEach((el) => {
          try {
            const nameLink = el.querySelector('h2 a, h3 a, a[href*="/espacio/"]');
            const name = nameLink?.textContent?.trim() || 
                        el.querySelector('h2, h3')?.textContent?.trim() || 
                        'Sin nombre';

            const description = el.querySelector('.elementor-post__excerpt, p')?.textContent?.trim() || '';

            // Imágenes
            const img = el.querySelector('img');
            const images = img ? [img.src || img.dataset.src] : [];

            // URL externa
            const externalUrl = nameLink?.href || el.querySelector('a')?.href || '';

            if (name && name !== 'Sin nombre' && externalUrl.includes('/espacio/')) {
              venues.push({
                name,
                description,
                address: '',
                images,
                external_url: externalUrl
              });
            }
          } catch (err) {
            console.error('Error extrayendo venue:', err.message);
          }
        });

        // Fallback a links directos
        if (venues.length === 0) {
            const links = Array.from(document.querySelectorAll('a[href*="/espacio/"]'));
            links.forEach(link => {
                const name = link.textContent.trim();
                const currentHref = link.href;
                if (name.length > 3 && !venues.find(v => v.external_url === currentHref)) {
                    venues.push({
                        name,
                        description: '',
                        address: '',
                        images: [],
                        external_url: currentHref
                    });
                }
            });
        }

        return venues;
      });

      // Complementar con links directos para asegurar capturar todos
      const extraLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href*="/espacio/"]'))
          .map(a => ({ name: a.textContent.trim(), href: a.href }))
          .filter(a => a.name.length > 3 && !a.name.toLowerCase().includes('más'));
      });

      for (const link of extraLinks) {
        if (!venuesData.find(v => v.external_url === link.href)) {
          venuesData.push({
            name: link.name,
            description: '',
            address: '',
            images: [],
            external_url: link.href
          });
        }
      }

      console.log(`✅ Scraping completado: ${venuesData.length} venues encontrados`);

      // Procesar imágenes de cada venue
      const processedVenues = await this.processScrapedVenues(venuesData);

      await page.close();
      await browser.close();

      return processedVenues;

    } catch (err) {
      console.error(`❌ Error en scraping: ${err.message}`);
      if (browser) await browser.close();
      
      // Retornar array vacío para trigger fallback a formulario manual
      return [];
    }
  }

  /**
   * 🖼️ PROCESAR VENUES SCRAPEADOS
   * Descarga y optimiza imágenes, crea HTML para map_iframe
   * Implementa ANTI-HOTLINKING: descarga URLs externas
   * 
   * @private
   * @param {Array} venues - Array de venues brutos del scraping
   * @returns {Promise<Array>} Venues con imágenes procesadas
   */
  async processScrapedVenues(venues) {
    const processed = [];

    for (const venue of venues) {
      try {
        console.log(`🎯 Procesando venue: ${venue.name}`);

        // Descargar y optimizar imágenes
        const processedImages = [];
        if (venue.images && venue.images.length > 0) {
          for (const imageUrl of venue.images) {
            try {
              const processed = await this.downloadAndOptimizeImage(imageUrl, venue.name);
              if (processed) {
                processedImages.push(processed.path);
                console.log(`   📸 Imagen guardada: ${processed.path}`);
              }
            } catch (imgErr) {
              console.warn(`   ⚠️  No se pudo descargar imagen: ${imageUrl}`);
              // Continuar con siguiente imagen
            }
          }
        }

        // Construir venue procesado
        const processedVenue = {
          ...venue,
          images: processedImages.length > 0 ? processedImages : null,
          // Optional: generar iframe de mapa si hay dirección
          map_iframe: venue.address ? this.generateMapIframe(venue.address) : null
        };

        processed.push(processedVenue);

      } catch (err) {
        console.error(`Error procesando venue ${venue.name}: ${err.message}`);
        continue;
      }
    }

    return processed;
  }

  /**
   * 💾 DESCARGAR E OPTIMIZAR IMAGEN
   * Anti-hotlinking: descarga imagen externa → procesa con Sharp
   * 
   * @private
   * @param {String} imageUrl - URL de imagen (http/https)
   * @param {String} venueName - Nombre del venue (para metadata)
   * @param {String} customFolder - (Opcional) Carpeta personalizada para guardar todas las imágenes del venue
   * @returns {Promise<Object>} {path, hash, width, height} o null si falla
   * 
   * Implementa:
   * - Validación de URL
   * - Descarga con timeout
   * - Validación MIME type
   * - Procesamiento con Sharp (resize, webp)
   */
  async downloadAndOptimizeImage(imageUrl, venueName = 'venue', customFolder = null) {
    try {
      // Validar URL
      if (!imageUrl) return null;

      // Convertir URL relativa a absoluta si es necesario
      let fullUrl = imageUrl;
      if (imageUrl.startsWith('/')) {
        fullUrl = `https://www.micecatering.com${imageUrl}`;
      } else if (!imageUrl.startsWith('http')) {
        fullUrl = `https://www.micecatering.com/${imageUrl}`;
      }

      console.log(`🌐 Descargando imagen: ${fullUrl}`);

      // Descargar imagen
      const imageBuffer = await this.downloadImageBuffer(fullUrl);

      if (!imageBuffer || imageBuffer.length === 0) {
        console.warn(`⚠️  Buffer vacío para: ${fullUrl}`);
        return null;
      }

      // Validar que es imagen
      const validation = await ImageService.validateImage(imageBuffer);
      if (!validation.valid) {
        console.warn(`⚠️  No es imagen válida: ${fullUrl}`);
        return null;
      }

      // Procesar con ImageService (resize, webp, etc)
      // Usar customFolder si existe, sino generar uno único
      const filename = new URL(fullUrl).pathname.split('/').pop() || 'venue-image.jpg';
      const result = await ImageService.processImage(imageBuffer, filename, customFolder);

      return result;

    } catch (err) {
      console.error(`❌ Error descargando/optimizando imagen: ${err.message}`);
      return null;
    }
  }

  /**
   * 📥 DESCARGAR BUFFER DE IMAGEN
   * Realiza GET request con timeout y validación
   * 
   * @private
   * @param {String} url - URL de imagen
   * @param {Number} timeout - Timeout en ms (default 10000)
   * @returns {Promise<Buffer>} Buffer de imagen
   */
  downloadImageBuffer(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      
      const request = protocol.get(url, { 
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: timeout
      }, (res) => {
        // Validar status
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${url}`));
          return;
        }

        // Validar content-type (permisivo con .webp y extensiones de imagen)
        const contentType = res.headers['content-type'] || '';
        const urlLower = url.toLowerCase();
        const isImageExtension = urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg') || 
                                 urlLower.endsWith('.png') || urlLower.endsWith('.gif') || 
                                 urlLower.endsWith('.webp') || urlLower.endsWith('.svg');
        
        // Aceptar si Content-Type es imagen O si la URL tiene extensión de imagen
        if (!contentType.startsWith('image/') && !isImageExtension) {
          reject(new Error(`Content-Type no es imagen: ${contentType} (URL: ${url})`));
          return;
        }

        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      });

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Timeout descargando imagen'));
      });
    });
  }

  /**
   * 🗺️ GENERAR IFRAME DE MAPA
   * Crea HTML con Google Maps/OSM embed basado en dirección
   * 
   * @private
   * @param {String} address - Dirección del venue
   * @returns {String} HTML iframe
   */
  generateMapIframe(address) {
    if (!address) return null;

    const encodedAddress = encodeURIComponent(address);
    
    // Usar Google Maps Embed API
    // En producción, usar API key desde .env
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    
    if (apiKey) {
      return `<iframe width="100%" height="400" style="border:0;" src="https://www.google.com/maps/embed/v1/place?q=${encodedAddress}&key=${apiKey}" allowfullscreen="" loading="lazy"></iframe>`;
    }

    // Fallback gratuito y funcional para direcciones
    // Google Maps (unofficial but widely used compatible embed)
    return `<iframe width="100%" height="400" style="border:0;" src="https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed" allowfullscreen="" loading="lazy"></iframe>`;
  }

  /**
   * 💿 INSERTAR O ACTUALIZAR VENUE EN BD
   * Maneja creación new + actualización existing
   * Usa prepared statements para security
   * 
   * @param {Object} venueData - {name, description, address, images, external_url, map_iframe}
   * @param {Number} existingId - ID del venue si es update (optional)
   * @returns {Promise<Number>} ID del venue creado/actualizado
   */
  async insertOrUpdateVenue(venueData, existingId = null) {
    const conn = await pool.getConnection();
    try {
      const imagesJson = venueData.images ? JSON.stringify(venueData.images) : null;

      if (existingId) {
        // UPDATE
        await conn.query(
          `UPDATE venues SET
             name = ?, description = ?,
             address = ?, external_url = ?,
             images = ?, map_iframe = ?
           WHERE id = ?`,
          [
            venueData.name,
            venueData.description,
            venueData.address,
            venueData.external_url,
            imagesJson,
            venueData.map_iframe,
            existingId
          ]
        );
        console.log(`✅ Venue actualizado: ID ${existingId}`);
        return existingId;
      } else {
        // INSERT
        const result = await conn.query(
          `INSERT INTO venues 
             (name, description, address, external_url, images, map_iframe)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            venueData.name,
            venueData.description,
            venueData.address,
            venueData.external_url,
            imagesJson,
            venueData.map_iframe
          ]
        );
        console.log(`✅ Venue creado: ID ${result.insertId}`);
        return Number(result.insertId);  // Convertir BigInt a number
      }
    } catch (err) {
      console.error(`❌ Error en insertOrUpdateVenue: ${err.message}`);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 🔄 SCRAPING + INSERT COMPLETO
   * Realiza scraping y persiste automáticamente en BD
   * Es el punto de entrada principal para sincronización
   * 
   * @returns {Promise<Object>} {success, count, venues, message}
   */
  async syncVenuesFromWebsite() {
    try {
      console.log('🔄 Iniciando sincronización de venues desde website...');

      // Escrapear
      const venues = await this.scrapeVenues();

      if (venues.length === 0) {
        console.warn('⚠️  No se encontraron venues. Revisa selectores o website.');
        return {
          success: false,
          count: 0,
          venues: [],
          message: '❌ Scraping falló. Por favor, usar formulario manual o revisar URL.'
        };
      }

      // Persistir cada venue
      const createdIds = [];
      for (const venue of venues) {
        try {
          const id = await this.insertOrUpdateVenue(venue);
          createdIds.push(id);
        } catch (err) {
          console.error(`Error insertando venue ${venue.name}: ${err.message}`);
          continue;
        }
      }

      console.log(`✅ Sincronización completada: ${createdIds.length}/${venues.length} venues guardados`);

      // 📤 SINCRONIZAR UPLOADS AL VPS
      if (createdIds.length > 0) {
        console.log('📤 Sincronizando imágenes con VPS...');
        try {
          const syncResult = await SyncService.syncUploadsToVPS();
          console.log(`${syncResult.success ? '✅' : '⚠️'} Sync: ${syncResult.message}`);
        } catch (syncErr) {
          // No bloquear el scraping si falla la sincronización
          console.warn(`⚠️  Error en sincronización: ${syncErr.message}`);
        }
      }

      return {
        success: true,
        count: createdIds.length,
        venues: venues,
        message: `✅ ${createdIds.length} venues importados correctamente`
      };

    } catch (err) {
      console.error(`❌ Error en syncVenuesFromWebsite: ${err.message}`);
      return {
        success: false,
        count: 0,
        venues: [],
        message: `❌ Error: ${err.message}`
      };
    }
  }

  /**
   * 📋 OBTENER TODOS LOS VENUES
   * Lista todos los venues disponibles
   * 
   * @param {Object} filters - {search}
   * @returns {Promise<Array>}
   */
  async getAll(filters = {}) {
    const conn = await pool.getConnection();
    try {
      let query = 'SELECT * FROM venues';
      const params = [];
      const conditions = [];

      // Filtro: solo venues scrapeados (con URL de micecatering.com)
      if (filters.scrapedOnly) {
        conditions.push('external_url LIKE "https://micecatering.com/%"');
      }

      // Filtro: búsqueda por nombre
      if (filters.search) {
        conditions.push('(name LIKE ? OR description LIKE ?)');
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY name ASC';

      const result = await conn.query(query, params);

      // Parsear JSON fields (con fallback seguro para datos corruptos)
      return result.map((venue) => ({
        ...venue,
        images: venue.images ? this.safeJsonParse(venue.images, []) : []
      }));

    } catch (err) {
      console.error(`❌ Error en getAll: ${err.message}`);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 🔍 OBTENER VENUE POR ID
   * @param {Number} id - ID del venue
   * @returns {Promise<Object>}
   */
  async getById(id) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query('SELECT * FROM venues WHERE id = ?', [id]);

      if (result.length === 0) {
        throw new Error(`Venue no encontrado: ID ${id}`);
      }

      const venue = result[0];
      return {
        ...venue,
        images: venue.images ? this.safeJsonParse(venue.images, []) : []
      };

    } catch (err) {
      console.error(`❌ Error en getById: ${err.message}`);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * ➕ CREAR VENUE MANUALMENTE (FALLBACK)
   * Cuando scraping falla, permite crear venues por formulario
   * 
   * @param {Object} venueData - Datos del formulario
   * @returns {Promise<Number>} ID del venue creado
   */
  async createManual(venueData) {
    try {
      // Validaciones básicas
      if (!venueData.name || venueData.name.trim() === '') {
        throw new Error('El nombre del venue es obligatorio');
      }

      // En primer momento: solo guardar name + external_url
      // El scraping posterior rellenará description, images, capacidad, etc.
      const processed = {
        name: venueData.name.trim(),
        description: '',
        address: '',
        external_url: venueData.external_url?.trim() || '',
        images: [],
        map_iframe: null
      };

      const id = await this.insertOrUpdateVenue(processed);
      return id;

    } catch (err) {
      console.error(`❌ Error en createManual: ${err.message}`);
      throw err;
    }
  }

  /**
   * ✏️ ACTUALIZAR VENUE MANUALMENTE
   * @param {Number} id - ID del venue
   * @param {Object} venueData - Nuevos datos
   * @returns {Promise<Object>} Venue actualizado
   */
  async updateManual(id, venueData) {
    try {
      if (!venueData.name || venueData.name.trim() === '') {
        throw new Error('El nombre del venue es obligatorio');
      }

      const processed = {
        name: venueData.name.trim(),
        description: venueData.description?.trim() || '',
        address: venueData.address?.trim() || '',
        external_url: venueData.external_url?.trim() || '',
        images: venueData.images || [],
        map_iframe: venueData.map_iframe || null
      };

      await this.insertOrUpdateVenue(processed, id);
      return this.getById(id);

    } catch (err) {
      console.error(`❌ Error en updateManual: ${err.message}`);
      throw err;
    }
  }

  /**
   * 🗑️ ELIMINAR VENUE
   * @param {Number} id - ID del venue
   * @returns {Promise<Boolean>}
   */
  async delete(id) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query('DELETE FROM venues WHERE id = ?', [id]);
      console.log(`✅ Venue eliminado: ID ${id}`);
      return result.affectedRows > 0;
    } catch (err) {
      console.error(`❌ Error en delete: ${err.message}`);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 🕒 GESTIÓN DE COLAS DE SCRAPING (PENDING SCRAPES)
   */

  /**
   * Obtener todas las URLs pendientes de scrape
   */
  async getPendingScrapes() {
    const conn = await pool.getConnection();
    try {
      return await conn.query('SELECT * FROM pending_scrapes ORDER BY status ASC, created_at DESC');
    } catch (err) {
      console.error(`❌ Error en getPendingScrapes: ${err.message}`);
      return [];
    } finally {
      conn.release();
    }
  }

  /**
   * Agregar una nueva URL a la cola de pendientes
   */
  async addPendingScrape(url) {
    const conn = await pool.getConnection();
    try {
      if (!url || !url.startsWith('http')) {
        throw new Error('URL inválida. Debe comenzar con http:// o https://');
      }

      // Limpiar URL
      const cleanUrl = url.trim();

      // 1. Verificar si ya existe en la cola (con status pending o processing)
      const existingInQueue = await conn.query(
        'SELECT id FROM pending_scrapes WHERE url = ? AND (status = "pending" OR status = "processing")',
        [cleanUrl]
      );

      if (existingInQueue.length > 0) {
        return existingInQueue[0].id;
      }

      // 2. Verificar si ya existe en venues
      const existingVenue = await conn.query(
        'SELECT id FROM venues WHERE external_url = ?',
        [cleanUrl]
      );

      if (existingVenue.length > 0) {
        throw new Error('Este venue ya existe en la base de datos.');
      }

      const result = await conn.query(
        'INSERT INTO pending_scrapes (url, status) VALUES (?, "pending") ON DUPLICATE KEY UPDATE status = "pending", error_message = NULL',
        [cleanUrl]
      );
      return result.insertId || result[0]?.insertId;
    } catch (err) {
      console.error(`❌ Error en addPendingScrape: ${err.message}`);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Eliminar una URL de la cola
   */
  async deletePendingScrape(id) {
    const conn = await pool.getConnection();
    try {
      await conn.query('DELETE FROM pending_scrapes WHERE id = ?', [id]);
      return true;
    } catch (err) {
      console.error(`❌ Error en deletePendingScrape: ${err.message}`);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Actualizar estado de un scrape pendiente
   */
  async updatePendingStatus(id, status, errorMsg = null) {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        'UPDATE pending_scrapes SET status = ?, error_message = ? WHERE id = ?',
        [status, errorMsg, id]
      );
      return true;
    } catch (err) {
      console.error(`❌ Error en updatePendingStatus: ${err.message}`);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Eliminar TODOS los venues de la base de datos
   * ⚠️ CUIDADO: Esta operación es irreversible
   * @returns {number} Cantidad de venues eliminados
   */
  async deleteAll() {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query('DELETE FROM venues');
      const count = result.affectedRows;
      console.log(`✅ BASE DE DATOS LIMPIADA: ${count} venues eliminados`);
      return count;
    } catch (err) {
      console.error(`❌ Error en deleteAll: ${err.message}`);
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = new VenueService();
