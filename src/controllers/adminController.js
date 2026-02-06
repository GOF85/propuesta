/**
 * AdminController.js
 * Gestión administrativa: venues, dishes, usuarios
 * - Import/Export de catálogos
 * - Gestión CRUD
 */

const { pool } = require('../config/db');

class AdminController {
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
   * POST /admin/venues/import - Importar venues desde JSON
   */
  async importVenues(req, res) {
    try {
      if (!req.body || !req.body.jsonData) {
        return res.status(400).json({ error: 'Sin datos JSON' });
      }

      // Parsear JSON
      let data;
      try {
        data = JSON.parse(req.body.jsonData);
      } catch (e) {
        return res.status(400).json({ error: 'JSON inválido: ' + e.message });
      }

      // Validar formato
      if (!Array.isArray(data)) {
        return res.status(400).json({ error: 'Debe ser un array de venues' });
      }

      const conn = await pool.getConnection();
      let inserted = 0;
      let updated = 0;
      let errors = [];

      for (const venue of data) {
        try {
          // Validar campos requeridos
          if (!venue.name) {
            errors.push(`Fila: sin nombre`);
            continue;
          }

          // Buscar si ya existe
          const existing = await conn.query(
            'SELECT id FROM venues WHERE name = ?',
            [venue.name]
          );

          const features = typeof venue.features === 'string' 
            ? venue.features 
            : JSON.stringify(venue.features || []);

          const images = typeof venue.images === 'string' 
            ? venue.images 
            : JSON.stringify(venue.images || []);

          if (existing.length > 0) {
            // UPDATE
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
                venue.description || null,
                venue.capacity_cocktail || 0,
                venue.capacity_banquet || 0,
                venue.capacity_theater || 0,
                features,
                venue.address || null,
                venue.map_iframe || null,
                venue.external_url || null,
                images,
                existing[0].id
              ]
            );
            updated++;
          } else {
            // INSERT
            await conn.query(
              `INSERT INTO venues (name, description, capacity_cocktail, capacity_banquet, 
               capacity_theater, features, address, map_iframe, external_url, images)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                venue.name,
                venue.description || null,
                venue.capacity_cocktail || 0,
                venue.capacity_banquet || 0,
                venue.capacity_theater || 0,
                features,
                venue.address || null,
                venue.map_iframe || null,
                venue.external_url || null,
                images
              ]
            );
            inserted++;
          }
        } catch (e) {
          errors.push(`${venue.name}: ${e.message}`);
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
   * GET /admin/venues/export - Exportar venues como JSON
   */
  async exportVenues(req, res) {
    try {
      const conn = await pool.getConnection();
      const venues = await conn.query('SELECT * FROM venues ORDER BY name');
      conn.end();

      // Transformar JSON fields a objetos
      const formatted = venues.map(v => ({
        name: v.name,
        description: v.description,
        capacity_cocktail: v.capacity_cocktail,
        capacity_banquet: v.capacity_banquet,
        capacity_theater: v.capacity_theater,
        features: typeof v.features === 'string' ? JSON.parse(v.features) : v.features,
        address: v.address,
        map_iframe: v.map_iframe,
        external_url: v.external_url,
        images: typeof v.images === 'string' ? JSON.parse(v.images) : v.images
      }));

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=venues-${new Date().toISOString().split('T')[0]}.json`);
      res.send(JSON.stringify(formatted, null, 2));
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
   * POST /admin/dishes/import - Importar platos desde JSON
   */
  async importDishes(req, res) {
    try {
      if (!req.body || !req.body.jsonData) {
        return res.status(400).json({ error: 'Sin datos JSON' });
      }

      let data;
      try {
        data = JSON.parse(req.body.jsonData);
      } catch (e) {
        return res.status(400).json({ error: 'JSON inválido: ' + e.message });
      }

      if (!Array.isArray(data)) {
        return res.status(400).json({ error: 'Debe ser un array de platos' });
      }

      const conn = await pool.getConnection();
      let inserted = 0;
      let updated = 0;
      let errors = [];

      for (const dish of data) {
        try {
          if (!dish.name) {
            errors.push('Fila: sin nombre');
            continue;
          }

          const existing = await conn.query(
            'SELECT id FROM dishes WHERE name = ?',
            [dish.name]
          );

          const allergens = typeof dish.allergens === 'string' 
            ? dish.allergens 
            : JSON.stringify(dish.allergens || []);

          const badges = typeof dish.badges === 'string' 
            ? dish.badges 
            : JSON.stringify(dish.badges || []);

          if (existing.length > 0) {
            // UPDATE
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
                dish.description || null,
                dish.category || 'otro',
                allergens,
                badges,
                dish.image_url || null,
                dish.base_price || 0,
                existing[0].id
              ]
            );
            updated++;
          } else {
            // INSERT
            await conn.query(
              `INSERT INTO dishes (name, description, category, allergens, badges, image_url, base_price)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                dish.name,
                dish.description || null,
                dish.category || 'otro',
                allergens,
                badges,
                dish.image_url || null,
                dish.base_price || 0
              ]
            );
            inserted++;
          }
        } catch (e) {
          errors.push(`${dish.name}: ${e.message}`);
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
   * GET /admin/dishes/export - Exportar platos como JSON
   */
  async exportDishes(req, res) {
    try {
      const conn = await pool.getConnection();
      const dishes = await conn.query('SELECT * FROM dishes ORDER BY category, name');
      conn.end();

      const formatted = dishes.map(d => ({
        name: d.name,
        description: d.description,
        category: d.category,
        allergens: typeof d.allergens === 'string' ? JSON.parse(d.allergens) : d.allergens,
        badges: typeof d.badges === 'string' ? JSON.parse(d.badges) : d.badges,
        image_url: d.image_url,
        base_price: d.base_price
      }));

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=dishes-${new Date().toISOString().split('T')[0]}.json`);
      res.send(JSON.stringify(formatted, null, 2));
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
}

module.exports = new AdminController();
