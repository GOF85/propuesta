/**
 * AdminController.js
 * Gestión administrativa: venues, dishes, servicios
 * - Import/Export CSV con papaparse
 * - Gestión CRUD
 */

const { pool } = require('../config/db');
const papa = require('papaparse');

class AdminController {
  /**
   * Parsear CSV a array de objetos
   */
  parseCSV(csvText) {
    return new Promise((resolve, reject) => {
      papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => resolve(results.data),
        error: (err) => reject(err)
      });
    });
  }

  /**
   * Convertir array de objetos a CSV
   */
  toCSV(data) {
    return papa.unparse(data);
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
   * POST /admin/venues/import - Importar venues desde CSV
   */
  async importVenues(req, res) {
    try {
      if (!req.files || !req.files.csvFile) {
        return res.status(400).json({ error: 'Sin archivo CSV' });
      }

      const csvText = req.files.csvFile.data.toString('utf8');
      const data = await this.parseCSV(csvText);

      if (data.length === 0) {
        return res.status(400).json({ error: 'CSV vacío' });
      }

      const conn = await pool.getConnection();
      let inserted = 0;
      let updated = 0;
      let errors = [];

      for (const row of data) {
        try {
          if (!row.name) {
            errors.push('Fila: sin nombre');
            continue;
          }

          const existing = await conn.query(
            'SELECT id FROM venues WHERE name = ?',
            [row.name]
          );

          // Parsear JSON fields si vienen como texto
          const features = row.features && row.features.startsWith('[')
            ? row.features
            : JSON.stringify(row.features ? row.features.split('|').map(f => f.trim()) : []);

          const images = row.images && row.images.startsWith('[')
            ? row.images
            : JSON.stringify(row.images ? row.images.split('|').map(i => i.trim()) : []);

          if (existing.length > 0) {
            await conn.query(
              `UPDATE venues SET 
                description = ?, 
                capacity_cocktail = ?, 
                capacity_banquet = ?, 
                capacity_theater = ?,
                features = ?,
                address = ?,
                map_iframe = ?,
                external_url = ?,
                images = ?
               WHERE id = ?`,
              [
                row.description || null,
                parseInt(row.capacity_cocktail) || 0,
                parseInt(row.capacity_banquet) || 0,
                parseInt(row.capacity_theater) || 0,
                features,
                row.address || null,
                row.map_iframe || null,
                row.external_url || null,
                images,
                existing[0].id
              ]
            );
            updated++;
          } else {
            await conn.query(
              `INSERT INTO venues (name, description, capacity_cocktail, capacity_banquet, 
               capacity_theater, features, address, map_iframe, external_url, images)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                row.name,
                row.description || null,
                parseInt(row.capacity_cocktail) || 0,
                parseInt(row.capacity_banquet) || 0,
                parseInt(row.capacity_theater) || 0,
                features,
                row.address || null,
                row.map_iframe || null,
                row.external_url || null,
                images
              ]
            );
            inserted++;
          }
        } catch (e) {
          errors.push(`${row.name}: ${e.message}`);
        }
      }

      conn.end();

      res.json({
        success: true,
        inserted,
        updated,
        total: inserted + updated,
        errors: errors.length > 0 ? errors : null
      });
    } catch (err) {
      console.error('Error en importVenues:', err);
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
        capacity_cocktail: v.capacity_cocktail,
        capacity_banquet: v.capacity_banquet,
        capacity_theater: v.capacity_theater,
        features: v.features,
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
   * GET /admin/dishes - Panel de gestión de platos
   */
  async getDishesPanel(req, res) {
    try {
      const conn = await pool.getConnection();
      const dishes = await conn.query('SELECT * FROM dishes ORDER BY category, name');
      conn.end();

      res.render('admin/dishes', {
        dishes,
        totalDishes: dishes.length
      });
    } catch (err) {
      console.error('Error en getDishesPanel:', err);
      req.flash('error', 'Error al cargar platos');
      res.redirect('/dashboard');
    }
  }

  /**
   * POST /admin/dishes/import - Importar platos desde CSV
   */
  async importDishes(req, res) {
    try {
      if (!req.files || !req.files.csvFile) {
        return res.status(400).json({ error: 'Sin archivo CSV' });
      }

      const csvText = req.files.csvFile.data.toString('utf8');
      const data = await this.parseCSV(csvText);

      if (data.length === 0) {
        return res.status(400).json({ error: 'CSV vacío' });
      }

      const conn = await pool.getConnection();
      let inserted = 0, updated = 0, errors = [];

      for (const row of data) {
        try {
          if (!row.name) {
            errors.push('Fila: sin nombre');
            continue;
          }

          const existing = await conn.query(
            'SELECT id FROM dishes WHERE name = ?',
            [row.name]
          );

          // Parsear alérgenos (separados por |)
          const allergens = row.allergens && row.allergens.startsWith('[')
            ? row.allergens
            : JSON.stringify(row.allergens ? row.allergens.split('|').map(a => a.trim()) : []);

          const badges = row.badges && row.badges.startsWith('[')
            ? row.badges
            : JSON.stringify(row.badges ? row.badges.split('|').map(b => b.trim()) : []);

          if (existing.length > 0) {
            await conn.query(
              `UPDATE dishes SET 
                description = ?, 
                category = ?,
                allergens = ?,
                badges = ?,
                image_url = ?,
                base_price = ?
               WHERE id = ?`,
              [
                row.description || null,
                row.category || 'otro',
                allergens,
                badges,
                row.image_url || null,
                parseFloat(row.base_price) || 0,
                existing[0].id
              ]
            );
            updated++;
          } else {
            await conn.query(
              `INSERT INTO dishes (name, description, category, allergens, badges, image_url, base_price)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                row.name,
                row.description || null,
                row.category || 'otro',
                allergens,
                badges,
                row.image_url || null,
                parseFloat(row.base_price) || 0
              ]
            );
            inserted++;
          }
        } catch (e) {
          errors.push(`${row.name}: ${e.message}`);
        }
      }

      conn.end();

      res.json({
        success: true,
        inserted,
        updated,
        total: inserted + updated,
        errors: errors.length > 0 ? errors : null
      });
    } catch (err) {
      console.error('Error en importDishes:', err);
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /admin/dishes/export - Exportar platos como CSV
   */
  async exportDishes(req, res) {
    try {
      const conn = await pool.getConnection();
      const dishes = await conn.query('SELECT * FROM dishes ORDER BY category, name');
      conn.end();

      const data = dishes.map(d => ({
        name: d.name,
        description: d.description,
        category: d.category,
        allergens: d.allergens,
        badges: d.badges,
        image_url: d.image_url,
        base_price: d.base_price
      }));

      const csv = this.toCSV(data);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=dishes-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (err) {
      console.error('Error en exportDishes:', err);
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * POST /admin/dishes/:id/delete - Eliminar plato
   */
  async deleteDish(req, res) {
    try {
      const { id } = req.params;
      const conn = await pool.getConnection();

      // Verificar que no esté en propuestas
      const inUse = await conn.query(
        'SELECT COUNT(*) as cnt FROM proposal_items WHERE dish_id = ?',
        [id]
      );

      if (inUse[0].cnt > 0) {
        conn.end();
        return res.status(400).json({ error: 'Plato en uso en propuestas' });
      }

      await conn.query('DELETE FROM dishes WHERE id = ?', [id]);
      conn.end();

      req.flash('success', 'Plato eliminado');
      res.redirect('/admin/dishes');
    } catch (err) {
      console.error('Error en deleteDish:', err);
      req.flash('error', 'Error al eliminar plato');
      res.redirect('/admin/dishes');
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
      
      // Contar servicios
      const servicesResult = await conn.query('SELECT COUNT(DISTINCT service_id) as count FROM proposal_services');
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
   * GET /admin/services - Panel de gestión de servicios/menús
   */
  async getServicesPanel(req, res) {
    try {
      const conn = await pool.getConnection();
      const services = await conn.query(
        `SELECT ps.*, p.client_name 
         FROM proposal_services ps
         JOIN proposals p ON ps.proposal_id = p.id
         ORDER BY ps.created_at DESC
         LIMIT 100`
      );
      conn.end();

      res.render('admin/services', {
        services,
        totalServices: services.length
      });
    } catch (err) {
      console.error('Error en getServicesPanel:', err);
      req.flash('error', 'Error al cargar servicios');
      res.redirect('/dashboard');
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
  async uploadImage(req, res) {
    try {
      if (!req.files || !req.files.file) {
        return res.status(400).json({
          success: false,
          error: 'Sin archivo en request'
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
      console.error('❌ Error en uploadImage:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }

  /**
   * POST /api/admin/upload/logo
   * Subir logo del cliente (con extracción de color dominante)
   * Usa ImageService para procesar + node-vibrant para color
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
      const imageBuffer = req.files.logo.data;

      // Procesar imagen
      const result = await ImageService.processImage(imageBuffer, 'logo.png');

      // Extraer color dominante
      const colorInfo = await ImageService.extractDominantColor(imageBuffer);

      res.json({
        success: true,
        path: result.path,
        filename: result.filename,
        hash: result.hash,
        color: colorInfo,
        message: 'Logo procesado correctamente'
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
      const venues = await VenueService.getAll();

      // Parsear JSON fields
      const parsedVenues = venues.map(v => ({
        ...v,
        features: typeof v.features === 'string' ? JSON.parse(v.features) : (v.features || []),
        images: typeof v.images === 'string' ? JSON.parse(v.images) : (v.images || [])
      }));

      res.render('admin/venues-list', {
        venues: parsedVenues,
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
   * DELETE /api/admin/image/:hash
   * Eliminar una imagen por su hash
   */
  async deleteImage(req, res) {
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
      console.error('❌ Error en deleteImage:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }
}

module.exports = new AdminController();
