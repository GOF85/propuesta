/**
 * DishService
 * Gestión de platos: CRUD, búsqueda, import/export CSV
 */
const { pool } = require('../config/db');
const { v4: uuid } = require('uuid');
const papa = require('papaparse');
const ImageService = require('./ImageService');

/**
 * Helper para parsear JSON de la BD de forma segura.
 * MariaDB driver puede devolver objetos directamente para columnas JSON.
 */
const safeParse = (val) => {
  if (val === null || val === undefined) return [];
  if (typeof val === 'string') {
    if (!val.trim()) return [];
    try { return JSON.parse(val); } catch (e) { return []; }
  }
  if (Array.isArray(val)) return val;
  return [];
};

class DishService {
  /**
   * Obtener todos los platos con filtros opcionales
   * @param {Object} filters - {category?, search?, limit?, offset?}
   * @returns {Promise<{dishes: Array, total: Number}>}
   */
  async getAll(filters = {}) {
    const conn = await pool.getConnection();
    try {
      const { category, search, limit = 100, offset = 0 } = filters;

      let query = 'SELECT * FROM dishes WHERE 1=1';
      const params = [];

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }

      if (search) {
        query += ' AND (name LIKE ? OR description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const dishes = await conn.query(query, params);

      // Obtener total
      let countQuery = 'SELECT COUNT(*) as total FROM dishes WHERE 1=1';
      const countParams = [];
      if (category) {
        countQuery += ' AND category = ?';
        countParams.push(category);
      }
      if (search) {
        countQuery += ' AND (name LIKE ? OR description LIKE ?)';
        countParams.push(`%${search}%`, `%${search}%`);
      }

      const countResult = await conn.query(countQuery, countParams);
      const total = Number(countResult[0]?.total || 0);

      // Parsear images JSON
      return {
        dishes: dishes.map(d => ({
          ...d,
          images: safeParse(d.images),
          allergens: safeParse(d.allergens),
          badges: safeParse(d.badges)
        })),
        total
      };
    } finally {
      conn.release();
    }
  }

  /**
   * Obtener plato por ID
   * @param {Number} id
   * @returns {Promise<Object|null>}
   */
  async getById(id) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query('SELECT * FROM dishes WHERE id = ?', [id]);
      if (result.length === 0) return null;

      const dish = result[0];
      return {
        ...dish,
        images: safeParse(dish.images),
        allergens: safeParse(dish.allergens),
        badges: safeParse(dish.badges)
      };
    } finally {
      conn.release();
    }
  }

  /**
   * Crear nuevo plato
   * @param {Object} data - {name, description, category, allergens, badges, images}
   * allergens, badges son arrays de strings
   * images es array de URLs
   * @returns {Promise<{id: Number, ...data}>}
   */
  async create(data) {
    const conn = await pool.getConnection();
    try {
      const {
        name,
        description = '',
        category = 'otro',
        allergens = [],
        badges = [],
        images = []
      } = data;

      // Validar requeridos
      if (!name || name.trim().length === 0) {
        throw new Error('El nombre del plato es requerido');
      }

      // Verificar duplicado
      const existing = await conn.query('SELECT id FROM dishes WHERE name = ?', [name]);
      if (existing.length > 0) {
        throw new Error(`Ya existe un plato con el nombre "${name}"`);
      }

      const query = `
        INSERT INTO dishes (name, description, category, allergens, badges, images)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const result = await conn.query(query, [
        name.trim(),
        description.trim(),
        category,
        JSON.stringify(allergens),
        JSON.stringify(badges),
        JSON.stringify(images)
      ]);

      return {
        id: result.insertId,
        name,
        description,
        category,
        allergens,
        badges,
        images
      };
    } finally {
      conn.release();
    }
  }

  /**
   * Actualizar plato
   * @param {Number} id
   * @param {Object} data - {name?, description?, category?, allergens?, badges?, images?}
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    const conn = await pool.getConnection();
    try {
      const existing = await conn.query('SELECT * FROM dishes WHERE id = ?', [id]);
      if (existing.length === 0) {
        throw new Error('Plato no encontrado');
      }

      const current = existing[0];
      const updates = {
        name: data.name ?? current.name,
        description: data.description ?? current.description,
        category: data.category ?? current.category,
        allergens: data.allergens ?? safeParse(current.allergens),
        badges: data.badges ?? safeParse(current.badges),
        images: data.images ?? safeParse(current.images)
      };

      // Si cambia el nombre, verificar duplicado
      if (updates.name !== current.name) {
        const dup = await conn.query('SELECT id FROM dishes WHERE name = ? AND id != ?', [
          updates.name,
          id
        ]);
        if (dup.length > 0) {
          throw new Error(`Ya existe otro plato con el nombre "${updates.name}"`);
        }
      }

      const query = `
        UPDATE dishes 
        SET name = ?, description = ?, category = ?, allergens = ?, badges = ?, images = ?
        WHERE id = ?
      `;

      await conn.query(query, [
        updates.name,
        updates.description,
        updates.category,
        JSON.stringify(updates.allergens),
        JSON.stringify(updates.badges),
        JSON.stringify(updates.images),
        id
      ]);

      return { id, ...updates };
    } finally {
      conn.release();
    }
  }

  /**
   * Eliminar plato (soft delete: marcar como inactivo)
   * O verificar si está en uso antes de eliminar
   * @param {Number} id
   * @returns {Promise<Boolean>}
   */
  async delete(id) {
    const conn = await pool.getConnection();
    try {
      await conn.query('START TRANSACTION');

      // 1. Desvincular de propuestas (los ítems en propuestas ya son adhoc/copiados)
      await conn.query('UPDATE proposal_items SET dish_id = NULL WHERE dish_id = ?', [id]);

      // 2. Eliminar de la composición de menús (Catálogo Maestro)
      await conn.query('DELETE FROM menu_dishes WHERE dish_id = ?', [id]);

      // 3. Eliminar el plato finalmente
      const result = await conn.query('DELETE FROM dishes WHERE id = ?', [id]);
      
      await conn.query('COMMIT');
      return result.affectedRows > 0;
    } catch (e) {
      if (conn) await conn.query('ROLLBACK');
      throw e;
    } finally {
      conn.release();
    }
  }

  /**
   * Importar platos desde CSV
   * Formato: name, description, category, allergens, badges, images, base_price
   * allergens/badges/images son pipe-separated: "gluten|lacteos|huevo"
   * @param {String} csvText
   * @returns {Promise<{inserted: Number, updated: Number, errors: Array}>}
   */
  async importFromCSV(csvText) {
    return new Promise((resolve, reject) => {
      papa.parse(csvText, {
        header: true,
        trim: true,
        skipEmptyLines: true,
        dynamicTyping: false, // Keep as strings for control
        complete: async (results) => {
          const conn = await pool.getConnection();
          try {
            let inserted = 0;
            let updated = 0;
            const errors = [];

            for (const row of results.data) {
              try {
                // Parsear campos pipe-separated
                const allergens = row.allergens
                  ? row.allergens
                      .split('|')
                      .map(a => a.trim())
                      .filter(a => a.length > 0)
                  : [];

                const badges = row.badges
                  ? row.badges
                      .split('|')
                      .map(b => b.trim())
                      .filter(b => b.length > 0)
                  : [];

                const images = row.images
                  ? row.images
                      .split('|')
                      .map(img => img.trim())
                      .filter(img => img.length > 0)
                  : [];

                const name = row.name?.trim();
                const description = row.description?.trim() || '';
                const category = row.category?.trim() || 'otro';

                if (!name) {
                  errors.push({
                    row: row,
                    error: 'El nombre es requerido'
                  });
                  continue;
                }

                // Upsert por nombre
                const existing = await conn.query('SELECT id FROM dishes WHERE name = ?', [name]);

                if (existing.length > 0) {
                  // UPDATE
                  await conn.query(
                    'UPDATE dishes SET description = ?, category = ?, allergens = ?, badges = ?, images = ? WHERE name = ?',
                    [
                      description,
                      category,
                      JSON.stringify(allergens),
                      JSON.stringify(badges),
                      JSON.stringify(images),
                      name
                    ]
                  );
                  updated++;
                } else {
                  // INSERT
                  await conn.query(
                    'INSERT INTO dishes (name, description, category, allergens, badges, images) VALUES (?, ?, ?, ?, ?, ?)',
                    [
                      name,
                      description,
                      category,
                      JSON.stringify(allergens),
                      JSON.stringify(badges),
                      JSON.stringify(images)
                    ]
                  );
                  inserted++;
                }
              } catch (e) {
                errors.push({
                  row: row,
                  error: e.message
                });
              }
            }

            conn.release();
            resolve({ inserted, updated, errors });
          } catch (e) {
            conn.release();
            reject(e);
          }
        },
        error: (error) => {
          reject(new Error(`Error parsing CSV: ${error.message}`));
        }
      });
    });
  }

  /**
   * Exportar todos los platos a CSV
   * @returns {Promise<String>} CSV string
   */
  async exportToCSV() {
    const conn = await pool.getConnection();
    try {
      const dishes = await conn.query(
        'SELECT name, description, category, allergens, badges, images FROM dishes ORDER BY name'
      );

      // Convertir a formato CSV
      const data = dishes.map(d => ({
        name: d.name,
        description: d.description || '',
        category: d.category || 'otro',
        allergens: (safeParse(d.allergens)).join('|'),
        badges: (safeParse(d.badges)).join('|'),
        images: (safeParse(d.images)).join('|')
      }));

      const csv = papa.unparse(data, {
        header: true,
        columns: ['name', 'description', 'category', 'allergens', 'badges', 'images']
      });

      return csv;
    } finally {
      conn.release();
    }
  }

  /**
   * Obtener categorías disponibles
   * @returns {Promise<Array>}
   */
  async getCategories() {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(
        "SELECT DISTINCT category FROM dishes WHERE category IS NOT NULL ORDER BY category"
      );
      return result.map(r => r.category);
    } finally {
      conn.release();
    }
  }

  /**
   * Buscar platos por término (para autocomplete/búsqueda)
   * @param {String} term
   * @param {Number} limit
   * @returns {Promise<Array>}
   */
  async search(term, limit = 10) {
    const conn = await pool.getConnection();
    try {
      // Búsqueda más flexible incluyendo categoría
      const result = await conn.query(
        'SELECT * FROM dishes WHERE name LIKE ? OR category LIKE ? OR description LIKE ? LIMIT ?',
        [`%${term}%`, `%${term}%`, `%${term}%`, parseInt(limit)]
      );

      return result.map(d => ({
        ...d,
        images: safeParse(d.images),
        allergens: safeParse(d.allergens),
        badges: safeParse(d.badges)
      }));
    } finally {
      conn.release();
    }
  }

  /**
   * Duplicar un plato del catálogo
   * @param {Number} id - ID del plato original
   * @returns {Promise<Number>} - Nuevo ID del plato
   */
  async duplicate(id) {
    const conn = await pool.getConnection();
    try {
      await conn.query('START TRANSACTION');

      // Usar una sola consulta SQL para evitar problemas de tipos/conversión en JS
      const insertResult = await conn.query(
        `INSERT INTO dishes (name, description, category, allergens, badges, images) 
         SELECT CONCAT(name, ' (Copia)'), description, category, allergens, badges, images 
         FROM dishes WHERE id = ?`,
        [id]
      );
      
      const newId = Number(insertResult.insertId || (insertResult[0] && insertResult[0].insertId));

      await conn.query('COMMIT');
      return newId;
    } catch (e) {
      await conn.query('ROLLBACK');
      throw e;
    } finally {
      conn.release();
    }
  }
}

module.exports = new DishService();
