/**
 * ChatService.js
 * Propósito: Lógica de negocio para mensajería
 * Pattern: Prepared statements + Transaction support
 */

const { pool } = require('../config/db');
const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
require('dayjs/locale/es');

dayjs.extend(relativeTime);
dayjs.locale('es');

// ════════════════════════════════════════════════════════════════
// AGREGAR MENSAJE
// ════════════════════════════════════════════════════════════════

exports.addMessage = async (data) => {
  const conn = await pool.getConnection();
  try {
    const { proposal_id, sender_role, message_body } = data;

    const result = await conn.query(
      `INSERT INTO messages (proposal_id, sender_role, message_body, is_read, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [proposal_id, sender_role, message_body, 0]
    );

    return result.insertId;
  } catch (err) {
    console.error('Error en ChatService.addMessage:', err);
    throw new Error('No se pudo guardar el mensaje');
  } finally {
    if (conn) conn.release();
  }
};

// ════════════════════════════════════════════════════════════════
// OBTENER MENSAJES
// ════════════════════════════════════════════════════════════════

exports.getMessages = async (proposalId, since = null) => {
  const conn = await pool.getConnection();
  try {
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
      params.push(Math.floor(Number(since) / 1000));
    }

    query += ` ORDER BY created_at ASC`;

    const messages = await conn.query(query, params);

    // Formatear timestamps
    return messages.map(m => {
      const date = dayjs(m.created_at);
      return {
        ...m,
        created_at: date.format('HH:mm:ss'),
        created_at_full: date.format('DD/MM/YYYY HH:mm'),
        timestamp: date.valueOf()
      };
    });
  } catch (err) {
    console.error('Error en ChatService.getMessages:', err);
    throw new Error('No se pudieron obtener los mensajes');
  } finally {
    if (conn) conn.release();
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

    conn.release();

    return result[0]?.count || 0;
  } catch (err) {
    console.error('Error en ChatService.countUnread:', err);
    throw err;
  }
};

// ════════════════════════════════════════════════════════════════
// OBTENER TODOS LOS NO LEÍDOS (Agrupados por OV)
// ════════════════════════════════════════════════════════════════

exports.getAllUnreadMessages = async (userId, role) => {
  const conn = await pool.getConnection();
  try {
    // 1. Obtener todos los mensajes no leídos de clientes
    let query = `
      SELECT 
        m.id,
        m.proposal_id,
        m.message_body,
        m.created_at,
        p.custom_ref,
        p.client_name,
        (SELECT v.name FROM proposal_venues pv JOIN venues v ON pv.venue_id = v.id WHERE pv.proposal_id = p.id AND pv.is_selected = 1 LIMIT 1) as selected_venue
      FROM messages m
      JOIN proposals p ON m.proposal_id = p.id
      WHERE m.sender_role = 'client' AND m.is_read = 0
    `;
    
    let params = [];

    if (role !== 'admin') {
      query += ` AND p.user_id = ?`;
      params.push(userId);
    }

    query += ` ORDER BY m.created_at DESC`;

    const allUnread = await conn.query(query, params);
    
    if (allUnread.length === 0) return [];

    // 2. Agrupar por propuesta
    const grouped = {};
    for (const msg of allUnread) {
      if (!grouped[msg.proposal_id]) {
        grouped[msg.proposal_id] = {
          proposal_id: msg.proposal_id,
          custom_ref: msg.custom_ref,
          client_name: msg.client_name,
          selected_venue: msg.selected_venue,
          unread_count: 0,
          latest_messages: [],
          last_commercial_msg: null
        };
      }
      grouped[msg.proposal_id].unread_count++;
      // Guardamos mensajes de cliente (limitar a 3 unread para el preview)
      if (grouped[msg.proposal_id].latest_messages.length < 3) {
        grouped[msg.proposal_id].latest_messages.push({
          body: msg.message_body,
          time: dayjs(msg.created_at).format('HH:mm')
        });
      }
    }

    // 3. Post-procesar cada propuesta
    const proposalIds = Object.keys(grouped);
    for (const pid of proposalIds) {
      // Revertir mensajes de cliente para que salgan en orden cronológico (viejo -> nuevo)
      grouped[pid].latest_messages.reverse();

      // Buscar el último mensaje del comercial para dar contexto
      const lastComm = await conn.query(
        `SELECT message_body, created_at 
         FROM messages 
         WHERE proposal_id = ? AND sender_role = 'commercial'
         ORDER BY created_at DESC LIMIT 1`,
        [pid]
      );
      
      if (lastComm.length > 0) {
        grouped[pid].last_commercial_msg = {
          body: lastComm[0].message_body,
          time: dayjs(lastComm[0].created_at).format('HH:mm')
        };
      }
    }

    // Convertir a array y devolver
    return Object.values(grouped);
  } catch (err) {
    console.error('Error en ChatService.getAllUnreadMessages:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

/**
 * Obtener el total de mensajes no leídos del cliente para todas las propuestas de un comercial
 * Si el usuario es admin, devuelve el total global de mensajes de clientes no leídos.
 */
exports.getTotalUnreadForUser = async (userId, role = 'commercial') => {
  try {
    const conn = await pool.getConnection();
    
    let query = `SELECT COUNT(*) as count FROM messages m
                 JOIN proposals p ON m.proposal_id = p.id
                 WHERE m.sender_role = 'client' AND m.is_read = 0`;
    let params = [];
    
    if (role !== 'admin') {
      query += ` AND p.user_id = ?`;
      params.push(userId);
    }

    const result = await conn.query(query, params);
    conn.release();
    return parseInt(result[0]?.count || 0);
  } catch (err) {
    console.error('Error en ChatService.getTotalUnreadForUser:', err);
    return 0;
  }
};

// ════════════════════════════════════════════════════════════════
// MARCAR COMO LEÍDOS
// ════════════════════════════════════════════════════════════════

exports.markAsRead = async (proposalId, senderRole) => {
  try {
    const conn = await pool.getConnection();
    const pid = Number(proposalId);

    await conn.query(
      `UPDATE messages SET is_read = 1
       WHERE proposal_id = ? AND sender_role != ?`,
      [pid, senderRole]
    );

    conn.release();
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

    conn.release();

    // Invertir para mostrar en orden cronológico
    return messages.reverse().map(m => ({
      ...m,
      created_at: dayjs(m.created_at).format('HH:mm:ss'),
      created_at_full: dayjs(m.created_at).format('DD/MM/YYYY HH:mm'),
      timestamp: dayjs(m.created_at).valueOf()
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

    conn.release();
  } catch (err) {
    console.error('Error en ChatService.deleteMessages:', err);
    throw new Error('No se pudieron eliminar los mensajes');
  }
};
