/**
 * AdminController.js
 * Gestión administrativa: venues, dishes, servicios
 * - Import/Export CSV con papaparse
 * - Gestión CRUD
 */

const { pool } = require('../config/db');
const path = require('path');
const papa = require('papaparse');
const UserService = require('../services/UserService');
const DishService = require('../services/DishService');
const MenuService = require('../services/MenuService');
const ImageService = require('../services/ImageService');
const SustainabilityService = require('../services/SustainabilityService');
const CategoryService = require('../services/CategoryService');

class AdminController {
  /**
   * Parsear CSV a array de objetos
   */
  parseCSV(csvText) {
    return new Promise((resolve, reject) => {
      papa.parse(csvText, {
        header: true,
        trim: true,           // Trimear valores
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => {
          console.log(`✅ Papa.parse completado: ${results.data.length} filas válidas`);
          resolve(results.data);
        },
        error: (err) => {
          console.error('❌ Error en papa.parse:', err);
          reject(err);
        }
      });
    });
  }

  /**
   * Convertir array de objetos a CSV
   */
  toCSV(data, options = {}) {
    return papa.unparse(data, options);
  }
  /**
   * GET /admin/venues - Panel de gestión de venues
   */
  async getVenuesPanel(req, res) {
    try {
      const conn = await pool.getConnection();
      const venues = await conn.query('SELECT * FROM venues ORDER BY created_at DESC');
      conn.end();

      res.render('admin/venues', {
        venues,
        totalVenues: venues.length
      });
    } catch (err) {
      console.error('Error en getVenuesPanel:', err);
      req.flash('error', 'Error al cargar venues');
      res.redirect('/dashboard');
    }
  }

  /**
   * GET /admin/users - Panel de gestión de usuarios
   */
  async getUsersPanel(req, res) {
    try {
      const users = await UserService.getAllUsers();
      res.render('admin/users-list', {
        users,
        totalUsers: users.length
      });
    } catch (err) {
      console.error('Error en getUsersPanel:', err);
      req.flash('error', 'Error al cargar el panel de usuarios');
      res.redirect('/dashboard');
    }
  }

  /**
   * GET /admin/images - Panel de catálogo de imágenes
   */
  async getImagesPanel(req, res) {
    try {
      const images = await ImageService.getCatalog();
      res.render('admin/images-list', {
        images,
        totalImages: images.length
      });
    } catch (err) {
      console.error('Error en getImagesPanel:', err);
      req.flash('error', 'Error al cargar el catálogo de imágenes');
      res.redirect('/admin');
    }
  }

  /**
   * POST /admin/images/upload - Subir imagen al catálogo (Archivo o URL)
   */
  async uploadImage(req, res) {
    try {
      const { customName, imageUrl } = req.body;
      
      if (!customName || customName.trim().length === 0) {
        req.flash('error', 'Debes introducir obligatoriamente un nombre para identificar la imagen');
        return res.redirect('/admin/images');
      }

      let imageBuffer;
      let originalName;

      // Opción A: Subida de archivo local
      if (req.files && req.files.image && req.files.image.size > 0) {
        imageBuffer = req.files.image.data;
        originalName = customName + path.extname(req.files.image.name);
      } 
      // Opción B: Desde URL
      else if (imageUrl && imageUrl.trim().length > 0) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

          const response = await fetch(imageUrl, {
            headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`El servidor remoto respondió con error ${response.status}: ${response.statusText}`);
          }
          
          const arrayBuffer = await response.arrayBuffer();
          imageBuffer = Buffer.from(arrayBuffer);
          
          if (!imageBuffer || imageBuffer.length === 0) {
            throw new Error('La imagen descargada no contiene datos (0 bytes)');
          }

          console.log(`✅ [AdminController] Imagen descargada con éxito: ${imageBuffer.length} bytes`);

          // Validar tipo de imagen con Sharp
          const validation = await ImageService.validateImage(imageBuffer);
          if (!validation.valid) {
            throw new Error(`El archivo descargado no parece una imagen válida (${validation.error})`);
          }
          
          // Deducir extensión
          const contentType = response.headers.get('content-type');
          let ext = '.jpg'; 
          if (contentType) {
            if (contentType.includes('png')) ext = '.png';
            else if (contentType.includes('webp')) ext = '.webp';
            else if (contentType.includes('gif')) ext = '.gif';
            else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';
          } else {
            const parsedUrl = new URL(imageUrl);
            ext = path.extname(parsedUrl.pathname) || '.jpg';
          }
          
          originalName = customName + ext;
          console.log(`📦 [AdminController] Preparado para procesar como: ${originalName}`);
        } catch (fetchErr) {
          const isTimeout = fetchErr.name === 'AbortError';
          console.error('❌ [AdminController] Error descargando URL:', fetchErr.message);
          req.flash('error', isTimeout ? 'La descarga de la imagen tardó demasiado (timeout 15s).' : `Error al obtener la imagen: ${fetchErr.message}`);
          return res.redirect('/admin/images');
        }
      } else {
        req.flash('error', 'Debes seleccionar un archivo o introducir una URL válida');
        return res.redirect('/admin/images');
      }

      await ImageService.addToCatalog(imageBuffer, originalName);
      
      req.flash('success', 'Imagen procesada y añadida al catálogo con éxito');
      res.redirect('/admin/images');
    } catch (err) {
      console.error('Error en uploadImage:', err);
      req.flash('error', 'Error crítico al procesar la imagen: ' + err.message);
      res.redirect('/admin/images');
    }
  }

  /**
   * POST /admin/images/delete/:id - Eliminar imagen del catálogo
   */
  async deleteImage(req, res) {
    try {
      const { id } = req.params;
      await ImageService.deleteFromCatalog(id);
      
      req.flash('success', 'Imagen eliminada del catálogo');
      res.redirect('/admin/images');
    } catch (err) {
      console.error('Error en deleteImage:', err);
      req.flash('error', 'Error al eliminar la imagen: ' + err.message);
      res.redirect('/admin/images');
    }
  }

  /**
   * GET /api/admin/images - API para obtener catálogo (JSON)
   */
  async getImagesApi(req, res) {
    try {
      const images = await ImageService.getCatalog();
      res.json({ success: true, images });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /admin/venues/import - Importar venues desde CSV
   */
  async importVenues(req, res) {
    try {
      if (!req.files || !req.files.csvFile) {
        console.log('❌ importVenues: Sin archivo CSV');
        return res.status(400).json({ error: 'Sin archivo CSV' });
      }

      const csvText = req.files.csvFile.data.toString('utf8');
      console.log('📄 CSV recibido, parseando...');
      const data = await this.parseCSV(csvText);

      console.log(`📊 CSV parseado: ${data.length} filas`);
      data.forEach((row, idx) => {
        console.log(`  Fila ${idx}: name="${row.name}", features="${row.features}"`);
      });

      if (data.length === 0) {
        console.log('❌ CSV vacío');
        return res.status(400).json({ error: 'CSV vacío' });
      }

      const conn = await pool.getConnection();
      let inserted = 0;
      let updated = 0;
      let errors = [];

      for (const row of data) {
        try {
          if (!row.name) {
            console.log('⚠️  Fila sin nombre, saltando');
            errors.push('Fila: sin nombre');
            continue;
          }

          console.log(`\n🔍 Procesando: "${row.name}"`);

          const existing = await conn.query(
            'SELECT id FROM venues WHERE name = ?',
            [row.name]
          );

          console.log(`   Existe: ${existing.length > 0 ? 'SÍ (UPDATE)' : 'NO (INSERT)'}`);

          const images = row.images && row.images.startsWith('[')
            ? row.images
            : JSON.stringify(row.images ? row.images.split('|').map(i => i.trim()) : []);

          console.log(`   images parsed: ${images}`);

          if (existing.length > 0) {
            console.log(`   ↪️  UPDATE id=${existing[0].id}`);
            await conn.query(
              `UPDATE venues SET 
                description = ?, 
                address = ?,
                map_iframe = ?,
                external_url = ?,
                images = ?
               WHERE id = ?`,
              [
                row.description || null,
                row.address || null,
                row.map_iframe || null,
                row.external_url || null,
                images,
                existing[0].id
              ]
            );
            updated++;
            console.log(`   ✅ UPDATE completado`);
          } else {
            console.log(`   ↪️  INSERT nuevo venue`);
            await conn.query(
              `INSERT INTO venues (name, description, address, map_iframe, external_url, images)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                row.name,
                row.description || null,
                row.address || null,
                row.map_iframe || null,
                row.external_url || null,
                images
              ]
            );
            inserted++;
            console.log(`   ✅ INSERT completado`);
          }
        } catch (e) {
          console.error(`❌ Error en fila "${row.name}": ${e.message}`);
          console.error(`   Stack: ${e.stack}`);
          errors.push(`${row.name}: ${e.message}`);
        }
      }

      conn.end();

      console.log(`\n✅ Importación finalizada: ${inserted} INSERT, ${updated} UPDATE`);
      if (errors.length > 0) {
        console.log(`⚠️  Errores: ${errors.join(', ')}`);
      }

      res.json({
        success: true,
        inserted,
        updated,
        total: inserted + updated,
        errors: errors.length > 0 ? errors : null
      });
    } catch (err) {
      console.error('❌ Error en importVenues:', err);
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /admin/venues/export - Exportar venues como CSV
   */
  async exportVenues(req, res) {
    try {
      const conn = await pool.getConnection();
      const venues = await conn.query('SELECT * FROM venues ORDER BY name');
      conn.end();

      const data = venues.map(v => ({
        name: v.name,
        description: v.description,
        address: v.address,
        map_iframe: v.map_iframe,
        external_url: v.external_url,
        images: v.images
      }));

      const csv = this.toCSV(data);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=venues-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (err) {
      console.error('Error en exportVenues:', err);
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * POST /admin/venues/:id/delete - Eliminar venue
   */
  async deleteVenue(req, res) {
    try {
      const { id } = req.params;
      const conn = await pool.getConnection();

      // Verificar que no esté en propuestas
      const inUse = await conn.query(
        'SELECT COUNT(*) as cnt FROM proposal_venues WHERE venue_id = ?',
        [id]
      );

      if (inUse[0].cnt > 0) {
        conn.end();
        return res.status(400).json({ error: 'Venue en uso en propuestas' });
      }

      await conn.query('DELETE FROM venues WHERE id = ?', [id]);
      conn.end();

      req.flash('success', 'Venue eliminado');
      res.redirect('/admin/venues');
    } catch (err) {
      console.error('Error en deleteVenue:', err);
      req.flash('error', 'Error al eliminar venue');
      res.redirect('/admin/venues');
    }
  }

  /**
   * GET /admin - Dashboard de administración
   * Muestra acceso centralizado a todos los paneles admin
   */
  async getDashboard(req, res) {
    try {
      const conn = await pool.getConnection();
      
      // Contar venues
      const venuesResult = await conn.query('SELECT COUNT(*) as count FROM venues');
      const totalVenues = venuesResult[0]?.count || 0;
      
      // Contar platos
      const dishesResult = await conn.query('SELECT COUNT(*) as count FROM dishes');
      const totalDishes = dishesResult[0]?.count || 0;
      
      // Contar servicios (catálogo de menús)
      const servicesResult = await conn.query('SELECT COUNT(*) as count FROM menus');
      const totalServices = servicesResult[0]?.count || 0;
      
      conn.end();

      res.render('admin/dashboard', {
        totalVenues,
        totalDishes,
        totalServices
      });
    } catch (err) {
      console.error('Error en getDashboard:', err);
      req.flash('error', 'Error al cargar panel administrativo');
      res.redirect('/dashboard');
    }
  }

  /**
   * GET /admin/menus - Panel de gestión de menús (Gastronomía)
   */
  async getMenusPanel(req, res) {
    try {
      const { search, category, page = 1 } = req.query;
      const limit = 20;

      const filters = { 
        limit: parseInt(limit), 
        offset: (parseInt(page) - 1) * parseInt(limit) 
      };
      if (search) filters.search = search;
      if (category) filters.category = category;

      const { menus, total } = await MenuService.getAll(filters);
      const categories = await CategoryService.getAll('menu');

      // Si es una petición AJAX (búsqueda en tiempo real), devolvemos JSON
      if (req.query.ajax === '1') {
        return res.json({
          success: true,
          menus,
          total,
          page: parseInt(page),
          totalPages: Math.ceil(total / limit) || 1
        });
      }

      res.render('admin/menus-list', {
        menus: menus || [],
        categories: categories || [],
        total: total || 0,
        page: parseInt(page),
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        search: search || '',
        selectedCategory: category || '',
        flash: req.flash(),
        user: req.user || req.session?.user || null
      });
    } catch (err) {
      console.error('❌ Error en getMenusPanel:', err);
      req.flash('error', 'Error al cargar menús: ' + err.message);
      res.redirect('/admin');
    }
  }

  /**
   * POST /api/admin/upload/image
   * Subir y procesar una imagen con Sharp
   * - Resize a max 1920px
   * - Convertir a WebP
   * - Guardar en /public/uploads/{hash}/
   * 
   * Body: FormData con 'file' (binary)
   * Response: {success, path, filename, hash, sizeKB}
   */
  async uploadImageAPI(req, res) {
    console.log('📡 [API-UPLOAD] Petición recibida en endpoint API');
    try {
      if (!req.files || !req.files.file) {
        console.error('❌ [API-UPLOAD] Error: No se encontró el campo "file" en req.files');
        return res.status(400).json({
          success: false,
          error: 'Sin archivo en request (API se esperaba campo "file")'
        });
      }

      const ImageService = require('../services/ImageService');
      const imageBuffer = req.files.file.data;
      const originalName = req.files.file.name;

      // Validar que es imagen
      const validation = await ImageService.validateImage(imageBuffer);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      // Procesar imagen
      const result = await ImageService.processImage(imageBuffer, originalName);

      res.json({
        success: true,
        path: result.path,
        filename: result.filename,
        hash: result.hash,
        sizeKB: result.sizeKB,
        width: result.width,
        height: result.height,
        message: `Imagen procesada: ${result.sizeKB}KB`
      });
    } catch (err) {
      console.error('❌ Error en uploadImageAPI:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }

  /**
   * POST /api/admin/upload/logo
   * Subir logo del cliente (con extracción automática de color dominante + paleta)
   * Query: proposal_id=123 (opcional)
   * Response: {success, path, filename, brandColor, palette}
   */
  async uploadClientLogo(req, res) {
    try {
      if (!req.files || !req.files.logo) {
        return res.status(400).json({
          success: false,
          error: 'Sin archivo de logo'
        });
      }

      const ImageService = require('../services/ImageService');
      const ProposalService = require('../services/ProposalService');
      const imageBuffer = req.files.logo.data;
      const proposalId = req.query.proposal_id || req.body.proposal_id;

      // Procesar logo con branding completo (resize + color + paleta)
      const result = await ImageService.processLogoWithBranding(imageBuffer, 'logo.png');

      // Si se especifica proposal_id, actualizar la propuesta con el nuevo brand_color
      if (proposalId) {
        await ProposalService.update(proposalId, {
          logo_url: result.path,
          brand_color: result.brandColor
        });

        console.log(`✅ Propuesta #${proposalId} actualizada con branding: ${result.brandColor}`);
      }

      res.json({
        success: true,
        path: result.path,
        filename: result.filename,
        hash: result.hash,
        brandColor: result.brandColor,
        brandRgb: result.brandRgb,
        vibrantPalette: result.vibrantPalette,
        generatedPalette: result.generatedPalette,
        message: 'Logo procesado con branding completo'
      });
    } catch (err) {
      console.error('❌ Error en uploadClientLogo:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }

  /**
   * POST /api/admin/upload/batch
   * Subir múltiples imágenes
   * Response: [{path, filename, hash}, ...]
   */
  async uploadBatch(req, res) {
    try {
      if (!req.files) {
        return res.status(400).json({
          success: false,
          error: 'Sin archivos en request'
        });
      }

      const ImageService = require('../services/ImageService');
      const files = Array.isArray(req.files.files)
        ? req.files.files
        : [req.files.files];

      const results = [];
      for (const file of files) {
        try {
          const result = await ImageService.processImage(file.data, file.name);
          results.push({
            success: true,
            ...result
          });
        } catch (err) {
          results.push({
            success: false,
            filename: file.name,
            error: err.message
          });
        }
      }

      res.json({
        success: true,
        processed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      });
    } catch (err) {
      console.error('❌ Error en uploadBatch:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }

  /**
   * GET /admin - Dashboard administrativo principal
   * Renderiza el panel con estadísticas y accesos rápidos
   */
  async getAdminDashboard(req, res) {
    try {
      const conn = await pool.getConnection();
      
      // Obtener estadísticas
      const [venuesResult] = await conn.query('SELECT COUNT(*) as count FROM venues');
      const [dishesResult] = await conn.query('SELECT COUNT(*) as count FROM dishes');
      const [servicesResult] = await conn.query('SELECT COUNT(*) as count FROM proposal_services');
      
      conn.end();

      res.render('admin/dashboard', {
        totalVenues: venuesResult.count || 0,
        totalDishes: dishesResult.count || 0,
        totalServices: servicesResult.count || 0,
        user: req.session.user,
        title: 'Panel Administrativo'
      });
    } catch (err) {
      console.error('Error en getAdminDashboard:', err);
      req.flash('error', 'Error al cargar dashboard admin');
      res.redirect('/dashboard');
    }
  }

  /**
   * GET /admin/venues - Panel de gestión de venues con scraping
   * Renderizar lista de venues con interfaz de scraping
   */
  async getVenuesListPage(req, res) {
    try {
      const VenueService = require('../services/VenueService');
      const venues = await VenueService.getAll() || [];
      const pendingScrapes = await VenueService.getPendingScrapes() || [];

      // Parsear JSON fields
      const parsedVenues = venues.map(v => ({
        ...v,
        features: typeof v.features === 'string' ? JSON.parse(v.features) : (v.features || []),
        images: typeof v.images === 'string' ? JSON.parse(v.images) : (v.images || [])
      }));

      res.render('admin/venues-list', {
        venues: parsedVenues,
        pendingScrapes: pendingScrapes,
        totalVenues: parsedVenues.length,
        user: req.session.user,
        title: 'Gestión de Venues'
      });
    } catch (err) {
      console.error('Error en getVenuesListPage:', err);
      req.flash('error', 'Error al cargar venues');
      res.redirect('/admin');
    }
  }

  /**
   * GET /admin/venues/queue-template - Descargar plantilla CSV para cola de scraping
   */
  async getQueueTemplate(req, res) {
    try {
      const template = [
        { url: 'https://micecatering.com/espacios/nombre-del-espacio-1' },
        { url: 'https://micecatering.com/espacios/nombre-del-espacio-2' }
      ];
      const csv = papa.unparse(template);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=plantilla_scraping_queue.csv');
      res.status(200).send(csv);
    } catch (err) {
      console.error('Error en getQueueTemplate:', err);
      res.status(500).send('Error al generar plantilla');
    }
  }

  /**
   * POST /api/admin/venues/queue/import - Importar URLs a la cola de scraping
   */
  async importQueue(req, res) {
    try {
      if (!req.files || !req.files.csvFile) {
        return res.status(400).json({ success: false, error: 'No se ha subido ningún archivo' });
      }

      const VenueService = require('../services/VenueService');
      const csvText = req.files.csvFile.data.toString('utf8');
      const data = await this.parseCSV(csvText);

      let imported = 0;
      let errors = 0;

      for (const row of data) {
        if (row.url) {
          try {
            await VenueService.addPendingScrape(row.url);
            imported++;
          } catch (e) {
            console.error(`Error al importar URL ${row.url}:`, e.message);
            errors++;
          }
        }
      }

      res.json({
        success: true,
        message: `Se han añadido ${imported} URLs a la cola. ${errors > 0 ? `Hubo ${errors} errores.` : ''}`,
        imported,
        errors
      });

    } catch (err) {
      console.error('Error en importQueue:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * DELETE /api/admin/image/:hash
   * Eliminar una imagen por su hash
   */
  async deleteImageAPI(req, res) {
    try {
      const { hash } = req.params;
      const ImageService = require('../services/ImageService');

      const result = await ImageService.deleteImage(hash);

      if (result.deleted) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message
        });
      }
    } catch (err) {
      console.error('❌ Error en deleteImageAPI:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }
  // --- USER MANAGEMENT METHODS ---

  /**
   * POST /api/admin/users
   * Crear un nuevo usuario
   */
  async createUser(req, res) {
    try {
      const { name, email, password, role, phone, avatar_url } = req.body;

      // Validación básica
      if (!name || !email || !password || !role) {
        return res.status(400).json({
          success: false,
          error: 'Todos los campos son obligatorios (nombre, email, password, rol)'
        });
      }

      const newUser = await UserService.createUser({
        name,
        email,
        password,
        role,
        phone,
        avatar_url
      });

      res.status(201).json({
        success: true,
        user: newUser,
        message: 'Usuario creado correctamente'
      });
    } catch (err) {
      console.error('❌ Error en createUser:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Error al crear usuario'
      });
    }
  }

  /**
   * GET /api/admin/users/:id
   * Obtener datos de un usuario por ID
   */
  async getUser(req, res) {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        user
      });
    } catch (err) {
      console.error('❌ Error en getUser:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Error al obtener usuario'
      });
    }
  }

  /**
   * PUT /api/admin/users/:id
   * Actualizar un usuario existente
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, email, role, password, phone, avatar_url } = req.body;
      
      console.log(`👤 Actualizando usuario ID: ${id}`, { name, email, role, phone });

      if (!name || !email || !role) {
        return res.status(400).json({
          success: false,
          error: 'Nombre, email y rol son obligatorios'
        });
      }

      const updatedUser = await UserService.updateUser(id, {
        name,
        email,
        role,
        password, // Opcional en el servicio
        phone,
        avatar_url
      });

      res.json({
        success: true,
        user: updatedUser,
        message: 'Usuario actualizado correctamente'
      });
    } catch (err) {
      console.error('❌ Error en updateUser:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Error al actualizar usuario'
      });
    }
  }

  /**
   * DELETE /api/admin/users/:id
   * Eliminar un usuario
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      // Evitar que un usuario se borre a sí mismo (opcional pero recomendado)
      if (req.session.user && req.session.user.id == id) {
        return res.status(400).json({
          success: false,
          error: 'No puedes eliminar tu propia cuenta de administrador'
        });
      }

      const success = await UserService.deleteUser(id);

      if (success) {
        res.json({
          success: true,
          message: 'Usuario eliminado correctamente'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Usuario no encontrado o ya eliminado'
        });
      }
    } catch (err) {
      console.error('❌ Error en deleteUser:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Error al eliminar usuario'
      });
    }
  }
  /**
   * GET /admin/dishes - Panel de gestión de platos
   */
  async getDishesPanel(req, res) {
    try {
      const { category, search, page = 1 } = req.query;
      const limit = 20;

      const filters = { limit, offset: (page - 1) * limit };
      if (category) filters.category = category;
      if (search) filters.search = search;

      const { dishes, total } = await DishService.getAll(filters);
      const totalPages = Math.ceil(total / limit);

      // Si es una petición AJAX (búsqueda en tiempo real), devolvemos JSON
      if (req.query.ajax) {
        return res.json({
          dishes,
          total,
          page: parseInt(page),
          totalPages: Math.ceil(total / limit) || 1
        });
      }

      const categoriesData = await CategoryService.getAll('dish');
      const categories = categoriesData.map(c => c.name);

      res.render('admin/dishes-list', {
        dishes: dishes || [],
        total: total || 0,
        categories: categories || [],
        page: parseInt(page),
        totalPages: Math.ceil(total / limit) || 1,
        search: search || '',
        selectedCategory: category || '',
        flash: req.flash(),
        user: req.user || req.session?.user || null
      });
    } catch (err) {
      console.error('❌ Error CRÍTICO en getDishesPanel:', err);
      console.error(err.stack);
      req.flash('error', 'Error al cargar platos: ' + err.message);
      res.redirect('/admin');
    }
  }

  /**
   * POST /admin/dishes - Crear nuevo plato
   * Body: {name, description, category, allergens[], badges[], images[]}
   */
  async createDish(req, res) {
    try {
      const { name, description, category } = req.body;

      // Parsear arrays JSON (pueden venir como string o como array ya parseado por express.json)
      let allergens = [];
      let badges = [];
      let images = [];

      try {
        const parseMaybe = (val) => {
          if (!val) return [];
          if (Array.isArray(val)) return val;
          if (typeof val === 'string') {
            try { return JSON.parse(val); } catch (e) { return [val]; }
          }
          return [];
        };

        allergens = parseMaybe(req.body.allergens);
        badges = parseMaybe(req.body.badges);
        images = parseMaybe(req.body.images);
      } catch (e) {
        console.warn('⚠️ Error parsing arrays in createDish:', e);
      }

      const dish = await DishService.create({
        name,
        description,
        category,
        allergens,
        badges,
        images
      });

      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.json({
          success: true,
          dish,
          message: 'Plato creado correctamente'
        });
      }

      req.flash('success', 'Plato creado correctamente');
      res.redirect('/admin/dishes');
    } catch (err) {
      console.error('❌ Error en createDish:', err);
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }
      req.flash('error', err.message);
      res.redirect('/admin/dishes');
    }
  }

  /**
   * PUT /admin/dishes/:id - Actualizar plato
   */
  async updateDish(req, res) {
    try {
      const { id } = req.params;
      const { name, description, category } = req.body;

      let allergens = [];
      let badges = [];
      let images = [];

      try {
        const parseMaybe = (val) => {
          if (!val) return [];
          if (Array.isArray(val)) return val;
          if (typeof val === 'string') {
            try { return JSON.parse(val); } catch (e) { return [val]; }
          }
          return [];
        };

        allergens = parseMaybe(req.body.allergens);
        badges = parseMaybe(req.body.badges);
        images = parseMaybe(req.body.images);
      } catch (e) {
        console.warn('⚠️ Error parsing arrays in updateDish:', e);
      }

      const dish = await DishService.update(id, {
        name,
        description,
        category,
        allergens,
        badges,
        images
      });

      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.json({
          success: true,
          dish,
          message: 'Plato actualizado correctamente'
        });
      }

      req.flash('success', 'Plato actualizado correctamente');
      res.redirect('/admin/dishes');
    } catch (err) {
      console.error('❌ Error en updateDish:', err);
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }
      req.flash('error', err.message);
      res.redirect('/admin/dishes');
    }
  }

  /**
   * DELETE /admin/dishes/:id - Eliminar plato
   */
  async deleteDish(req, res) {
    try {
      const { id } = req.params;
      const success = await DishService.delete(id);

      if (success) {
        req.flash('success', 'Plato eliminado correctamente');
      }

      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.json({
          success,
          message: 'Plato eliminado correctamente'
        });
      }

      res.redirect('/admin/dishes');
    } catch (err) {
      console.error('❌ Error en deleteDish:', err);
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }
      req.flash('error', err.message);
      res.redirect('/admin/dishes');
    }
  }

  /**
   * POST /admin/dishes/:id/duplicate - Duplicar plato
   */
  async duplicateDish(req, res) {
    try {
      const { id } = req.params;
      const newId = await DishService.duplicate(id);
      
      console.log(`✅ Plato #${id} duplicado con éxito. Nuevo ID: #${newId}`);

      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.json({ success: true, id: newId });
      }

      req.flash('success', 'Plato duplicado correctamente');
      res.redirect('/admin/dishes');
    } catch (err) {
      console.error('❌ Error en duplicateDish:', err);
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(500).json({ success: false, error: err.message });
      }
      req.flash('error', 'Error al duplicar el plato: ' + err.message);
      res.redirect('/admin/dishes');
    }
  }

  /**
   * POST /admin/dishes/import - Importar platos desde CSV
   */
  async importDishes(req, res) {
    try {
      if (!req.files || !req.files.csvFile) {
        return res.status(400).json({
          success: false,
          error: 'No se envió archivo CSV'
        });
      }

      const csvText = req.files.csvFile.data.toString('utf8');
      const { inserted, updated, errors } = await DishService.importFromCSV(csvText);

      res.json({
        success: true,
        inserted,
        updated,
        errors,
        message: `${inserted} nuevos, ${updated} actualizados`
      });
    } catch (err) {
      console.error('❌ Error en importDishes:', err);
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  }

  /**
   * GET /admin/dishes/export - Exportar platos a CSV
   */
  async exportDishes(req, res) {
    try {
      const csv = await DishService.exportToCSV();

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=dishes-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (err) {
      console.error('❌ Error en exportDishes:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }

  /**
   * POST /admin/menus - Crear nuevo menú
   */
  async createMenu(req, res) {
    try {
      const { name, description, category, base_price, price_model, url_images, video_url } = req.body;
      const normalizedVideoUrl = (video_url || '').trim() || null;

      // Helper robusto para JSON/Array
      const parseMaybe = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          try { return JSON.parse(val); } catch (e) { return [val]; }
        }
        return [];
      };

      const dishIds = parseMaybe(req.body.dishIds);
      const images = parseMaybe(req.body.images);
      const badges = parseMaybe(req.body.badges);

      const menu = await MenuService.create({
        name,
        description,
        category,
        base_price,
        price_model,
        url_images,
        video_url: normalizedVideoUrl,
        dishIds,
        images,
        badges
      });

      // Detector robusto de petición JSON/AJAX
      const isJson = req.xhr || 
                    (req.headers.accept && req.headers.accept.includes('application/json')) ||
                    (req.headers['content-type'] && req.headers['content-type'].includes('application/json'));

      if (isJson) {
        return res.json({
          success: true,
          menu,
          message: 'Menú creado correctamente'
        });
      }

      req.flash('success', 'Menú creado correctamente');
      res.redirect('/admin/menus');
    } catch (err) {
      console.error('❌ Error en createMenu:', err);
      
      const isJson = req.xhr || 
                    (req.headers.accept && req.headers.accept.includes('application/json')) ||
                    (req.headers['content-type'] && req.headers['content-type'].includes('application/json'));

      if (isJson) {
        return res.status(400).json({
          success: false,
          error: err.message || 'Error al crear menú'
        });
      }

      req.flash('error', 'Error al crear menú: ' + (err.message || 'Error desconocido'));
      res.redirect('/admin/menus');
    }
  }

  /**
   * PUT /admin/menus/:id - Actualizar menú
   */
  async updateMenu(req, res) {
    try {
      const { id } = req.params;
      const { name, description, category, base_price, price_model, url_images, video_url } = req.body;
      const normalizedVideoUrl = (video_url || '').trim() || null;

      // Helper robusto para JSON/Array
      const parseMaybe = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          try { return JSON.parse(val); } catch (e) { return [val]; }
        }
        return [];
      };

      const dishIds = req.body.dishIds ? parseMaybe(req.body.dishIds) : undefined;
      const images = req.body.images ? parseMaybe(req.body.images) : undefined;
      const badges = req.body.badges ? parseMaybe(req.body.badges) : undefined;

      const menu = await MenuService.update(id, {
        name,
        description,
        category,
        base_price,
        price_model,
        url_images,
        video_url: normalizedVideoUrl,
        dishIds,
        images,
        badges
      });

      const isJson = req.xhr || 
                    (req.headers.accept && req.headers.accept.includes('application/json')) ||
                    (req.headers['content-type'] && req.headers['content-type'].includes('application/json'));

      if (isJson) {
        return res.json({
          success: true,
          menu,
          message: 'Menú actualizado correctamente'
        });
      }

      req.flash('success', 'Menú actualizado correctamente');
      res.redirect('/admin/menus');
    } catch (err) {
      console.error('❌ Error en updateMenu:', err);
      
      const isJson = req.xhr || 
                    (req.headers.accept && req.headers.accept.includes('application/json')) ||
                    (req.headers['content-type'] && req.headers['content-type'].includes('application/json'));

      if (isJson) {
        return res.status(400).json({
          success: false,
          error: err.message || 'Error al actualizar menú'
        });
      }
      req.flash('error', err.message || 'Error al actualizar menú');
      res.redirect('/admin/menus');
    }
  }

  /**
   * DELETE /admin/menus/:id - Eliminar menú
   */
  async deleteMenu(req, res) {
    try {
      const { id } = req.params;
      const success = await MenuService.delete(id);

      if (success) {
        req.flash('success', 'Menú eliminado correctamente');
      }

      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.json({
          success,
          message: 'Menú eliminado correctamente'
        });
      }

      res.redirect('/admin/menus');
    } catch (err) {
      console.error('❌ Error en deleteMenu:', err);
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }
      req.flash('error', err.message);
      res.redirect('/admin/menus');
    }
  }

  /**
   * POST /admin/menus/:id/duplicate - Duplicar menú
   */
  async duplicateMenu(req, res) {
    try {
      const { id } = req.params;
      const newId = await MenuService.duplicate(id);
      
      console.log(`✅ Menú #${id} duplicado con éxito. Nuevo ID: #${newId}`);

      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.json({ success: true, id: newId });
      }

      req.flash('success', 'Menú duplicado correctamente');
      res.redirect('/admin/menus');
    } catch (err) {
      console.error('❌ Error en duplicateMenu:', err);
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(500).json({ success: false, error: err.message });
      }
      req.flash('error', 'Error al duplicar el menú: ' + err.message);
      res.redirect('/admin/menus');
    }
  }

  /**
   * POST /admin/menus/import - Importar menús desde CSV
   */
  async importMenus(req, res) {
    try {
      if (!req.files || !req.files.csvFile) {
        return res.status(400).json({ success: false, error: 'No se ha subido ningún archivo' });
      }

      const file = req.files.csvFile;
      const content = file.data.toString('utf8');
      
      const { inserted, updated, errors } = await MenuService.importFromCSV(content);

      res.json({
        success: true,
        inserted,
        updated,
        total: inserted + updated,
        errors: errors.length > 0 ? errors : null
      });
    } catch (err) {
      console.error('❌ Error en importMenus:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /admin/menus/export - Exportar menús a CSV
   */
  async exportMenus(req, res) {
    try {
      const csv = await MenuService.exportToCSV();
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=menus-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (err) {
      console.error('Error en exportMenus:', err);
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /admin/menus/template - Descargar plantilla CSV para menús
   */
  async downloadMenusTemplate(req, res) {
    try {
      const headers = ['name', 'category', 'description', 'base_price', 'price_model', 'url_images', 'badges', 'images', 'dishes'];
      const sample = [
        {
          name: 'Menú Cocktail Premium',
          category: 'COCKTAIL',
          description: 'Selección de 12 piezas frías y calientes',
          base_price: 45.50,
          price_model: 'pax',
          url_images: 'https://share.dropbox.com/s/sample_folder',
          badges: 'NUEVO|PREMIUM',
          images: '/uploads/img1.webp|/uploads/img2.webp',
          dishes: 'Croquetas de Jamón; Gazpacho de Fresa; Brocheta de Langostino'
        }
      ];
      
      const csv = this.toCSV(sample, { columns: headers });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=plantilla-menus.csv');
      res.send(csv);
    } catch (err) {
      console.error('Error en downloadMenusTemplate:', err);
      res.status(500).send('Error al generar plantilla');
    }
  }

  /**
   * GET /admin/sustainability
   * Renderiza el panel de edición de sostenibilidad
   */
  async getSustainabilityPanel(req, res) {
    try {
      const config = SustainabilityService.getConfig();
      res.render('admin/sustainability', {
        config,
        title: 'Gestión Sostenibilidad'
      });
    } catch (err) {
      console.error('Error en getSustainabilityPanel:', err);
      req.flash('error', 'Error al cargar panel de sostenibilidad');
      res.redirect('/admin');
    }
  }

  /**
   * POST /admin/sustainability
   * Actualiza la configuración de sostenibilidad
   */
  async updateSustainability(req, res) {
    try {
      // En un entorno de producción, aquí validaríamos cada campo.
      // Para este MVP, procesamos el JSON enviado por el editor.
      const { sustainabilityConfig } = req.body;
      
      if (!sustainabilityConfig) {
        throw new Error('No se recibió la configuración');
      }

      const configData = JSON.parse(sustainabilityConfig);
      await SustainabilityService.saveConfig(configData);

      req.flash('success', 'Configuración de sostenibilidad actualizada correctamente');
      res.redirect('/admin/sustainability');
    } catch (err) {
      console.error('Error en updateSustainability:', err);
      req.flash('error', 'Error al guardar configuración: ' + (err.message || 'Formato JSON inválido'));
      res.redirect('/admin/sustainability');
    }
  }

  /**
   * GET /admin/categories - Gestión de categorías
   */
  async getCategoriesPanel(req, res) {
    try {
      const dishCategories = await CategoryService.getAll('dish');
      const menuCategories = await CategoryService.getAll('menu');

      res.render('admin/categories-list', {
        dishCategories,
        menuCategories,
        flash: req.flash(),
        user: req.user || req.session?.user || null
      });
    } catch (err) {
      console.error('Error en getCategoriesPanel:', err);
      req.flash('error', 'Error al cargar categorías');
      res.redirect('/admin');
    }
  }

  /**
   * POST /admin/categories - Crear categoría
   */
  async createCategory(req, res) {
    try {
      const { name, type, order_index } = req.body;
      if (!name || !type) throw new Error('Nombre y tipo son obligatorios');
      
      await CategoryService.create({ name, type, order_index: parseInt(order_index) || 0 });
      res.json({ success: true });
    } catch (err) {
      console.error('Error en createCategory:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /admin/categories/:id - Actualizar categoría (reutilizando POST para simplificar con forms si fuera necesario, o PUT)
   */
  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, type, order_index } = req.body;
      await CategoryService.update(id, { name, type, order_index: parseInt(order_index) || 0 });
      res.json({ success: true });
    } catch (err) {
      console.error('Error en updateCategory:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * DELETE /admin/categories/:id - Eliminar categoría
   */
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      await CategoryService.delete(id);
      res.json({ success: true });
    } catch (err) {
      console.error('Error en deleteCategory:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new AdminController();
