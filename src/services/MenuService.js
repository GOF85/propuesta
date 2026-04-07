/**
 * MenuService
 * Gestión de menús: CRUD, relación con platos
 */
const { pool } = require('../config/db');
const papa = require('papaparse');

/**
 * Helper para parsear JSON de la BD de forma segura.
 */
const safeParse = (val) => {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch (e) { return []; }
  }
  return val || [];
};

class MenuService {
  /**
   * Obtener todos los menús con cantidad de platos
   * @param {Object} filters - {search?, limit?, offset?}
   * @returns {Promise<{menus: Array, total: Number}>}
   */
  async getAll(filters = {}) {
    const conn = await pool.getConnection();
    try {
      const { search, category, limit = 100, offset = 0 } = filters;

      let query = `
        SELECT m.id, m.name, m.description, m.category, m.base_price, m.price_model, m.url_images, m.video_url, m.images, m.badges, m.created_at, m.updated_at,
          COUNT(md.id) as dishes_count,
          GROUP_CONCAT(d.name SEPARATOR ', ') as dish_names
        FROM menus m
        LEFT JOIN menu_dishes md ON m.id = md.menu_id
        LEFT JOIN dishes d ON md.dish_id = d.id
        WHERE 1=1
      `;
      const params = [];

      if (search) {
        query += ' AND (m.name COLLATE utf8mb4_unicode_ci LIKE ? OR m.description COLLATE utf8mb4_unicode_ci LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      if (category) {
        query += ' AND m.category = ?';
        params.push(category);
      }

      query += ' GROUP BY m.id ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const menus = await conn.query(query, params);

      // Obtener total
      let countQuery = 'SELECT COUNT(*) as total FROM menus WHERE 1=1';
      const countParams = [];
      if (search) {
        countQuery += ' AND (name COLLATE utf8mb4_unicode_ci LIKE ? OR description COLLATE utf8mb4_unicode_ci LIKE ?)';
        countParams.push(`%${search}%`, `%${search}%`);
      }

      if (category) {
        countQuery += ' AND category = ?';
        countParams.push(category);
      }

      const countResult = await conn.query(countQuery, countParams);
      const total = Number(countResult[0]?.total || 0);

      return {
        menus: menus.map(m => ({
          ...m,
          images: safeParse(m.images),
          badges: safeParse(m.badges),
          dishes_count: Number(m.dishes_count) || 0,
          dish_names: m.dish_names || ''
        })),
        total
      };
    } finally {
      conn.release();
    }
  }

  /**
   * Obtener menú por ID con todos sus platos
   * @param {Number} id
   * @returns {Promise<Object|null>}
   */
  async getById(id) {
    const conn = await pool.getConnection();
    try {
      const menuResult = await conn.query('SELECT * FROM menus WHERE id = ?', [id]);

      if (menuResult.length === 0) return null;

      const menu = menuResult[0];
      // Parsear imágenes y badges
      menu.images = safeParse(menu.images);
      menu.badges = safeParse(menu.badges);

      // Obtener platos del menú ordenados
      const dishesResult = await conn.query(
        `
        SELECT d.*, md.sort_order
        FROM menu_dishes md
        JOIN dishes d ON md.dish_id = d.id
        WHERE md.menu_id = ?
        ORDER BY md.sort_order ASC
      `,
        [id]
      );

      const dishes = dishesResult.map(d => ({
        id: d.id,
        name: d.name,
        description: d.description,
        category: d.category,
        allergens: safeParse(d.allergens),
        badges: safeParse(d.badges),
        images: safeParse(d.images),
        sort_order: d.sort_order
      }));

      // Consolidar alérgenos automáticamente de los platos
      const consolidatedAllergens = Array.from(new Set(
        dishes.flatMap(d => Array.isArray(d.allergens) ? d.allergens : [])
      ));

      return {
        ...menu,
        dishes,
        consolidated_allergens: consolidatedAllergens,
        dishes_count: dishes.length
      };
    } finally {
      conn.release();
    }
  }

  /**
   * Crear nuevo menú
   * @param {Object} data - {name, description, base_price, dishIds: [1,5,8]}
   * @returns {Promise<Object>}
   */
  async create(data) {
    const conn = await pool.getConnection();
    try {
      const { name, description = '', category = '', base_price = 0, dishIds = [], images = [], badges = [], url_images = null, video_url = null } = data;
      const normalizedVideoUrl = (video_url || '').trim() || null;

      // Validar requeridos
      if (!name || name.trim().length === 0) {
        throw new Error('El nombre del menú es requerido');
      }

      // Verificar duplicado
      const existing = await conn.query('SELECT id FROM menus WHERE name = ?', [name]);
      if (existing.length > 0) {
        throw new Error(`Ya existe un menú con el nombre "${name}"`);
      }

      // Iniciar transacción
      await conn.query('START TRANSACTION');

      // Limpiar el modelo de precio
      const allowedModels = ['pax', 'fixed'];
      const price_model = allowedModels.includes(data.price_model) ? data.price_model : 'pax';

      // Insertar menú
      const menuResult = await conn.query(
        'INSERT INTO menus (name, description, category, base_price, price_model, url_images, video_url, images, badges, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [
          name.trim(), 
          description.trim(), 
          category ? category.trim() : null,
          parseFloat(base_price) || 0,
          price_model,
          url_images,
          normalizedVideoUrl,
          JSON.stringify(images || []),
          JSON.stringify(badges || [])
        ]
      );

      // Usar insertId del resultado para MariaDB
      const menuId = Number(menuResult.insertId);
      if (!menuId) {
        throw new Error('No se pudo obtener el ID del menú insertado');
      }

      // Insertar relaciones menu_dishes
      if (dishIds && Array.isArray(dishIds)) {
        for (let i = 0; i < dishIds.length; i++) {
          const dishId = dishIds[i];
          if (!dishId) continue;

          // Validar que el dish existe
          const dishExists = await conn.query('SELECT id FROM dishes WHERE id = ?', [dishId]);
          if (dishExists.length === 0) {
            console.warn(`⚠️ Plato con ID ${dishId} no existe, saltando...`);
            continue;
          }

          await conn.query(
            'INSERT IGNORE INTO menu_dishes (menu_id, dish_id, sort_order) VALUES (?, ?, ?)',
            [menuId, dishId, i]
          );
        }
      }

      await conn.query('COMMIT');

      // Retornar menú creado con sus platos
      return this.getById(menuId);
    } catch (e) {
      await conn.query('ROLLBACK');
      throw e;
    } finally {
      conn.release();
    }
  }

  /**
   * Actualizar menú (nombre, descripción, precio base y lista de platos)
   * @param {Number} id
   * @param {Object} data - {name?, description?, base_price?, dishIds?}
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    const conn = await pool.getConnection();
    try {
      const existing = await conn.query('SELECT * FROM menus WHERE id = ?', [id]);
      if (existing.length === 0) {
        throw new Error('Menú no encontrado');
      }

      const current = existing[0];
      const updates = {
        name: data.name ?? current.name,
        description: data.description ?? current.description,
        category: data.category ?? current.category,
        base_price: data.base_price ?? current.base_price,
        price_model: data.price_model ?? current.price_model,
        url_images: data.url_images ?? current.url_images,
        video_url: data.video_url ?? current.video_url,
        images: data.images ?? safeParse(current.images),
        badges: data.badges ?? safeParse(current.badges)
      };

      // Si cambia el nombre, verificar duplicado
      if (updates.name !== current.name) {
        const dup = await conn.query('SELECT id FROM menus WHERE name = ? AND id != ?', [
          updates.name,
          id
        ]);
        if (dup.length > 0) {
          throw new Error(`Ya existe otro menú con el nombre "${updates.name}"`);
        }
      }

      const normalizedVideoUrl = (updates.video_url || '').trim() || null;
      await conn.query('START TRANSACTION');

      // Actualizar menú
      await conn.query(
        'UPDATE menus SET name = ?, description = ?, category = ?, base_price = ?, price_model = ?, url_images = ?, video_url = ?, images = ?, badges = ?, updated_at = NOW() WHERE id = ?',
        [
          updates.name, 
          updates.description, 
          updates.category ? updates.category.trim() : null,
          parseFloat(updates.base_price) || 0, 
          updates.price_model,
          updates.url_images,
          normalizedVideoUrl,
          JSON.stringify(updates.images),
          JSON.stringify(updates.badges),
          id
        ]
      );

      // Si se proporcionan dishIds, actualizar relaciones
      if (data.dishIds !== undefined) {
        // Eliminar todas las relaciones actuales
        await conn.query('DELETE FROM menu_dishes WHERE menu_id = ?', [id]);

        // Insertar nuevas relaciones
        for (let i = 0; i < data.dishIds.length; i++) {
          const dishId = data.dishIds[i];

          // Validar que el dish existe
          const dishExists = await conn.query('SELECT id FROM dishes WHERE id = ?', [dishId]);
          if (dishExists.length === 0) {
            throw new Error(`Plato con ID ${dishId} no existe`);
          }

          await conn.query(
            'INSERT INTO menu_dishes (menu_id, dish_id, sort_order) VALUES (?, ?, ?)',
            [id, dishId, i]
          );
        }
      }

      await conn.query('COMMIT');

      // Retornar menú actualizado
      return this.getById(id);
    } catch (e) {
      await conn.query('ROLLBACK');
      throw e;
    } finally {
      conn.release();
    }
  }

  /**
   * Actualizar orden de platos en un menú (sort_order)
   * @param {Number} menuId
   * @param {Array} dishIds - Array de IDs en nuevo orden
   * @returns {Promise<Boolean>}
   */
  async updateDishOrder(menuId, dishIds) {
    const conn = await pool.getConnection();
    try {
      await conn.query('START TRANSACTION');

      for (let i = 0; i < dishIds.length; i++) {
        await conn.query('UPDATE menu_dishes SET sort_order = ? WHERE menu_id = ? AND dish_id = ?', [
          i,
          menuId,
          dishIds[i]
        ]);
      }

      await conn.query('COMMIT');
      return true;
    } catch (e) {
      await conn.query('ROLLBACK');
      throw e;
    } finally {
      conn.release();
    }
  }

  /**
   * Eliminar menú
   * @param {Number} id
   * @returns {Promise<Boolean>}
   */
  async delete(id) {
    const conn = await pool.getConnection();
    try {
      // Verificar si el menú existe
      const existing = await conn.query('SELECT id FROM menus WHERE id = ?', [id]);
      if (existing.length === 0) {
        throw new Error('Menú no encontrado');
      }

      await conn.query('START TRANSACTION');

      // Eliminar relaciones menu_dishes (CASCADE debería hacerlo automáticamente)
      await conn.query('DELETE FROM menu_dishes WHERE menu_id = ?', [id]);

      // Eliminar menú
      const result = await conn.query('DELETE FROM menus WHERE id = ?', [id]);

      await conn.query('COMMIT');

      return result.affectedRows > 0;
    } catch (e) {
      await conn.query('ROLLBACK');
      throw e;
    } finally {
      conn.release();
    }
  }

  /**
   * Obtener platos de un menú
   * @param {Number} menuId
   * @returns {Promise<Array>}
   */
  async getDishesForMenu(menuId) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(
        `
        SELECT d.*, md.sort_order
        FROM menu_dishes md
        JOIN dishes d ON md.dish_id = d.id
        WHERE md.menu_id = ?
        ORDER BY md.sort_order ASC
      `,
        [menuId]
      );

      return result.map(d => ({
        ...d,
        allergens: safeParse(d.allergens),
        badges: safeParse(d.badges),
        images: safeParse(d.images)
      }));
    } finally {
      conn.release();
    }
  }

  /**
   * Duplicar un menú del catálogo
   * @param {Number} id - ID del menú original
   * @returns {Promise<Number>} - Nuevo ID del menú
   */
  async duplicate(id) {
    const conn = await pool.getConnection();
    try {
      await conn.query('START TRANSACTION');

      // 1. Obtener menú original
      const menuResult = await conn.query('SELECT * FROM menus WHERE id = ?', [id]);
      if (menuResult.length === 0) throw new Error('Menú no encontrado');
      const menu = menuResult[0];

      // 2. Insertar copia
      const insertResult = await conn.query(
        'INSERT INTO menus (name, description, category, base_price, price_model, url_images, video_url, images, badges) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [`${menu.name} (Copia)`, menu.description, menu.category, menu.base_price, menu.price_model, menu.url_images, menu.video_url, menu.images, menu.badges]
      );
      const newId = Number(insertResult.insertId || (insertResult[0] && insertResult[0].insertId));

      // 3. Clonar platos asociados
      await conn.query(
        'INSERT INTO menu_dishes (menu_id, dish_id, sort_order) SELECT ?, dish_id, sort_order FROM menu_dishes WHERE menu_id = ?',
        [newId, id]
      );

      await conn.query('COMMIT');
      return newId;
    } catch (e) {
      await conn.query('ROLLBACK');
      throw e;
    } finally {
      conn.release();
    }
  }

  /**
   * Importar menús desde texto CSV
   * @param {String} csvText 
   */
  async importFromCSV(csvText) {
    return new Promise((resolve, reject) => {
      papa.parse(csvText, {
        header: true,
        trim: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const conn = await pool.getConnection();
          try {
            await conn.query('START TRANSACTION');
            let inserted = 0;
            let updated = 0;
            const errors = [];

            for (const row of results.data) {
              try {
                if (!row.name) continue;

                // 1. Crear o actualizar menú
                const existing = await conn.query('SELECT id FROM menus WHERE name = ?', [row.name]);
                let menuId;

                const badges = row.badges ? JSON.stringify(row.badges.split('|').map(s => s.trim())) : '[]';
                const images = row.images ? JSON.stringify(row.images.split('|').map(s => s.trim())) : '[]';
                const price_model = (row.price_model === 'fixed') ? 'fixed' : 'pax';
                const base_price = parseFloat(String(row.base_price).replace(',', '.')) || 0;

                if (existing.length > 0) {
                  menuId = existing[0].id;
                  await conn.query(
                    'UPDATE menus SET description = ?, category = ?, base_price = ?, price_model = ?, url_images = ?, video_url = ?, badges = ?, images = ? WHERE id = ?',
                    [row.description || null, row.category || null, base_price, price_model, row.url_images || null, row.video_url || null, badges, images, menuId]
                  );
                  updated++;
                } else {
                  const result = await conn.query(
                    'INSERT INTO menus (name, description, category, base_price, price_model, url_images, video_url, badges, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [row.name, row.description || null, row.category || null, base_price, price_model, row.url_images || null, row.video_url || null, badges, images]
                  );
                  menuId = Number(result.insertId);
                  inserted++;
                }

                // 2. Vincular platos (dishes split by ;)
                if (row.dishes && row.dishes.trim()) {
                  await conn.query('DELETE FROM menu_dishes WHERE menu_id = ?', [menuId]);
                  const dishNames = row.dishes.split(';').map(s => s.trim()).filter(Boolean);
                  let sortOrder = 0;
                  for (const dName of dishNames) {
                    const [dish] = await conn.query('SELECT id FROM dishes WHERE name = ?', [dName]);
                    if (dish) {
                      await conn.query(
                        'INSERT IGNORE INTO menu_dishes (menu_id, dish_id, sort_order) VALUES (?, ?, ?)',
                        [menuId, dish.id, sortOrder++]
                      );
                    }
                  }
                }
              } catch (e) {
                errors.push({ name: row.name || 'Fila', error: e.message });
              }
            }

            await conn.query('COMMIT');
            resolve({ inserted, updated, errors });
          } catch (err) {
            await conn.query('ROLLBACK');
            reject(err);
          } finally {
            conn.release();
          }
        },
        error: (err) => reject(new Error('Error al parsear CSV: ' + err.message))
      });
    });
  }

  /**
   * Exportar todos los menús a CSV incluyendo nombres de platos
   */
  async exportToCSV() {
    const conn = await pool.getConnection();
    try {
      const menus = await conn.query(`
        SELECT m.name, m.category, m.description, m.base_price, m.price_model, m.url_images, m.video_url, m.badges, m.images,
               GROUP_CONCAT(d.name SEPARATOR '; ') as dish_names
        FROM menus m
        LEFT JOIN menu_dishes md ON m.id = md.menu_id
        LEFT JOIN dishes d ON md.dish_id = d.id
        GROUP BY m.id
        ORDER BY m.name
      `);

      const data = menus.map(m => {
        let bArr = [];
        try { bArr = typeof m.badges === 'string' ? JSON.parse(m.badges) : (m.badges || []); } catch(e) {}
        let iArr = [];
        try { iArr = typeof m.images === 'string' ? JSON.parse(m.images) : (m.images || []); } catch(e) {}

        return {
          name: m.name,
          category: m.category || '',
          description: m.description || '',
          base_price: m.base_price || 0,
          price_model: m.price_model || 'pax',
          url_images: m.url_images || '',
          video_url: m.video_url || '',
          badges: Array.isArray(bArr) ? bArr.join('|') : '',
          images: Array.isArray(iArr) ? iArr.join('|') : '',
          dishes: m.dish_names || ''
        };
      });

      return papa.unparse(data);
    } finally {
      conn.release();
    }
  }
}

module.exports = new MenuService();
