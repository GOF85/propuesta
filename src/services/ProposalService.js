/**
 * ProposalService.js
 * Lógica de negocio para propuestas
 * - Listado con filtros
 * - Obtener por ID
 * - Crear, actualizar, eliminar
 * - Calcular totales (motor financiero)
 * - Deep clone (duplicar propuesta)
 */

const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { VAT_RATES } = require('../config/constants');

class ProposalService {
  /**
   * Lista propuestas del usuario con filtros
   * @param {number} userId - ID del usuario (comercial)
   * @param {object} filters - { status, search, page, limit }
   * @returns {Promise<array>}
   */
  async listProposals(userId, filters = {}) {
    const conn = await pool.getConnection();
    try {
      const status = filters.status && filters.status !== 'all' ? filters.status : null;
      const search = filters.search ? `%${filters.search}%` : null;
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      // Construir WHERE clause
      let whereConditions = ['p.user_id = ?'];
      let params = [userId];

      if (status) {
        whereConditions.push('p.status = ?');
        params.push(status);
      }

      if (search) {
        whereConditions.push('(p.client_name LIKE ?)');
        params.push(search);
      }

      const whereClause = whereConditions.join(' AND ');

      // Query con LEFT JOIN para venues
      const query = `
        SELECT 
          p.id,
          p.unique_hash,
          p.client_name,
          p.event_date,
          p.pax,
          p.status,
          p.is_editing,
          p.created_at,
          GROUP_CONCAT(DISTINCT v.name SEPARATOR ', ') as venue_names
        FROM proposals p
        LEFT JOIN proposal_venues pv ON p.id = pv.proposal_id
        LEFT JOIN venues v ON pv.venue_id = v.id
        WHERE ${whereClause}
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;

      params.push(limit, offset);

      const result = await conn.query(query, params);

      // Calcular totales para cada propuesta
      for (let proposal of result) {
        proposal.total = await this.calculateTotals(proposal.id);
      }

      return result;
    } finally {
      conn.end();
    }
  }

  /**
   * Obtiene una propuesta completa con todos sus datos
   * @param {number} id - ID de la propuesta
   * @returns {Promise<object>}
   */
  async getProposalById(id) {
    const conn = await pool.getConnection();
    try {
      // Propuesta base
      const proposal = await conn.query(
        'SELECT * FROM proposals WHERE id = ?',
        [id]
      );

      if (!proposal || !proposal[0]) {
        throw new Error('Propuesta no encontrada');
      }

      const prop = proposal[0];

      // Venues asociados
      const venues = await conn.query(
        `SELECT pv.*, v.name, v.description, v.capacity_cocktail, v.capacity_banquet
         FROM proposal_venues pv
         JOIN venues v ON pv.venue_id = v.id
         WHERE pv.proposal_id = ?`,
        [id]
      );

      // Servicios
      const services = await conn.query(
        `SELECT ps.*, 
                GROUP_CONCAT(
                  JSON_OBJECT('id', so.id, 'name', so.name, 'price_pax', so.price_pax, 'discount_pax', so.discount_pax)
                  SEPARATOR ','
                ) as options
         FROM proposal_services ps
         LEFT JOIN service_options so ON ps.id = so.service_id
         WHERE ps.proposal_id = ?
         GROUP BY ps.id`,
        [id]
      );

      prop.venues = venues;
      prop.services = services.map(s => ({
        ...s,
        options: s.options ? JSON.parse(`[${s.options}]`) : []
      }));
      prop.total = await this.calculateTotals(id);

      return prop;
    } finally {
      conn.end();
    }
  }

  /**
   * Crea una nueva propuesta
   * @param {number} userId
   * @param {object} data - { client_name, event_date, pax }
   * @returns {Promise<object>}
   */
  async createProposal(userId, data) {
    const conn = await pool.getConnection();
    try {
      await conn.query('START TRANSACTION');

      const unique_hash = uuidv4().replace(/-/g, '').substring(0, 32);

      const result = await conn.query(
        `INSERT INTO proposals (user_id, unique_hash, client_name, event_date, pax, status, is_editing)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          unique_hash,
          data.client_name || 'Sin nombre',
          data.event_date || null,
          data.pax || 0,
          'draft',
          true
        ]
      );

      await conn.query('COMMIT');

      return {
        id: result.insertId,
        unique_hash,
        ...data,
        status: 'draft',
        is_editing: true
      };
    } catch (err) {
      await conn.query('ROLLBACK');
      throw err;
    } finally {
      conn.end();
    }
  }

  /**
   * Actualiza una propuesta
   * @param {number} id
   * @param {object} changes - Campos a actualizar
   * @returns {Promise<object>}
   */
  async updateProposal(id, changes) {
    const conn = await pool.getConnection();
    try {
      await conn.query('START TRANSACTION');

      const allowed = ['client_name', 'event_date', 'pax', 'status', 'brand_color', 'logo_url', 'legal_conditions'];
      const updates = [];
      const values = [];

      for (const [key, value] of Object.entries(changes)) {
        if (allowed.includes(key)) {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (updates.length === 0) {
        return { success: false, message: 'No hay cambios válidos' };
      }

      values.push(id);

      await conn.query(
        `UPDATE proposals SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      await conn.query('COMMIT');
      return { success: true, id };
    } catch (err) {
      await conn.query('ROLLBACK');
      throw err;
    } finally {
      conn.end();
    }
  }

  /**
   * MOTOR FINANCIERO - Calcula totales de una propuesta
   * Single Source of Truth para precios
   * @param {number} proposalId
   * @returns {Promise<number>}
   */
  async calculateTotals(proposalId) {
    const conn = await pool.getConnection();
    try {
      // Obtener todos los ítems con sus precios y VAT rates
      const items = await conn.query(
        `SELECT 
          pi.*,
          so.price_pax,
          so.discount_pax,
          ps.vat_rate,
          p.pax
        FROM proposal_items pi
        JOIN service_options so ON pi.option_id = so.id
        JOIN proposal_services ps ON so.service_id = ps.id
        JOIN proposals p ON ps.proposal_id = p.id
        WHERE p.id = ?`,
        [proposalId]
      );

      let baseAmount = 0;
      let totalVAT = 0;

      for (const item of items) {
        const pax = item.pax || 1;
        const pricePerPax = (item.price_pax || 0) - (item.discount_pax || 0);
        const itemTotal = pricePerPax * pax;
        const vatRate = item.vat_rate || VAT_RATES.FOOD;
        const itemVAT = itemTotal * (vatRate / 100);

        baseAmount += itemTotal;
        totalVAT += itemVAT;
      }

      const finalTotal = baseAmount + totalVAT;

      return Math.round(finalTotal * 100) / 100; // Redondear a 2 decimales
    } finally {
      conn.end();
    }
  }

  /**
   * Duplica una propuesta completa (Deep Clone)
   * Copia: propuesta → venues → servicios → opciones → items
   * @param {number} originalId
   * @returns {Promise<number>} ID de la nueva propuesta
   */
  async duplicateProposal(originalId) {
    const conn = await pool.getConnection();
    try {
      await conn.query('START TRANSACTION');

      // 1. Obtener propuesta original
      const original = await conn.query(
        'SELECT * FROM proposals WHERE id = ?',
        [originalId]
      );

      if (!original || !original[0]) {
        throw new Error('Propuesta original no encontrada');
      }

      const orig = original[0];

      // 2. Copiar propuesta
      const newHash = uuidv4().replace(/-/g, '').substring(0, 32);
      const newProposal = await conn.query(
        `INSERT INTO proposals (user_id, unique_hash, client_name, event_date, pax, brand_color, logo_url, legal_conditions, status, is_editing)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orig.user_id,
          newHash,
          `${orig.client_name} (Copia)`,
          orig.event_date,
          orig.pax,
          orig.brand_color,
          orig.logo_url,
          orig.legal_conditions,
          'draft',
          true
        ]
      );

      const newProposalId = newProposal.insertId;

      // 3. Copiar venues
      const venues = await conn.query(
        'SELECT * FROM proposal_venues WHERE proposal_id = ?',
        [originalId]
      );

      for (const venue of venues) {
        await conn.query(
          'INSERT INTO proposal_venues (proposal_id, venue_id, is_selected, custom_override_json) VALUES (?, ?, ?, ?)',
          [newProposalId, venue.venue_id, venue.is_selected, venue.custom_override_json]
        );
      }

      // 4. Copiar servicios + opciones + items
      const services = await conn.query(
        'SELECT * FROM proposal_services WHERE proposal_id = ?',
        [originalId]
      );

      for (const service of services) {
        const newService = await conn.query(
          `INSERT INTO proposal_services (proposal_id, title, type, start_time, end_time, vat_rate, order_index, is_multichoice, selected_option_index)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newProposalId,
            service.title,
            service.type,
            service.start_time,
            service.end_time,
            service.vat_rate,
            service.order_index,
            service.is_multichoice,
            service.selected_option_index
          ]
        );

        const newServiceId = newService.insertId;

        // Copiar opciones del servicio
        const options = await conn.query(
          'SELECT * FROM service_options WHERE service_id = ?',
          [service.id]
        );

        for (const option of options) {
          const newOption = await conn.query(
            'INSERT INTO service_options (service_id, name, price_pax, discount_pax, description) VALUES (?, ?, ?, ?, ?)',
            [newServiceId, option.name, option.price_pax, option.discount_pax, option.description]
          );

          // Copiar items del servicio
          const items = await conn.query(
            'SELECT * FROM proposal_items WHERE option_id = ?',
            [option.id]
          );

          for (const item of items) {
            await conn.query(
              'INSERT INTO proposal_items (option_id, name, description, allergens, badges, image_url) VALUES (?, ?, ?, ?, ?, ?)',
              [newOption.insertId, item.name, item.description, item.allergens, item.badges, item.image_url]
            );
          }
        }
      }

      await conn.query('COMMIT');
      return newProposalId;
    } catch (err) {
      await conn.query('ROLLBACK');
      throw err;
    } finally {
      conn.end();
    }
  }

  /**
   * Elimina una propuesta
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async deleteProposal(id) {
    const conn = await pool.getConnection();
    try {
      await conn.query('START TRANSACTION');

      // Las cascadas en la BD borrarán venues, services, options, items automáticamente
      await conn.query('DELETE FROM proposals WHERE id = ?', [id]);

      await conn.query('COMMIT');
      return true;
    } catch (err) {
      await conn.query('ROLLBACK');
      throw err;
    } finally {
      conn.end();
    }
  }

  /**
   * Obtiene propuesta por magic link hash
   * @param {string} hash - unique_hash
   * @returns {Promise<object>}
   */
  async getProposalByHash(hash) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(
        'SELECT * FROM proposals WHERE unique_hash = ?',
        [hash]
      );
      return result[0] || null;
    } finally {
      conn.end();
    }
  }

  /**
   * Obtiene todas las propuestas de un cliente por su email
   * @param {string} clientEmail - email del cliente
   * @returns {Promise<array>}
   */
  async getProposalsByClientEmail(clientEmail) {
    const conn = await pool.getConnection();
    try {
      const proposals = await conn.query(
        `SELECT p.* FROM proposals p 
         WHERE p.client_email = ? 
         ORDER BY p.created_at DESC`,
        [clientEmail]
      );
      
      // Enriquecer con venues, servicios, etc.
      for (const proposal of proposals) {
        const venues = await conn.query(
          `SELECT v.* FROM venues v 
           JOIN proposal_venues pv ON v.id = pv.venue_id 
           WHERE pv.proposal_id = ?`,
          [proposal.id]
        );
        proposal.venues = venues;

        const services = await conn.query(
          `SELECT ps.*, ps.title FROM proposal_services ps 
           WHERE ps.proposal_id = ?`,
          [proposal.id]
        );
        proposal.services = services;
      }

      return proposals;
    } finally {
      conn.end();
    }
  }
}

module.exports = new ProposalService();
