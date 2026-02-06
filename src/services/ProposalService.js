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

      // Calcular totales para cada propuesta (retornar solo total_final para listados)
      for (let proposal of result) {
        const totals = await this.calculateTotals(proposal.id, { persist: false });
        proposal.total = totals.total_final;
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
      
      // Obtener totales completos
      prop.totals = await this.calculateTotals(id, { persist: true });
      prop.total = prop.totals.total_final; // Backward compatibility

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
   * MOTOR FINANCIERO COMPLETO - Calcula totales de una propuesta
   * Single Source of Truth para precios
   * Incluye: IVA dual, descuentos por volumen, márgenes, persistencia
   * @param {number} proposalId
   * @param {object} options - { persist: true/false, auditUserId: null }
   * @returns {Promise<object>} - { total_base, total_vat, total_final, margin, margin_percentage, breakdown }
   */
  async calculateTotals(proposalId, options = {}) {
    const conn = await pool.getConnection();
    try {
      const { persist = true, auditUserId = null } = options;

      // 1. Obtener propuesta y configuración
      const [proposal] = await conn.query(
        'SELECT * FROM proposals WHERE id = ?',
        [proposalId]
      );

      if (!proposal) {
        throw new Error('Propuesta no encontrada');
      }

      const pax = proposal.pax || 1;

      // 2. Obtener todos los ítems con precios, costes y VAT rates
      const items = await conn.query(
        `SELECT 
          pi.*,
          so.price_pax,
          so.discount_pax,
          ps.vat_rate,
          ps.type as service_type
        FROM proposal_items pi
        JOIN service_options so ON pi.option_id = so.id
        JOIN proposal_services ps ON so.service_id = ps.id
        WHERE ps.proposal_id = ?`,
        [proposalId]
      );

      // 3. Calcular totales por ítem
      let baseAmount = 0;
      let totalCost = 0;
      let totalVATServices = 0;  // IVA 10%
      let totalVATFood = 0;      // IVA 21%
      const itemBreakdown = [];

      for (const item of items) {
        const pricePerPax = (item.price_pax || 0);
        const discountPerPax = (item.discount_pax || 0);
        const costPerPax = (item.option_cost || 0);
        const netPricePerPax = pricePerPax - discountPerPax;

        const itemTotal = netPricePerPax * pax;
        const itemCost = costPerPax * pax;

        // Determinar IVA según tipo de servicio
        let vatRate = item.vat_rate || VAT_RATES.FOOD;
        
        // Si el tipo de servicio es logística, staff u otro → 10%
        // Si es gastronomía → 21% (alimentos)
        if (['logistics', 'staff', 'other'].includes(item.service_type)) {
          vatRate = VAT_RATES.SERVICE; // 10%
        } else {
          vatRate = VAT_RATES.FOOD; // 21%
        }

        const itemVAT = itemTotal * (vatRate / 100);

        // Separar IVA por tipo
        if (vatRate === VAT_RATES.SERVICE) {
          totalVATServices += itemVAT;
        } else {
          totalVATFood += itemVAT;
        }

        baseAmount += itemTotal;
        totalCost += itemCost;

        itemBreakdown.push({
          name: item.name,
          price_pax: pricePerPax,
          discount_pax: discountPerPax,
          net_pax: netPricePerPax,
          pax: pax,
          subtotal: itemTotal,
          vat_rate: vatRate,
          vat_amount: itemVAT,
          cost: itemCost
        });
      }

      const totalVAT = totalVATServices + totalVATFood;

      // 4. Aplicar descuento por volumen (si aplica)
      let volumeDiscount = 0;
      let volumeDiscountPercentage = 0;
      let volumeDiscountApplied = false;

      const discountTier = await this._getVolumeDiscountTier(pax);
      if (discountTier && !proposal.discount_percentage) {
        volumeDiscountPercentage = discountTier.discount_percentage;
        volumeDiscount = baseAmount * (volumeDiscountPercentage / 100);
        volumeDiscountApplied = true;
      }

      // 5. Aplicar descuento manual de la propuesta (si existe)
      let manualDiscount = 0;
      if (proposal.discount_percentage > 0) {
        manualDiscount = baseAmount * (proposal.discount_percentage / 100);
      }

      const totalDiscount = volumeDiscount + manualDiscount;
      const baseAfterDiscount = baseAmount - totalDiscount;

      // 6. Recalcular IVA sobre base con descuento
      const vatAfterDiscount = baseAfterDiscount * ((totalVAT / baseAmount) || 0);
      const finalTotal = baseAfterDiscount + vatAfterDiscount;

      // 7. Calcular margen
      const totalMargin = baseAfterDiscount - totalCost;
      const marginPercentage = baseAfterDiscount > 0 
        ? (totalMargin / baseAfterDiscount) * 100 
        : 0;

      const result = {
        total_base: Math.round(baseAmount * 100) / 100,
        total_discount: Math.round(totalDiscount * 100) / 100,
        total_base_after_discount: Math.round(baseAfterDiscount * 100) / 100,
        total_vat_services: Math.round(totalVATServices * 100) / 100,
        total_vat_food: Math.round(totalVATFood * 100) / 100,
        total_vat: Math.round(vatAfterDiscount * 100) / 100,
        total_final: Math.round(finalTotal * 100) / 100,
        total_cost: Math.round(totalCost * 100) / 100,
        total_margin: Math.round(totalMargin * 100) / 100,
        margin_percentage: Math.round(marginPercentage * 100) / 100,
        volume_discount_percentage: volumeDiscountPercentage,
        volume_discount_applied: volumeDiscountApplied,
        manual_discount_percentage: proposal.discount_percentage || 0,
        breakdown: itemBreakdown
      };

      // 8. Persistir en la propuesta
      if (persist) {
        await conn.query(
          `UPDATE proposals SET 
            total_base = ?,
            total_vat = ?,
            total_final = ?,
            total_cost = ?,
            total_margin = ?,
            margin_percentage = ?,
            volume_discount_applied = ?,
            last_calculated_at = NOW()
          WHERE id = ?`,
          [
            result.total_base_after_discount,
            result.total_vat,
            result.total_final,
            result.total_cost,
            result.total_margin,
            result.margin_percentage,
            result.volume_discount_applied,
            proposalId
          ]
        );

        // 9. Auditoría opcional
        if (auditUserId) {
          await this._auditPriceChange(
            proposalId,
            auditUserId,
            'recalculation',
            'proposal',
            proposalId,
            proposal.total_final || 0,
            result.total_final,
            'Recálculo automático de totales',
            result
          );
        }
      }

      return result;
    } finally {
      conn.end();
    }
  }

  /**
   * Obtiene el tier de descuento por volumen según PAX
   * @param {number} pax
   * @returns {Promise<object|null>}
   */
  async _getVolumeDiscountTier(pax) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(
        `SELECT * FROM volume_discount_tiers 
         WHERE is_active = TRUE 
           AND min_pax <= ?
           AND (max_pax IS NULL OR max_pax >= ?)
         ORDER BY min_pax DESC
         LIMIT 1`,
        [pax, pax]
      );
      return result[0] || null;
    } finally {
      conn.end();
    }
  }

  /**
   * Registra un cambio de precio en la auditoría
   * @param {number} proposalId
   * @param {number} userId
   * @param {string} changeType
   * @param {string} entityType
   * @param {number} entityId
   * @param {number} oldValue
   * @param {number} newValue
   * @param {string} description
   * @param {object} metadata
   */
  async _auditPriceChange(proposalId, userId, changeType, entityType, entityId, oldValue, newValue, description, metadata = null) {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        `INSERT INTO price_audit_log 
          (proposal_id, user_id, change_type, entity_type, entity_id, old_value, new_value, description, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          proposalId,
          userId,
          changeType,
          entityType,
          entityId,
          oldValue,
          newValue,
          description,
          metadata ? JSON.stringify(metadata) : null
        ]
      );
    } finally {
      conn.end();
    }
  }

  /**
   * Obtiene historial de auditoría de una propuesta
   * @param {number} proposalId
   * @returns {Promise<array>}
   */
  async getPriceAuditLog(proposalId) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(
        `SELECT pal.*, u.name as user_name 
         FROM price_audit_log pal
         LEFT JOIN users u ON pal.user_id = u.id
         WHERE pal.proposal_id = ?
         ORDER BY pal.created_at DESC`,
        [proposalId]
      );
      return result;
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

  /**
   * Aplica un descuento manual a una propuesta
   * @param {number} proposalId
   * @param {number} userId
   * @param {number} discountPercentage - Porcentaje de descuento (0-100)
   * @param {string} reason - Razón del descuento
   * @returns {Promise<object>} - Nuevos totales
   */
  async applyManualDiscount(proposalId, userId, discountPercentage, reason) {
    const conn = await pool.getConnection();
    try {
      await conn.query('START TRANSACTION');

      // Obtener totales actuales
      const [proposal] = await conn.query(
        'SELECT * FROM proposals WHERE id = ?',
        [proposalId]
      );

      if (!proposal) {
        throw new Error('Propuesta no encontrada');
      }

      const oldDiscount = proposal.discount_percentage || 0;

      // Actualizar descuento
      await conn.query(
        `UPDATE proposals 
         SET discount_percentage = ?, 
             discount_reason = ?
         WHERE id = ?`,
        [discountPercentage, reason, proposalId]
      );

      // Recalcular totales
      const totals = await this.calculateTotals(proposalId, { persist: true, auditUserId: userId });

      // Auditar cambio
      await this._auditPriceChange(
        proposalId,
        userId,
        'discount_update',
        'proposal',
        proposalId,
        oldDiscount,
        discountPercentage,
        `Descuento manual aplicado: ${reason}`,
        { reason, totals }
      );

      await conn.query('COMMIT');
      return totals;
    } catch (err) {
      await conn.query('ROLLBACK');
      throw err;
    } finally {
      conn.end();
    }
  }

  /**
   * Obtiene análisis de márgenes de una propuesta
   * @param {number} proposalId
   * @returns {Promise<object>}
   */
  async getMarginAnalysis(proposalId) {
    const conn = await pool.getConnection();
    try {
      const totals = await this.calculateTotals(proposalId, { persist: false });

      // Obtener breakdown por servicio
      const services = await conn.query(
        `SELECT 
          ps.id,
          ps.title,
          ps.type,
          ps.vat_rate,
          SUM(so.price_pax * p.pax) as revenue,
          SUM(so.price_pax * p.pax) as revenue
        FROM proposal_services ps
        JOIN service_options so ON ps.id = so.service_id
        JOIN proposals p ON ps.proposal_id = p.id
        LEFT JOIN proposal_items pi ON so.id = pi.option_id
        WHERE ps.proposal_id = ?
        GROUP BY ps.id`,
        [proposalId]
      );

      return {
        totals,
        services,
        summary: {
          total_revenue: totals.total_base_after_discount,
          total_cost: totals.total_cost,
          total_margin: totals.total_margin,
          margin_percentage: totals.margin_percentage,
          vat_breakdown: {
            services_10: totals.total_vat_services,
            food_21: totals.total_vat_food,
            total: totals.total_vat
          }
        }
      };
    } finally {
      conn.end();
    }
  }

  /**
   * Obtiene configuración de descuentos por volumen
   * @returns {Promise<array>}
   */
  async getVolumeDiscountTiers() {
    const conn = await pool.getConnection();
    try {
      return await conn.query(
        'SELECT * FROM volume_discount_tiers ORDER BY min_pax ASC'
      );
    } finally {
      conn.end();
    }
  }

  /**
   * Actualiza un tier de descuento por volumen
   * @param {number} tierId
   * @param {object} data
   * @returns {Promise<boolean>}
   */
  async updateVolumeDiscountTier(tierId, data) {
    const conn = await pool.getConnection();
    try {
      const allowed = ['min_pax', 'max_pax', 'discount_percentage', 'description', 'is_active'];
      const updates = [];
      const values = [];

      for (const [key, value] of Object.entries(data)) {
        if (allowed.includes(key)) {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (updates.length === 0) {
        return false;
      }

      values.push(tierId);

      await conn.query(
        `UPDATE volume_discount_tiers SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      return true;
    } finally {
      conn.end();
    }
  }

  /**
   * Crea un nuevo tier de descuento por volumen
   * @param {object} data
   * @returns {Promise<number>} - ID del nuevo tier
   */
  async createVolumeDiscountTier(data) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(
        `INSERT INTO volume_discount_tiers (min_pax, max_pax, discount_percentage, description)
         VALUES (?, ?, ?, ?)`,
        [data.min_pax, data.max_pax || null, data.discount_percentage, data.description || '']
      );
      return result.insertId;
    } finally {
      conn.end();
    }
  }
}

module.exports = new ProposalService();
