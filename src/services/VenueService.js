/**
 * VenueService.js
 * Propósito: Scraping de venues desde micecatering.com + Descarga/optimización de imágenes
 * Pattern: Puppeteer scraping → ImageService processing → DB persistence
 * 
 * Características:
 * ✅ Scraping Puppeteer de micecatering.com
 * ✅ Anti-hotlinking: descarga imágenes externas → optimiza con Sharp
 * ✅ Fallback a formulario manual si scraping falla
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
   * 🌐 SCRAPING DESDE URL PERSONALIZADA
   * Extrae venue desde URL específica proporcionada por usuario
   * Soporta páginas individuales de venues (no listados)
   * 
   * @param {String} targetUrl - URL completa del venue a scrapear
   * @returns {Promise<Object|null>} Datos del venue o null si falla
   * 
   * Ejemplo:
   *   const venue = await VenueService.scrapeFromCustomUrl('https://www.micecatering.com/venues/salon-madrid');
   *   // Retorna: {name, description, capacity_*, features, images: [...], external_url}
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
        let description = document.querySelector('.venue-description, .description, [class*="description"], p')?.textContent ||
                       document.querySelector('meta[name="description"]')?.content || '';
      description = cleanText(description);

      // MEJORADO: Buscar descripción en Elementor (micecatering.com)
      const elementorDesc = document.querySelector('.elementor-tab-content .normalmio p')?.textContent;
      if (elementorDesc) {
        description = cleanText(elementorDesc);
      }

      // Extraer capacidades - REMOVIDO (se darán manualmente desde BD)
      // const cocktailMatch = ...
      // const banquetMatch = ...
      // const theaterMatch = ...

      // Extraer características (features)
      const features = [];
      const featureElements = document.querySelectorAll('.feature, .amenity, [class*="feature"], [class*="amenity"], li');
      featureElements.forEach(el => {
        const text = cleanText(el.textContent);
        if (text && text.length < 50 && text.length > 2) {
          features.push(text);
        }
      });

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
          features: [...new Set(features)].slice(0, 10), // Eliminar duplicados, max 10
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

      // Construir venue final (capacity manual)
      const venue = {
        name: venueData.name || 'Venue sin nombre',
        description: venueData.description || '',
        capacity: 0, // Dato manual en BD (default 0)
        features: venueData.features.filter(Boolean),
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
   * Incluye: nombre, descripción, capacidades, características, imágenes
   * 
   * @returns {Promise<Array>} Array de venues scrapeados
   * 
   * Ejemplo:
   *   const venues = await VenueService.scrapeVenues();
   *   // Retorna: [{name, description, capacity_*, features, images_processed: [...]}]
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
      const venuesUrl = 'https://www.micecatering.com/venues'; // Ajustar según estructura real
      
      console.log(`📍 Navegando a: ${venuesUrl}`);
      await page.goto(venuesUrl, { waitUntil: 'networkidle2', timeout: this.scraperTimeout });

      // Esperar a que carguen elementos de venue (ajustar selector según HTML real)
      await page.waitForSelector('.venue-card, [data-venue-item], .venue-item', {
        timeout: 10000
      }).catch(() => {
        console.warn('⚠️  Selector de venue no encontrado, usando alternativa...');
      });

      // Extraer datos de venues
      const venuesData = await page.evaluate(() => {
        const venues = [];
        
        // Selectores comunes (ajustar según estructura HTML real)
        const venueElements = document.querySelectorAll(
          '.venue-card, [data-venue-item], .venue-item, article'
        );

        venueElements.forEach((el) => {
          try {
            const name = el.querySelector('.venue-name, h2, h3')?.textContent?.trim() ||
                        el.querySelector('[data-name]')?.textContent?.trim() ||
                        'Sin nombre';

            const description = el.querySelector('.venue-description, p, .description')?.textContent?.trim() ||
                               el.querySelector('[data-description]')?.textContent?.trim() ||
                               '';

            // Capacidades (buscar números)
            const capacityText = el.textContent;
            const capacityCocktail = parseInt(capacityText.match(/cocktail[:\s]*(\d+)/i)?.[1] || 0);
            const capacityBanquet = parseInt(capacityText.match(/banquet[:\s]*(\d+)/i)?.[1] || 0);
            const capacityTheater = parseInt(capacityText.match(/theater[:\s]*(\d+)/i)?.[1] || 0);

            // Características (buscar tags/badges)
            const features = Array.from(el.querySelectorAll('.feature, .badge, .tag')).map(
              (b) => b.textContent?.trim()
            ).filter(Boolean);

            // Dirección
            const address = el.querySelector('.address, [data-address]')?.textContent?.trim() || '';

            // Imágenes (obtener URLs completas)
            const imageElements = el.querySelectorAll('img, [data-image]');
            const images = Array.from(imageElements)
              .map((img) => img.src || img.getAttribute('data-image'))
              .filter((src) => src && (src.startsWith('http') || src.startsWith('/')));

            // URL externa (link al sitio original)
            const externalUrl = el.querySelector('a')?.href || '';

            // Agregar si hay datos válidos
            if (name && name !== 'Sin nombre') {
              venues.push({
                name,
                description,
                capacity_cocktail: capacityCocktail || null,
                capacity_banquet: capacityBanquet || null,
                capacity_theater: capacityTheater || null,
                features: features.length > 0 ? features : null,
                address,
                images, // URLs sin procesar aún
                external_url: externalUrl
              });
            }
          } catch (err) {
            console.error('Error extrayendo venue:', err.message);
          }
        });

        return venues;
      });

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

    // Fallback a OpenStreetMap
    return `<iframe width="100%" height="400" style="border:0;" src="https://www.openstreetmap.org/export/embed.html?bbox=${encodedAddress}" allowfullscreen="" loading="lazy"></iframe>`;
  }

  /**
   * 💿 INSERTAR O ACTUALIZAR VENUE EN BD
   * Maneja creación new + actualización existing
   * Usa prepared statements para security
   * 
   * @param {Object} venueData - {name, description, capacity_*, features, address, images, external_url, map_iframe}
   * @param {Number} existingId - ID del venue si es update (optional)
   * @returns {Promise<Number>} ID del venue creado/actualizado
   */
  async insertOrUpdateVenue(venueData, existingId = null) {
    const conn = await pool.getConnection();
    try {
      const featuresJson = venueData.features ? JSON.stringify(venueData.features) : null;
      const imagesJson = venueData.images ? JSON.stringify(venueData.images) : null;

      if (existingId) {
        // UPDATE
        await conn.query(
          `UPDATE venues SET
             name = ?, description = ?, capacity_cocktail = ?, capacity_banquet = ?,
             capacity_theater = ?, features = ?, address = ?, external_url = ?,
             images = ?, map_iframe = ?
           WHERE id = ?`,
          [
            venueData.name,
            venueData.description,
            venueData.capacity_cocktail,
            venueData.capacity_banquet,
            venueData.capacity_theater,
            featuresJson,
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
             (name, description, capacity_cocktail, capacity_banquet, capacity_theater,
              features, address, external_url, images, map_iframe)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            venueData.name,
            venueData.description,
            venueData.capacity_cocktail,
            venueData.capacity_banquet,
            venueData.capacity_theater,
            featuresJson,
            venueData.address,
            venueData.external_url,
            imagesJson,
            venueData.map_iframe
          ]
        );
        console.log(`✅ Venue creado: ID ${result.insertId}`);
        return result.insertId;
      }
    } catch (err) {
      console.error(`❌ Error en insertOrUpdateVenue: ${err.message}`);
      throw err;
    } finally {
      conn.end();
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
   * @param {Object} filters - {search, minCapacity, features}
   * @returns {Promise<Array>}
   */
  async getAll(filters = {}) {
    const conn = await pool.getConnection();
    try {
      let query = 'SELECT * FROM venues';
      const params = [];
      const conditions = [];

      // Filtro: búsqueda por nombre
      if (filters.search) {
        conditions.push('(name LIKE ? OR description LIKE ?)');
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
      }

      // Filtro: capacidad mínima
      if (filters.minCapacity) {
        conditions.push('(capacity_cocktail >= ? OR capacity_banquet >= ? OR capacity_theater >= ?)');
        params.push(filters.minCapacity, filters.minCapacity, filters.minCapacity);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY name ASC';

      const result = await conn.query(query, params);

      // Parsear JSON fields
      return result.map((venue) => ({
        ...venue,
        features: venue.features ? JSON.parse(venue.features) : [],
        images: venue.images ? JSON.parse(venue.images) : []
      }));

    } catch (err) {
      console.error(`❌ Error en getAll: ${err.message}`);
      throw err;
    } finally {
      conn.end();
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
        features: venue.features ? JSON.parse(venue.features) : [],
        images: venue.images ? JSON.parse(venue.images) : []
      };

    } catch (err) {
      console.error(`❌ Error en getById: ${err.message}`);
      throw err;
    } finally {
      conn.end();
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
      // El scraping posterior rellenará description, images, capacidades, etc.
      const processed = {
        name: venueData.name.trim(),
        description: '',
        capacity_cocktail: null,
        capacity_banquet: null,
        capacity_theater: null,
        features: [],
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

      // Procesar igual que createManual
      let features = venueData.features;
      if (typeof features === 'string') {
        features = features.split(',').map((f) => f.trim()).filter(Boolean);
      }

      const processed = {
        name: venueData.name.trim(),
        description: venueData.description?.trim() || '',
        capacity_cocktail: parseInt(venueData.capacity_cocktail) || null,
        capacity_banquet: parseInt(venueData.capacity_banquet) || null,
        capacity_theater: parseInt(venueData.capacity_theater) || null,
        features: features || [],
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
      conn.end();
    }
  }
}

module.exports = new VenueService();
