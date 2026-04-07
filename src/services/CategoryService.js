/**
 * CategoryService
 * Gestión de categorías para Platos y Menús
 */
const { pool } = require('../config/db');

class CategoryService {
  /**
   * Obtener todas las categorías o filtradas por tipo
   * @param {String} type - 'dish' o 'menu' (opcional)
   */
  async getAll(type = null) {
    const conn = await pool.getConnection();
    try {
      let query = 'SELECT * FROM app_categories';
      let params = [];
      if (type) {
        query += ' WHERE type = ?';
        params.push(type);
      }
      query += ' ORDER BY order_index ASC, name ASC';
      return await conn.query(query, params);
    } finally {
      conn.release();
    }
  }

  /**
   * Crear una nueva categoría
   */
  async create({ name, type, order_index = 0 }) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(
        'INSERT INTO app_categories (name, type, order_index) VALUES (?, ?, ?)',
        [name, type, order_index]
      );
      return result.insertId;
    } finally {
      conn.release();
    }
  }

  /**
   * Actualizar una categoría
   */
  async update(id, { name, type, order_index = 0 }) {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        'UPDATE app_categories SET name = ?, type = ?, order_index = ? WHERE id = ?',
        [name, type, order_index, id]
      );
      return true;
    } finally {
      conn.release();
    }
  }

  /**
   * Eliminar una categoría
   */
  async delete(id) {
    const conn = await pool.getConnection();
    try {
      await conn.query('DELETE FROM app_categories WHERE id = ?', [id]);
      return true;
    } finally {
      conn.release();
    }
  }
}

module.exports = new CategoryService();
