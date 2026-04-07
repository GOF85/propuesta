const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * Servicio para gestión de usuarios (comerciales y administradores)
 * Sigue el patrón de Service Layer: Solo SQL y lógica de negocio aquí.
 */
class UserService {
  /**
   * Obtiene todos los usuarios ordenados por fecha de creación
   */
  static async getAllUsers() {
    let conn;
    try {
      conn = await pool.getConnection();
      return await conn.query(
        'SELECT id, name, email, phone, avatar_url, role, created_at FROM users ORDER BY created_at DESC'
      );
    } catch (error) {
      console.error('Error in UserService.getAllUsers:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Obtiene un usuario por su ID
   * @param {number} id - ID del usuario
   */
  static async getUserById(id) {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        'SELECT id, name, email, phone, avatar_url, role, created_at FROM users WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      console.error(`Error in UserService.getUserById(${id}):`, error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Crea un nuevo usuario con contraseña hasheada
   * @param {Object} data - Datos del usuario (name, email, password, role, etc.)
   */
  static async createUser(data) {
    const { name, email, password, phone, avatar_url, role } = data;
    const password_hash = await bcrypt.hash(password, 10);
    
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        'INSERT INTO users (name, email, password_hash, phone, avatar_url, role) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, password_hash, phone || null, avatar_url || null, role || 'commercial']
      );
      
      const newId = Number(result.insertId);
      return await this.getUserById(newId);
    } catch (error) {
      console.error('Error in UserService.createUser:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Actualiza un usuario existente
   * @param {number} id - ID del usuario
   * @param {Object} data - Nuevos datos
   */
  static async updateUser(id, data) {
    const { name, email, password, phone, avatar_url, role } = data;
    let conn;
    try {
      conn = await pool.getConnection();
      
      let query = 'UPDATE users SET name = ?, email = ?, phone = ?, avatar_url = ?, role = ?';
      const params = [name, email, phone || null, avatar_url || null, role || 'commercial'];

      if (password && password.trim().length > 0) {
        const password_hash = await bcrypt.hash(password, 10);
        query += ', password_hash = ?';
        params.push(password_hash);
      }

      query += ' WHERE id = ?';
      params.push(id);

      await conn.query(query, params);
      return await this.getUserById(id);
    } catch (error) {
      console.error(`Error in UserService.updateUser(${id}):`, error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Elimina un usuario por su ID
   * @param {number} id - ID del usuario
   */
  static async deleteUser(id) {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query('DELETE FROM users WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error in UserService.deleteUser(${id}):`, error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
}

module.exports = UserService;
