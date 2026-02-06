/**
 * ChatService.js
 * Propósito: Lógica de negocio para mensajería
 * Pattern: Prepared statements + Transaction support
 */

const { pool } = require('../config/db');
const dayjs = require('dayjs');

// ════════════════════════════════════════════════════════════════
// AGREGAR MENSAJE
// ════════════════════════════════════════════════════════════════

exports.addMessage = async (data) => {
  try {
    const { proposal_id, sender_role, message_body } = data;

    const conn = await pool.getConnection();
    
    const result = await conn.query(
      `INSERT INTO messages (proposal_id, sender_role, message_body, is_read, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [proposal_id, sender_role, message_body, 0]
    );

    conn.end();

    return result.insertId;
  } catch (err) {
    console.error('Error en ChatService.addMessage:', err);
    throw new Error('No se pudo guardar el mensaje');
  }
};

// ════════════════════════════════════════════════════════════════
// OBTENER MENSAJES
// ════════════════════════════════════════════════════════════════

exports.getMessages = async (proposalId, since = null) => {
  try {
    const conn = await pool.getConnection();

    let query = `
      SELECT 
        id,
        proposal_id,
        sender_role,
        message_body,
        is_read,
        created_at
      FROM messages
      WHERE proposal_id = ?
    `;
    
    let params = [proposalId];

    if (since) {
      query += ` AND created_at > FROM_UNIXTIME(?)`;
      params.push(Math.floor(since / 1000));
    }

    query += ` ORDER BY created_at ASC`;

    const messages = await conn.query(query, params);
    conn.end();

    // Formatear timestamps
    return messages.map(m => ({
      ...m,
      created_at: dayjs(m.created_at).format('HH:mm:ss'),
      created_at_full: dayjs(m.created_at).format('DD/MM/YYYY HH:mm'),
      timestamp: m.created_at.getTime()
    }));
  } catch (err) {
    console.error('Error en ChatService.getMessages:', err);
    throw new Error('No se pudieron obtener los mensajes');
  }
};

// ════════════════════════════════════════════════════════════════
// CONTAR NO LEÍDOS
// ════════════════════════════════════════════════════════════════

exports.countUnread = async (proposalId, senderRole) => {
  try {
    const conn = await pool.getConnection();

    const result = await conn.query(
      `SELECT COUNT(*) as count FROM messages
       WHERE proposal_id = ? AND sender_role = ? AND is_read = 0`,
      [proposalId, senderRole]
    );

    conn.end();

    return result[0]?.count || 0;
  } catch (err) {
    console.error('Error en ChatService.countUnread:', err);
    return 0;
  }
};

// ════════════════════════════════════════════════════════════════
// MARCAR COMO LEÍDOS
// ════════════════════════════════════════════════════════════════

exports.markAsRead = async (proposalId, senderRole) => {
  try {
    const conn = await pool.getConnection();

    await conn.query(
      `UPDATE messages SET is_read = 1
       WHERE proposal_id = ? AND sender_role != ?`,
      [proposalId, senderRole]
    );

    conn.end();
  } catch (err) {
    console.error('Error en ChatService.markAsRead:', err);
    throw new Error('No se pudieron marcar los mensajes');
  }
};

// ════════════════════════════════════════════════════════════════
// OBTENER ÚLTIMOS MENSAJES
// ════════════════════════════════════════════════════════════════

exports.getRecentMessages = async (proposalId, limit = 20) => {
  try {
    const conn = await pool.getConnection();

    const messages = await conn.query(
      `SELECT 
        id, proposal_id, sender_role, message_body, is_read, created_at
       FROM messages
       WHERE proposal_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [proposalId, limit]
    );

    conn.end();

    // Invertir para mostrar en orden cronológico
    return messages.reverse().map(m => ({
      ...m,
      created_at: dayjs(m.created_at).format('HH:mm:ss'),
      created_at_full: dayjs(m.created_at).format('DD/MM/YYYY HH:mm'),
      timestamp: m.created_at.getTime()
    }));
  } catch (err) {
    console.error('Error en ChatService.getRecentMessages:', err);
    throw new Error('No se pudieron obtener los mensajes');
  }
};

// ════════════════════════════════════════════════════════════════
// ELIMINAR MENSAJES DE PROPUESTA (limpieza)
// ════════════════════════════════════════════════════════════════

exports.deleteMessages = async (proposalId) => {
  try {
    const conn = await pool.getConnection();

    await conn.query(
      `DELETE FROM messages WHERE proposal_id = ?`,
      [proposalId]
    );

    conn.end();
  } catch (err) {
    console.error('Error en ChatService.deleteMessages:', err);
    throw new Error('No se pudieron eliminar los mensajes');
  }
};
