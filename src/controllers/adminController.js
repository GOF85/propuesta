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
