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
const { VAT_RATES, PROPOSAL_STATUS } = require('../config/constants');

/**
 * Helper para parsear JSON de la BD de forma segura.
 */
/**
 * Helper para parsear JSON de la BD de forma segura.
 */
const safeParse = (val) => {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch (e) { return []; }
  }
  return val || [];
};

class ProposalService {
  /**
   * Helper para parsear JSON de la BD de forma segura.
   */
  safeParse(val) {
    return safeParse(val);
  }

  /**
   * Lista propuestas del usuario con filtros
   * @param {number} userId - ID del usuario (comercial)
   * @param {object} filters - { status, search, page, limit, role }
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
      const role = filters.role || 'commercial';

      // Construir WHERE clause
      // Si es admin, puede ver todo. Si no, solo lo suyo.
      let whereConditions = [];
      let params = [];

      if (role !== 'admin') {
        whereConditions.push('p.user_id = ?');
        params.push(userId);
      } else {
        // Para admin, siempre true para empezar
        whereConditions.push('1=1');
      }

      // Lógica de Archivado por Fecha
      if (status === 'archived') {
        // Solo ver propuestas pasadas
        whereConditions.push('p.event_date < CURDATE()');
      } else {
        // En cualquier otra vista (incluyendo "Todas"), ocultar las pasadas
        // Consideramos las que no tienen fecha como activas
        whereConditions.push('(p.event_date >= CURDATE() OR p.event_date IS NULL)');

        if (status) {
          if (status === 'unread') {
            whereConditions.push(`EXISTS (
              SELECT 1 FROM messages m 
              WHERE m.proposal_id = p.id AND m.sender_role = 'client' AND m.is_read = 0
            )`);
          } else if (status.toLowerCase() === 'pipe' || status === 'draft' || status === 'sent') {
            // Soporte tanto para estados antiguos como para el nuevo unificado
            whereConditions.push('(p.status = "Pipe" OR p.status = "draft" OR p.status = "sent")');
          } else if (status.toLowerCase() === 'aceptada' || status === 'accepted') {
            whereConditions.push('(p.status = "Aceptada" OR p.status = "accepted")');
          } else if (status.toLowerCase() === 'anulada' || status === 'cancelled') {
            whereConditions.push('(p.status = "Anulada" OR p.status = "cancelled")');
          } else {
            whereConditions.push('p.status = ?');
            params.push(status);
          }
        }
      }

      if (search) {
        whereConditions.push('(p.client_name LIKE ? OR p.id LIKE ? OR p.custom_ref LIKE ?)');
        params.push(search, search, search);
      }

      const whereClause = whereConditions.join(' AND ');

      // Query con LEFT JOIN para venues
      // Lógica de venues: si hay uno seleccionado (is_selected=1), mostrar ese, si no, todos
      const query = `
        SELECT 
          p.id,
          p.unique_hash,
          p.custom_ref,
          p.client_name,
          p.client_category,
          p.event_date,
          p.pax,
          p.status,
          p.is_editing,
          p.created_at,
          p.updated_at,
          p.last_viewed_at,
          u.avatar_url as commercial_avatar,
          u.name as commercial_name,
          u.email as commercial_email,
          u.phone as commercial_phone,
          (SELECT COUNT(*) FROM proposal_venues WHERE proposal_id = p.id AND is_selected = 1) as has_selected_venue,
          COALESCE(
            (SELECT v2.name FROM proposal_venues pv2 JOIN venues v2 ON pv2.venue_id = v2.id WHERE pv2.proposal_id = p.id AND pv2.is_selected = 1 LIMIT 1),
            GROUP_CONCAT(DISTINCT v.name SEPARATOR ', ')
          ) as venue_names,
          (SELECT COUNT(*) FROM messages m WHERE m.proposal_id = p.id AND m.sender_role = 'client' AND m.is_read = 0) as unread_messages
        FROM proposals p
        LEFT JOIN proposal_venues pv ON p.id = pv.proposal_id
        LEFT JOIN venues v ON pv.venue_id = v.id
        LEFT JOIN users u ON p.user_id = u.id
        WHERE ${whereClause}
        GROUP BY p.id
        ORDER BY p.updated_at DESC
        LIMIT ? OFFSET ?
      `;

      params.push(limit, offset);

      const result = await conn.query(query, params);

      // Calcular totales para cada propuesta (retornar base con descuentos para listados)
      for (let proposal of result) {
        // Asegurar que unread_messages sea un número (parseInt para BigInt de MariaDB)
        proposal.unread_messages = parseInt(proposal.unread_messages || 0);
        
        const totals = await this.calculateTotals(proposal.id, { persist: false });
        proposal.total = totals.total_base_after_discount;
      }

      return result;
    } finally {
      conn.release();
    }
  }

  /**
   * Actualiza el estado de edición de una propuesta (Modo Mantenimiento)
   * @param {number} id - ID de la propuesta
   * @param {boolean} isEditing - Nuevo estado
   * @returns {Promise<boolean>}
   */
  async updateEditingStatus(id, isEditing) {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        'UPDATE proposals SET is_editing = ? WHERE id = ?',
        [isEditing ? 1 : 0, id]
      );
      return true;
    } catch (err) {
      console.error('Error en updateEditingStatus:', err.message);
      throw err;
    } finally {
      conn.release();
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
        return null; // Devolver null en lugar de lanzar error
      }

      const prop = proposal[0];

      // Venues asociados
      const venues = await conn.query(
        `SELECT pv.*, v.name, v.description, v.address, v.map_iframe, v.external_url, v.images
         FROM proposal_venues pv
         JOIN venues v ON pv.venue_id = v.id
         WHERE pv.proposal_id = ?`,
        [id]
      );

      // Servicios - Query separado para evitar problemas con GROUP_CONCAT
      let services = await conn.query(
        `SELECT *, DATE_FORMAT(service_date, '%Y-%m-%d') as service_date_formatted 
         FROM proposal_services 
         WHERE proposal_id = ? 
         ORDER BY order_index`,
        [id]
      );

      // Mapear la fecha formateada para evitar colisiones de nombres en MariaDB
      services = services.map(s => ({
        ...s,
        service_date: s.service_date_formatted || s.service_date
      }));

      // Obtener opciones para cada servicio
      for (let service of services) {
        const options = await conn.query(
          `SELECT * FROM service_options WHERE service_id = ?`,
          [service.id]
        );
        
        // Obtener items para cada opción
        for (let option of options) {
          option.images = this.safeParse(option.images);
          option.badges = this.safeParse(option.badges);

          const items = await conn.query(
            `SELECT pi.*, d.images as master_images, d.allergens as master_allergens,
                    COALESCE(ac.order_index, 999) as category_order
             FROM proposal_items pi
             LEFT JOIN dishes d ON pi.dish_id = d.id
             LEFT JOIN app_categories ac ON COALESCE(pi.category, d.category) = ac.name AND ac.type = 'dish'
             WHERE pi.option_id = ?
             ORDER BY category_order ASC, pi.category ASC, pi.order_index ASC, pi.id ASC`,
            [option.id]
          );
          
          // Parsear JSON fields
          option.items = (items || []).map(item => ({
            ...item,
            allergens: this.safeParse(item.allergens),
            badges: this.safeParse(item.badges),
            master_images: this.safeParse(item.master_images),
            master_allergens: this.safeParse(item.master_allergens)
          }));
        }
        
        service.options = options || [];
      }

      prop.venues = venues || [];
      prop.services = services || [];
      
      // Obtener totales completos
      try {
        const totals = await this.calculateTotals(id, { persist: true });
        prop.totals = totals;
        prop.total = totals.total_final;

        // Enriquecer servicios con el precio calculado para la vista
        prop.services.forEach(service => {
          // Buscamos las entradas del breakdown que corresponden a este servicio por su ID
          const serviceEntries = (totals.breakdown || []).filter(b => b.service_id === service.id);
          
          if (serviceEntries.length > 0) {
            const serviceTotalBase = serviceEntries.reduce((sum, b) => sum + (b.subtotal || 0), 0);
            const servicePax = service.pax || prop.pax || 1;
            service.price_per_pax = serviceTotalBase / servicePax;
          } else {
            service.price_per_pax = 0;
          }
        });
      } catch (err) {
        console.error('Error calculando totales en getProposalById:', err.message);
        prop.totals = { total_base: 0, total_vat: 0, total_final: 0, breakdown: [] };
        prop.total = 0;
      }

      return prop;
    } finally {
      conn.release();
    }
  }

  /**
   * Crea una nueva propuesta
   * @param {number} userId
   * @param {object} data - { client_name, event_date, pax, brand_color, logo_url }
   * @returns {Promise<object>}
   */
  async createProposal(userId, data) {
    const conn = await pool.getConnection();
    try {
      await conn.query('START TRANSACTION');

      const unique_hash = uuidv4().replace(/-/g, '').substring(0, 32);

      const defaultGeneralConditions = `NUESTRO PRESUPUESTO INCLUYE:
- Gastronomía y bebida.
- Todo el material necesario para la presentación del servicio.
- Servicios de café en materiales 100% sostenibles.
- Mobiliario: Una mesa de cocktail cada 25 personas / Una mesa de banquete cada 10.
- Montaje, desmontaje y recogida el mismo día del servicio.
- Transporte dentro de la Comunidad de Madrid.
- Personal de sala, cocina y logística.
- Decoración: Detalle en veladores y estaciones con producto fresco.

PAGOS Y CONTRATACIÓN:
- Anticipo: 50% al confirmar la reserva del servicio.
- Liquidación: 50% restante antes de 7 días hábiles del evento.
- Mínimos: Coffees 1.200€, Vino Español 1.800€, Otros 2.500€ (+ IVA).

SE FACTURARÁ ADICIONALMENTE:
- Variaciones de pax o cambios de horario.
- Tiempos muertos entre servicios superiores a 2 horas.
- Cambio de material de café a cristal y loza (2,50€ + IVA / pax).
- Carpa de cocina exterior (desde 750€ + IVA).
- Picnic para staff de la organización (desde 20,00€ / pax).

RETRASOS:
- Cortesía de 15 min. Transcurrido este tiempo, 35,50€ + IVA / hora por persona.

VARIOS:
- Diciembre: Cancelaciones < 45 días penalización 50%.
- Alergias: Solo GLUTEN, LÁCTEOS, MARISCOS, FRUTOS SECOS. Sin garantía de trazas.`;

      const result = await conn.query(
        `INSERT INTO proposals (user_id, unique_hash, client_name, client_category, event_date, event_end_date, pax, brand_color, logo_url, status, is_editing, general_conditions)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          unique_hash,
          data.client_name || 'Sin nombre',
          data.client_category || null,
          data.event_date || null,
          data.event_end_date || null,
          data.pax || 0,
          data.brand_color || '#000000',
          data.logo_url || null,
          PROPOSAL_STATUS.PIPE,
          true,
          defaultGeneralConditions
        ]
      );

      await conn.query('COMMIT');

      const insertId = result.insertId || (result[0] && result[0].insertId);

      return {
        id: insertId,
        unique_hash,
        ...data,
        status: PROPOSAL_STATUS.PIPE,
        is_editing: true
      };
    } catch (err) {
      await conn.query('ROLLBACK');
      throw err;
    } finally {
      conn.release();
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
      console.log(`[ProposalService.updateProposal] ID: ${id}, Keys in changes:`, Object.keys(changes));
      const allowed = [
        'client_name', 'client_category', 'client_email', 'event_date', 'event_end_date', 'pax', 
        'status', 'brand_color', 'logo_url', 'legal_conditions', 'general_conditions', 
        'show_general_conditions', 'show_legal_conditions', 'valid_until', 'is_editing', 
        'custom_ref', 'discount_percentage', 'discount_fixed', 'discount_reason'
      ];
      
      const updates = [];
      const values = [];

      Object.keys(changes).forEach(key => {
        if (allowed.includes(key)) {
          let value = changes[key];
          if (value === '' || value === undefined) value = null;
          updates.push(`${key} = ?`);
          values.push(value);
        } else {
          console.warn(`[ProposalService.updateProposal] Field not allowed: ${key}`);
        }
      });

      if (updates.length === 0) {
        console.warn(`[ProposalService.updateProposal] No valid updates found among keys:`, Object.keys(changes));
        return { success: false, message: 'No hay campos válidos para actualizar' };
      }

      values.push(id);
      console.log(`[ProposalService.updateProposal] SQL: UPDATE proposals SET ${updates.join(', ')} WHERE id = ?`, values);
      await conn.query(`UPDATE proposals SET ${updates.join(', ')} WHERE id = ?`, values);
      
      // Sincronización de fechas de servicios (UX Improvement)
      if (changes.sync_service_dates && (changes.event_date || changes.event_end_date)) {
          const newDate = changes.event_date;
          if (newDate) {
              console.log(`[ProposalService.updateProposal] Syncing ${id} service dates to ${newDate}`);
              await conn.query('UPDATE proposal_services SET service_date = ? WHERE proposal_id = ?', [newDate, id]);
          }
      }

      return { success: true, id };
    } catch (err) {
      console.error('[ProposalService] updateProposal Error:', err);
      throw err;
    } finally {
      conn.release();
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

      // 2. Obtener todas las opciones y sus servicios
      const options_data = await conn.query(
        `SELECT 
          so.id as option_id,
          so.name as option_name,
          so.price_pax as option_price_pax,
          so.discount_pax,
          so.price_model as option_price_model,
          ps.id as service_id,
          ps.vat_rate as service_vat_rate,
          ps.pax as service_pax,
          ps.type as service_type,
          ps.title as service_title,
          ps.is_multichoice,
          ps.selected_option_index,
          ps.price_model as service_price_model
        FROM service_options so
        JOIN proposal_services ps ON so.service_id = ps.id
        WHERE ps.proposal_id = ?`,
        [proposalId]
      );

      // 3. Obtener todos los ítems de estas opciones
      const items_data = await conn.query(
        `SELECT 
          pi.*
        FROM proposal_items pi
        JOIN service_options so ON pi.option_id = so.id
        JOIN proposal_services ps ON so.service_id = ps.id
        WHERE ps.proposal_id = ?
        ORDER BY pi.order_index ASC`,
        [proposalId]
      );

      // --- PRE-CÁLCULO DE SUB-TOTALES POR OPCIÓN ---
      const optionCalculations = new Map();
      
      for (const opt of options_data) {
        const effectivePax = Number(opt.service_pax || pax || 1);
        const optItems = items_data.filter(i => Number(i.option_id) === Number(opt.option_id));
        const priceModel = (opt.option_price_model === 'fixed' || opt.service_price_model === 'fixed') ? 'fixed' : 'pax';
        
        let subtotal = 0;
        let finalPricePerPax = 0;

        if (optItems.length === 0) {
          finalPricePerPax = Number(opt.option_price_pax || 0);
          const unitPriceAfterDiscount = finalPricePerPax - Number(opt.discount_pax || 0);
          
          if (priceModel === 'fixed') {
            subtotal = unitPriceAfterDiscount;
          } else {
            subtotal = unitPriceAfterDiscount * effectivePax;
          }
        } else {
          let itemsSum = 0;
          let anyItemHasPrice = false;

          for (const item of optItems) {
            const up = Number(item.price_unit || 0);
            const qty = Number(item.quantity || 1);
            if (up > 0) {
              itemsSum += (up * qty);
              anyItemHasPrice = true;
            }
          }

          finalPricePerPax = anyItemHasPrice ? itemsSum : Number(opt.option_price_pax || 0);
          const unitPriceAfterDiscount = finalPricePerPax - Number(opt.discount_pax || 0);

          if (priceModel === 'fixed') {
            subtotal = unitPriceAfterDiscount;
          } else {
            subtotal = unitPriceAfterDiscount * effectivePax;
          }
        }

        const vatRate = Number(opt.service_vat_rate || (['logistics', 'staff', 'other'].includes(opt.service_type) ? 10 : 21));
        
        optionCalculations.set(opt.option_id, {
          subtotal,
          finalPricePerPax,
          effectivePax,
          vatRate
        });
      }

      // 4. Calcular totales (Aprobado vs Máximo)
      let baseAmount = 0;
      let totalVATServices = 0;  // IVA 10%
      let totalVATFood = 0;      // IVA 21%
      const itemBreakdown = [];

      let maxPotentialBase = 0;
      let maxTotalVATServices = 0;
      let maxTotalVATFood = 0;
      const maxPotentialBreakdown = [];

      // Agrupar por servicio
      const servicesMap = new Map();
      options_data.forEach(opt => {
        if (!servicesMap.has(opt.service_id)) {
          servicesMap.set(opt.service_id, {
            id: opt.service_id,
            title: opt.service_title,
            is_multichoice: opt.is_multichoice,
            selected_option_index: opt.selected_option_index,
            options: [] 
          });
        }
        servicesMap.get(opt.service_id).options.push(opt);
      });

      const shouldIncludeService = (serviceData) => {
        const selectedIndex = serviceData.selected_option_index;
        
        // Si está cancelado explícitamente (-1)
        if (selectedIndex === -1 || selectedIndex === '-1') return false; 
        
        // Si no se ha tomado ninguna decisión (NULL o UNDEFINED)
        if (selectedIndex === null || selectedIndex === undefined) return false;

        // Si es multichoice, debe ser un índice válido (0 o más)
        if (serviceData.is_multichoice) {
          return Number(selectedIndex) >= 0;
        }
        
        // Si es normal, el único índice válido suele ser 0 (la única opción)
        return Number(selectedIndex) === 0;
      };

      for (const [serviceId, serviceData] of servicesMap) {
        // A. CÁLCULO APROBADO (REAL)
        if (shouldIncludeService(serviceData)) {
          let optionsToCalculate = [];
          
          if (serviceData.is_multichoice) {
            const sorted = [...serviceData.options].sort((a,b) => a.option_id - b.option_id);
            const selected = sorted[serviceData.selected_option_index];
            if (selected) optionsToCalculate = [selected];
          } else {
            optionsToCalculate = serviceData.options;
          }

          for (const opt of optionsToCalculate) {
            const calc = optionCalculations.get(opt.option_id);
            if (!calc) continue;

            baseAmount += calc.subtotal;
            const vatAmount = calc.subtotal * (calc.vatRate / 100);
            if (calc.vatRate <= 10) totalVATServices += vatAmount;
            else totalVATFood += vatAmount;

            itemBreakdown.push({
              service_id: opt.service_id,
              name: `${opt.service_title} - ${opt.option_name}`,
              price_pax: calc.finalPricePerPax,
              pax: calc.effectivePax,
              subtotal: calc.subtotal,
              vat_rate: calc.vatRate,
              price_model: (opt.option_price_model === 'fixed' || opt.service_price_model === 'fixed') ? 'fixed' : 'pax'
            });
          }
        }

        // B. CÁLCULO MÁXIMO POTENCIAL (TODOS LOS SERVICIOS)
        if (serviceData.is_multichoice) {
          // Si es multichoice, tomamos la opción más cara
          let maxSub = -1;
          let maxVat = 0;
          let maxRate = 10;
          let bestOpt = null;

          for (const opt of serviceData.options) {
            const calc = optionCalculations.get(opt.option_id);
            if (calc && calc.subtotal > maxSub) {
              maxSub = calc.subtotal;
              maxVat = calc.subtotal * (calc.vatRate / 100);
              maxRate = calc.vatRate;
              bestOpt = opt;
            }
          }

          if (bestOpt) {
            const bestCalc = optionCalculations.get(bestOpt.option_id);
            maxPotentialBase += maxSub;
            if (maxRate <= 10) maxTotalVATServices += maxVat;
            else maxTotalVATFood += maxVat;

            maxPotentialBreakdown.push({
              service_id: serviceId,
              name: `${serviceData.title} (Máx: ${bestOpt.option_name})`,
              price_pax: bestCalc.finalPricePerPax,
              pax: bestCalc.effectivePax,
              subtotal: maxSub,
              vat_rate: maxRate,
              price_model: (bestOpt.option_price_model === 'fixed' || bestOpt.service_price_model === 'fixed') ? 'fixed' : 'pax'
            });
          }
        } else {
          // Si es simple, sumamos todas sus opciones (igual que en real)
          for (const opt of serviceData.options) {
            const calc = optionCalculations.get(opt.option_id);
            if (calc) {
              maxPotentialBase += calc.subtotal;
              const vat = calc.subtotal * (calc.vatRate / 100);
              if (calc.vatRate <= 10) maxTotalVATServices += vat;
              else maxTotalVATFood += vat;

              maxPotentialBreakdown.push({
                service_id: serviceId,
                name: `${serviceData.title} - ${opt.option_name}`,
                price_pax: calc.finalPricePerPax,
                pax: calc.effectivePax,
                subtotal: calc.subtotal,
                vat_rate: calc.vatRate,
                price_model: (opt.option_price_model === 'fixed' || opt.service_price_model === 'fixed') ? 'fixed' : 'pax'
              });
            }
          }
        }
      }

      const totalVAT = totalVATServices + totalVATFood;
      
      // 5. Obtener líneas de descuento adicionales
      const discount_lines = await conn.query(
        'SELECT * FROM proposal_discounts WHERE proposal_id = ? ORDER BY order_index ASC, id ASC',
        [proposalId]
      );

      // --- CÁLCULO DE DESCUENTOS (REAL VS POTENCIAL) ---
      const calcDiscounts = (base) => {
        let total = 0;
        if (proposal.discount_percentage > 0) total += base * (proposal.discount_percentage / 100);
        if (proposal.discount_fixed > 0) total += parseFloat(proposal.discount_fixed);
        for (const line of discount_lines) {
          if (line.type === 'percentage') total += base * (line.value / 100);
          else total += parseFloat(line.value);
        }
        return total;
      };

      const totalDiscountAmount = calcDiscounts(baseAmount);
      const totalMaxDiscountAmount = calcDiscounts(maxPotentialBase);

      const appliedDiscounts = [];
      // (Breakdown para el modal de descuentos, usamos los reales)
      if (proposal.discount_percentage > 0) {
        appliedDiscounts.push({ id: 'legacy-p', name: `Dto. General ${proposal.discount_percentage}%`, amount: baseAmount * (proposal.discount_percentage / 100), type: 'percentage', value: proposal.discount_percentage });
      }
      if (proposal.discount_fixed > 0) {
        appliedDiscounts.push({ id: 'legacy-f', name: 'Dto. Nominal', amount: parseFloat(proposal.discount_fixed), type: 'fixed', value: proposal.discount_fixed });
      }
      for (const line of discount_lines) {
        appliedDiscounts.push({ id: line.id, name: line.name, amount: line.type === 'percentage' ? (baseAmount * line.value / 100) : line.value, type: line.type, value: line.value });
      }

      const baseAfterDiscount = Math.max(0, baseAmount - totalDiscountAmount);
      const vatAfterDiscount = baseAfterDiscount * ((totalVAT / (baseAmount || 1)) || 0);
      const finalTotal = baseAfterDiscount + vatAfterDiscount;

      // Cálculo Máximo Potencial
      const maxPotentialBaseAfterDiscount = Math.max(0, maxPotentialBase - totalMaxDiscountAmount);
      const maxTotalVAT = maxTotalVATServices + maxTotalVATFood;
      const maxVatRatio = maxPotentialBase > 0 ? (maxTotalVAT / maxPotentialBase) : 0;
      const maxVatAfterDiscount = maxPotentialBaseAfterDiscount * maxVatRatio;
      const maxPotentialFinal = maxPotentialBaseAfterDiscount + maxVatAfterDiscount;

      // Generar desglose por tipo de IVA para la vista del cliente
      const vatBreakdown = [];
      const discountRatio = baseAmount > 0 ? (baseAfterDiscount / baseAmount) : 1;

      if (totalVATServices > 0 || (totalVATFood === 0 && baseAmount > 0)) {
        let sumBase10 = 0;
        itemBreakdown.filter(i => i.vat_rate <= 10).forEach(i => sumBase10 += i.subtotal);
        
        const discountedBase10 = sumBase10 * discountRatio;
        const discountedVat10 = discountedBase10 * 0.10;

        if (sumBase10 > 0) {
          vatBreakdown.push({
            label: 'Servicios y Logística',
            base: Math.round(sumBase10 * 100) / 100, // Base antes del descuento
            rate: 10,
            vat: Math.round(discountedVat10 * 100) / 100,
            total: Math.round((sumBase10 + (discountedVat10 / discountRatio)) * 100) / 100 // Total antes del descuento
          });
        }
      }

      if (totalVATFood > 0) {
        let sumBase21 = 0;
        itemBreakdown.filter(i => i.vat_rate > 10).forEach(i => sumBase21 += i.subtotal);

        if (sumBase21 > 0) {
          const discountedBase21 = sumBase21 * discountRatio;
          const discountedVat21 = discountedBase21 * 0.21;
          
          vatBreakdown.push({
            label: 'Gastronomía y Bebidas',
            base: Math.round(sumBase21 * 100) / 100, // Base antes del descuento
            rate: 21,
            vat: Math.round(discountedVat21 * 100) / 100,
            total: Math.round((sumBase21 + (discountedVat21 / discountRatio)) * 100) / 100 // Total antes del descuento
          });
        }
      }

      const result = {
        total_base: Math.round(baseAmount * 100) / 100,
        total_discount: Math.round(totalDiscountAmount * 100) / 100,
        discounts: appliedDiscounts,
        total_base_after_discount: Math.round(baseAfterDiscount * 100) / 100,
        total_vat: Math.round(vatAfterDiscount * 100) / 100,
        total_final: Math.round(finalTotal * 100) / 100,
        // Datos Potenciales
        total_max_base: Math.round(maxPotentialBase * 100) / 100,
        total_max_discount: Math.round(totalMaxDiscountAmount * 100) / 100,
        total_max_vat: Math.round(maxVatAfterDiscount * 100) / 100,
        total_max_potential: Math.round(maxPotentialFinal * 100) / 100,
        // Otros
        breakdown: itemBreakdown, 
        max_breakdown: maxPotentialBreakdown,
        vat_breakdown: vatBreakdown,
        discount_percentage: proposal.discount_percentage,
        discount_fixed: proposal.discount_fixed,
        discount_reason: proposal.discount_reason
      };

      if (persist) {
        await conn.query(
          'UPDATE proposals SET total_base = ?, total_vat = ?, total_final = ?, total_max_potential = ?, updated_at = NOW() WHERE id = ?',
          [result.total_base, result.total_vat, result.total_final, result.total_max_potential, proposalId]
        );
      }

      return result;
    } finally {
      conn.release();
    }
  }

  /**
   * Valida si la propuesta tiene al menos un hito "Anadido"
   * @param {number} proposalId
   * @returns {Promise<boolean>}
   */
  async checkProposalCompletion(proposalId) {
    const conn = await pool.getConnection();
    try {
      const rows = await conn.query(
        'SELECT COUNT(*) as total FROM proposal_services WHERE proposal_id = ? AND selected_option_index >= 0',
        [proposalId]
      );
      const total = Number(rows[0]?.total || 0);
      return total > 0;
    } finally {
      conn.release();
    }
  }

  /**
   * Actualiza el estado de un hito (Anadido / Pendiente / Cancelado)
   * @param {number} proposalId
   * @param {number} serviceId
   * @param {string} status - added | pending | cancelled
   * @returns {Promise<boolean>}
   */
  async updateMilestoneStatus(proposalId, serviceId, status) {
    const conn = await pool.getConnection();
    try {
      const normalized = String(status || '').toLowerCase();
      if (!['added', 'pending', 'cancelled'].includes(normalized)) {
        throw new Error('Estado de hito no valido');
      }

      const rows = await conn.query(
        'SELECT id, is_multichoice, selected_option_index FROM proposal_services WHERE id = ? AND proposal_id = ?',
        [serviceId, proposalId]
      );

      if (!rows.length) {
        throw new Error('Hito no encontrado para la propuesta');
      }

      const service = rows[0];
      if (service.is_multichoice && normalized === 'added') {
        throw new Error('Selecciona una opcion para marcar este hito como anadido');
      }

      let nextIndex = null;
      if (normalized === 'added') {
        nextIndex = 0;
      } else if (normalized === 'cancelled') {
        nextIndex = -1;
      } else {
        nextIndex = null;
      }

      await conn.query(
        'UPDATE proposal_services SET selected_option_index = ? WHERE id = ? AND proposal_id = ?',
        [nextIndex, serviceId, proposalId]
      );

      return true;
    } finally {
      conn.release();
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
      conn.release();
    }
  }

  /**
   * Duplica una propuesta completa (Deep Clone)
   * Copia: propuesta → venues → servicios → opciones → items
   * @param {number} originalId
   * @returns {Promise<number>} ID de la nueva propuesta
   */
  /**
   * DUPLICAR MENÚ / OPCIÓN
   */
  async duplicateOption(optionId) {
    const conn = await pool.getConnection();
    try {
      await conn.query('START TRANSACTION');

      // 1. Obtener la opción original
      const [optRows] = await conn.query('SELECT * FROM service_options WHERE id = ?', [optionId]);
      if (!optRows || optRows.length === 0) throw new Error('Opción no encontrada');
      const opt = optRows[0];

      // 2. Insertar nueva opción
      const res = await conn.query(
        'INSERT INTO service_options (service_id, name, description, price_pax, price_model, images, badges, url_images, video_url, discount_pax) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [opt.service_id, `${opt.name} (Copia)`, opt.description, opt.price_pax, opt.price_model, opt.images, opt.badges, opt.url_images, opt.video_url || null, opt.discount_pax]
      );
      const newOptionId = res.insertId;

      // 3. Duplicar los items
      await conn.query(
        `INSERT INTO proposal_items (option_id, dish_id, name, description, price_unit, quantity, vat_rate, order_index, category, allergens, badges, image_url)
         SELECT ?, dish_id, name, description, price_unit, quantity, vat_rate, order_index, category, allergens, badges, image_url 
         FROM proposal_items WHERE option_id = ?`,
        [newOptionId, optionId]
      );

      await conn.query('COMMIT');
      return { success: true, id: newOptionId };
    } catch (err) {
      if (conn) await conn.query('ROLLBACK');
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * DUPLICAR HITO / SERVICIO
   * Clona un servicio con todas sus opciones e ítems dentro de la misma propuesta
   */
  async duplicateService(serviceId) {
    const conn = await pool.getConnection();
    try {
      await conn.query('START TRANSACTION');

      // 1. Obtener servicio original
      const [service] = await conn.query('SELECT * FROM proposal_services WHERE id = ?', [serviceId]);
      if (!service) throw new Error('Servicio no encontrado');

      // 2. Insertar nuevo servicio (clon)
      const newServiceResult = await conn.query(
        `INSERT INTO proposal_services (proposal_id, title, type, start_time, end_time, pax, vat_rate, order_index, is_multichoice, is_optional, selected_option_index, service_date, duration, comments, location, price_model)
         SELECT proposal_id, CONCAT(title, ' (Copia)'), type, start_time, end_time, pax, vat_rate, order_index + 1, is_multichoice, is_optional, NULL, service_date, duration, comments, location, price_model
         FROM proposal_services WHERE id = ?`,
        [serviceId]
      );
      const newServiceId = newServiceResult.insertId;

      // 3. Clonar Opciones
      const options = await conn.query('SELECT * FROM service_options WHERE service_id = ?', [serviceId]);
      for (const opt of options) {
        const newOptResult = await conn.query(
          `INSERT INTO service_options (service_id, name, price_pax, discount_pax, description, price_model, images, badges, url_images, video_url, cost_price, margin_percentage)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [newServiceId, opt.name, opt.price_pax, opt.discount_pax, opt.description, opt.price_model, opt.images, opt.badges, opt.url_images, opt.video_url || null, opt.cost_price, opt.margin_percentage]
        );
        const newOptId = newOptResult.insertId;

        // 4. Clonar Ítems de la opción
        await conn.query(
          `INSERT INTO proposal_items (option_id, dish_id, name, description, allergens, badges, image_url, order_index, vat_rate, price_unit, category)
           SELECT ?, dish_id, name, description, allergens, badges, image_url, order_index, vat_rate, price_unit, category
           FROM proposal_items WHERE option_id = ?`,
          [newOptId, opt.id]
        );
      }

      await conn.query('COMMIT');
      return { success: true, newServiceId };
    } catch (err) {
      await conn.query('ROLLBACK');
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * IMPORTAR MENÚ COMPLETO A UNA OPCIÓN
   * Toma todos los platos de un menú maestro y los añade a la opción
   */
  async importMenuToOption(optionId, menuId) {
    const conn = await pool.getConnection();
    try {
      await conn.query('START TRANSACTION');

      // 1. Obtener datos del menú maestro
      const [menu] = await conn.query('SELECT * FROM menus WHERE id = ?', [menuId]);
      if (!menu) throw new Error('El menú maestro no existe');

      // 2. ACTUALIZAR LA OPCIÓN con metadatos del menú (Deep Copy)
      await conn.query(
        'UPDATE service_options SET description = ?, images = ?, badges = ?, price_pax = ?, url_images = ?, video_url = ? WHERE id = ?',
        [
          menu.description,
          JSON.stringify(this.safeParse(menu.images)),
          JSON.stringify(this.safeParse(menu.badges)),
          menu.base_price,
          menu.url_images,
          menu.video_url || null,
          optionId
        ]
      );

      // 3. Obtener platos del menú maestro
      const dishes = await conn.query(
        `SELECT d.*, md.sort_order 
         FROM menu_dishes md
         JOIN dishes d ON md.dish_id = d.id
         WHERE md.menu_id = ?
         ORDER BY md.sort_order ASC`,
        [menuId]
      );

      // Limpiar ítems previos de la opción antes de importar los nuevos
      await conn.query('DELETE FROM proposal_items WHERE option_id = ?', [optionId]);

      // 4. Insertar cada plato como proposal_item
      for (const dish of dishes) {
        // Encontrar la primera imagen del plato para el thumbnail
        const imagesArr = this.safeParse(dish.images);
        const mainImage = imagesArr.length > 0 ? imagesArr[0] : dish.image_url;

        await conn.query(
          `INSERT INTO proposal_items (option_id, dish_id, name, description, allergens, badges, image_url, order_index, price_unit, category)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            optionId, 
            dish.id, 
            dish.name, 
            dish.description, 
            typeof dish.allergens === 'string' ? dish.allergens : JSON.stringify(dish.allergens || []),
            typeof dish.badges === 'string' ? dish.badges : JSON.stringify(dish.badges || []),
            mainImage, 
            dish.sort_order,
            0,
            dish.category
          ]
        );
      }

      await conn.query('COMMIT');
      return { success: true, count: dishes.length };
    } catch (err) {
      await conn.query('ROLLBACK');
      console.error('[ProposalService] importMenuToOption Error:', err);
      throw err;
    } finally {
      conn.release();
    }
  }

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
        `INSERT INTO proposals (user_id, unique_hash, client_name, event_date, pax, brand_color, logo_url, legal_conditions, status, is_editing, valid_until)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orig.user_id,
          newHash,
          `${orig.client_name} (Copia)`,
          orig.event_date,
          orig.pax,
          orig.brand_color,
          orig.logo_url,
          orig.legal_conditions,
          PROPOSAL_STATUS.PIPE,
          true,
          orig.valid_until
        ]
      );

      const newProposalId = newProposal.insertId || (newProposal[0] && newProposal[0].insertId);

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
          `INSERT INTO proposal_services (proposal_id, title, type, start_time, end_time, vat_rate, order_index, is_multichoice, is_optional, selected_option_index, service_date, duration, comments)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newProposalId,
            service.title,
            service.type,
            service.start_time,
            service.end_time,
            service.vat_rate,
            service.order_index,
            service.is_multichoice,
            service.is_optional || 0,
            null,
            service.service_date,
            service.duration,
            service.comments
          ]
        );

        const newServiceId = newService.insertId || (newService[0] && newService[0].insertId);

        // Copiar opciones del servicio
        const options = await conn.query(
          'SELECT * FROM service_options WHERE service_id = ?',
          [service.id]
        );

        for (const option of options) {
          const newOption = await conn.query(
            'INSERT INTO service_options (service_id, name, price_pax, discount_pax, description, price_model, images, badges, url_images, video_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [newServiceId, option.name, option.price_pax, option.discount_pax, option.description, option.price_model, option.images, option.badges, option.url_images, option.video_url || null]
          );

          const newOptionId = newOption.insertId || (newOption[0] && newOption[0].insertId);

          // Copiar items del servicio
          const items = await conn.query(
            'SELECT * FROM proposal_items WHERE option_id = ?',
            [option.id]
          );

          for (const item of items) {
            await conn.query(
              'INSERT INTO proposal_items (option_id, name, description, allergens, badges, image_url, dish_id, category, order_index, price_unit, vat_rate, quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [newOptionId, item.name, item.description, item.allergens, item.badges, item.image_url, item.dish_id, item.category, item.order_index, item.price_unit, item.vat_rate, item.quantity]
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
      conn.release();
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

      // 0. Obtener logo_url antes de borrar
      const [proposal] = await conn.query('SELECT logo_url FROM proposals WHERE id = ?', [id]);
      let logoDeleted = false;
      if (proposal && proposal.logo_url) {
        // Extraer hash de la ruta: /uploads/{hash}/...
        const match = proposal.logo_url.match(/\/uploads\/(\w{12})\//);
        if (match && match[1]) {
          const imageHash = match[1];
          try {
            const ImageService = require('./ImageService');
            const result = await ImageService.deleteImage(imageHash);
            logoDeleted = result.deleted;
            if (logoDeleted) {
              console.log(`[ProposalService.deleteProposal] Logo eliminado correctamente: ${proposal.logo_url}`);
            } else {
              console.warn(`[ProposalService.deleteProposal] No se pudo eliminar logo: ${proposal.logo_url} (${result.message})`);
            }
          } catch (e) {
            console.warn(`[ProposalService.deleteProposal] Error eliminando logo: ${e.message}`);
          }
        }
      }

      // 1. Borrar mensajes de chat asociados (aunque haya cascada en DB)
      await conn.query('DELETE FROM messages WHERE proposal_id = ?', [id]);

      // 2. Borrar la propuesta (las cascadas en la BD borrarán venues, services, options, items automáticamente)
      await conn.query('DELETE FROM proposals WHERE id = ?', [id]);

      await conn.query('COMMIT');
      return true;
    } catch (err) {
      if (conn) await conn.query('ROLLBACK');
      throw err;
    } finally {
      if (conn) conn.release();
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
        `SELECT p.*, u.name as commercial_name, u.email as commercial_email, u.phone as commercial_phone, u.avatar_url as commercial_avatar 
         FROM proposals p 
         LEFT JOIN users u ON p.user_id = u.id 
         WHERE p.unique_hash = ?`,
        [hash]
      );
      return result[0] || null;
    } finally {
      conn.release();
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
      conn.release();
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
      conn.release();
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
      conn.release();
    }
  }

  /**
   * Obtiene configuración de descuentos por volumen
   * ⚠️ COMENTADO: Tabla volume_discount_tiers no existe
   * @returns {Promise<array>}
   */
  // async getVolumeDiscountTiers() {
  //   const conn = await pool.getConnection();
  //   try {
  //     return await conn.query(
  //       'SELECT * FROM volume_discount_tiers ORDER BY min_pax ASC'
  //     );
  //   } finally {
  //     conn.release();
  //   }
  // }

  /**
   * Actualiza un tier de descuento por volumen
   * ⚠️ COMENTADO: Tabla volume_discount_tiers no existe
   * @param {number} tierId
   * @param {object} data
   * @returns {Promise<boolean>}
   */
  // async updateVolumeDiscountTier(tierId, data) {
  //   const conn = await pool.getConnection();
  //   try {
  //     const allowed = ['min_pax', 'max_pax', 'discount_percentage', 'description', 'is_active'];
  //     const updates = [];
  //     const values = [];
  //
  //     for (const [key, value] of Object.entries(data)) {
  //       if (allowed.includes(key)) {
  //         updates.push(`${key} = ?`);
  //         values.push(value);
  //       }
  //     }
  //
  //     if (updates.length === 0) {
  //       return false;
  //     }
  //
  //     values.push(tierId);
  //
  //     await conn.query(
  //       `UPDATE volume_discount_tiers SET ${updates.join(', ')} WHERE id = ?`,
  //       values
  //     );
  //
  //     return true;
  //   } finally {
  //     conn.release();
  //   }
  // }

  /**
   * Crea un nuevo tier de descuento por volumen
   * ⚠️ COMENTADO: Tabla volume_discount_tiers no existe
   * @param {object} data
   * @returns {Promise<number>} - ID del nuevo tier
   */
  // async createVolumeDiscountTier(data) {
  //   const conn = await pool.getConnection();
  //   try {
  //     const result = await conn.query(
  //       `INSERT INTO volume_discount_tiers (min_pax, max_pax, discount_percentage, description)
  //        VALUES (?, ?, ?, ?)`,
  //       [data.min_pax, data.max_pax || null, data.discount_percentage, data.description || '']
  //     );
  //     return result.insertId;
  //   } finally {
  //     conn.release();
  //   }
  // }

  /**
   * Añadir items (platos) a un servicio/opción
   * Los items se copian desde el catálogo de dishes (deep clone adhoc)
   * @param {number} optionId - ID de la opción del servicio
   * @param {array} items - Array de {dishId, quantity?, customName?, customDescription?, customPrice?}
   * @returns {Promise<array>} - Array de items creados con sus IDs
   */
  async addItemsToOption(optionId, items) {
    const conn = await pool.getConnection();
    try {
      // Verificar que la opción existe
      const option = await conn.query('SELECT id FROM service_options WHERE id = ?', [optionId]);
      if (option.length === 0) {
        throw new Error('Opción de servicio no encontrada');
      }

      const createdItems = [];

      for (const item of items) {
        const { dishId, quantity = 1, customName, customDescription, customPrice } = item;

        // Si viene de un plato del catálogo, copiar sus datos
        let itemData = {
          name: customName || '',
          description: customDescription || '',
          allergens: JSON.stringify([]),
          badges: JSON.stringify([]),
          image_url: null,
          dish_id: null
        };

        if (dishId) {
          // Obtener datos del plato original
          const dishRows = await conn.query('SELECT * FROM dishes WHERE id = ?', [dishId]);
          if (dishRows.length === 0) {
            throw new Error(`Plato con ID ${dishId} no encontrado`);
          }
          const d = dishRows[0];

          // Manejar imagen (image_url o primera de images JSON)
          let finalImg = d.image_url;
          if (!finalImg && d.images) {
            try {
              const imagesArr = typeof d.images === 'string' ? JSON.parse(d.images) : d.images;
              if (Array.isArray(imagesArr) && imagesArr.length > 0) {
                finalImg = imagesArr[0];
              }
            } catch (e) {
              console.error('Error parseando images del plato:', e);
            }
          }

          itemData = {
            name: customName || d.name,
            description: customDescription || d.description,
            allergens: typeof d.allergens === 'string' ? d.allergens : JSON.stringify(d.allergens || []),
            badges: typeof d.badges === 'string' ? d.badges : JSON.stringify(d.badges || []),
            image_url: finalImg || null, 
            quantity: quantity,
            dish_id: dishId,
            price_unit: customPrice || (d.base_price || 0),
            category: d.category || null
          };
        }

        // Asegurar que allergens y badges sean strings válidos (JSON) para evitar errores de sintaxis
        const finalAllergens = (typeof itemData.allergens === 'string' && itemData.allergens.trim()) 
          ? itemData.allergens 
          : JSON.stringify(itemData.allergens || []);
          
        const finalBadges = (typeof itemData.badges === 'string' && itemData.badges.trim()) 
          ? itemData.badges 
          : JSON.stringify(itemData.badges || []);

        const finalImageUrl = itemData.image_url || null;
        const finalDishId = itemData.dish_id || null;
        const finalPrice = parseFloat(itemData.price_unit) || 0;
        const finalQuantity = parseInt(itemData.quantity) || 1;
        const finalCategory = itemData.category || null;

        // Obtener último indice de orden
        const lastOrder = await conn.query('SELECT MAX(order_index) as max_ord FROM proposal_items WHERE option_id = ?', [optionId]);
        const nextOrder = (Number(lastOrder[0].max_ord) || 0) + 1;

        // Insertar item con parámetros saneados
        const queryParams = [
          parseInt(optionId),
          String(itemData.name || 'Sin nombre'),
          String(itemData.description || ''),
          finalAllergens,
          finalBadges,
          finalImageUrl,
          finalQuantity,
          finalDishId,
          finalPrice,
          nextOrder,
          finalCategory
        ];

        console.log('[ProposalService] Inserting item with params:', queryParams.map(p => typeof p === 'string' && p.length > 50 ? p.substring(0, 50) + '...' : p));

        const result = await conn.query(
          'INSERT INTO proposal_items (option_id, name, description, allergens, badges, image_url, quantity, dish_id, price_unit, order_index, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          queryParams
        );

        createdItems.push({
          id: result.insertId,
          option_id: optionId,
          ...itemData
        });
      }

      return createdItems;
    } finally {
      conn.release();
    }
  }

  /**
   * Obtener items de una opción
   * @param {number} optionId
   * @returns {Promise<array>}
   */
  async getItemsForOption(optionId) {
    const conn = await pool.getConnection();
    try {
      const items = await conn.query(
        'SELECT * FROM proposal_items WHERE option_id = ? ORDER BY id',
        [optionId]
      );

      return items.map(item => ({
        ...item,
        allergens: this.safeParse(item.allergens),
        badges: this.safeParse(item.badges)
      }));
    } finally {
      conn.release();
    }
  }

  /**
   * Eliminar item de propuesta
   * @param {number} itemId
   * @returns {Promise<boolean>}
   */
  async removeItem(itemId) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query('DELETE FROM proposal_items WHERE id = ?', [itemId]);
      return result.affectedRows > 0;
    } finally {
      conn.release();
    }
  }

  /**
   * Actualiza la fecha de última vista por el cliente
   * @param {number} proposalId 
   */
  async updateLastViewed(proposalId) {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        'UPDATE proposals SET last_viewed_at = NOW() WHERE id = ?',
        [proposalId]
      );
    } finally {
      conn.release();
    }
  }

  /**
   * Actualizar item (modificar nombre, descripción, precio, vat, etc)
   * @param {number} itemId
   * @param {object} updates - {name?, description?, price_unit?, vat_rate?, allergens?, badges?}
   * @returns {Promise<object>}
   */
  async updateItem(itemId, updates) {
    const conn = await pool.getConnection();
    try {
      const existing = await conn.query('SELECT * FROM proposal_items WHERE id = ?', [itemId]);
      if (existing.length === 0) {
        throw new Error('Item no encontrado');
      }

      const item = existing[0];
      const fields = [];
      const values = [];

      // Campos permitidos (Normalizados para DB)
      const allowedMapping = {
        'name': 'name',
        'dish_name': 'name',
        'description': 'description',
        'price_unit': 'price_unit',
        'vat_rate': 'vat_rate',
        'item_vat_rate': 'vat_rate',
        'order_index': 'order_index',
        'allergens': 'allergens',
        'badges': 'badges'
      };

      for (const [key, value] of Object.entries(updates)) {
        const dbKey = allowedMapping[key];
        if (dbKey) {
          fields.push(`${dbKey} = ?`);

          // JSON parse/stringify para allergens y badges
          if (dbKey === 'allergens' || dbKey === 'badges') {
            values.push(JSON.stringify(value));
          } else {
            values.push(value);
          }
        }
      }

      if (fields.length === 0) {
        return item; // Nada que actualizar
      }

      values.push(itemId);

      await conn.query(`UPDATE proposal_items SET ${fields.join(', ')} WHERE id = ?`, values);

      // Retornar item actualizado
      return this.getItemById(itemId);
    } finally {
      conn.release();
    }
  }

  /**
   * Marca un venue como seleccionado para una propuesta
   * y deselecciona los demás
   */
  async selectVenue(proposalId, venueId) {
    const conn = await pool.getConnection();
    try {
      await conn.query('START TRANSACTION');

      // Deseleccionar todos
      await conn.query(
        'UPDATE proposal_venues SET is_selected = 0 WHERE proposal_id = ?',
        [proposalId]
      );

      // Seleccionar el indicado
      await conn.query(
        'UPDATE proposal_venues SET is_selected = 1 WHERE proposal_id = ? AND venue_id = ?',
        [proposalId, venueId]
      );

      await conn.query('COMMIT');
      return true;
    } catch (err) {
      await conn.query('ROLLBACK');
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Selecciona una opción específica para un servicio multichoice
   */
  async selectServiceOption(proposalId, serviceId, optionId) {
    const conn = await pool.getConnection();
    try {
      // Validar que los IDs sean números antes de la query
      const sId = parseInt(serviceId, 10);
      const pId = parseInt(proposalId, 10);
      const oId = parseInt(optionId, 10);

      if (isNaN(sId) || isNaN(pId)) {
        throw new Error(`IDs inválidos en selectServiceOption: serviceId=${serviceId}, proposalId=${proposalId}`);
      }

      await conn.query('START TRANSACTION');
      
      // Validar pertenencia
      const result = await conn.query(
        'SELECT id, selected_option_index FROM proposal_services WHERE id = ? AND proposal_id = ?',
        [sId, pId]
      );
      
      if (!result || result.length === 0) {
        throw new Error(`Servicio ${sId} no pertenece a la propuesta ${pId}`);
      }

      const service = result[0];

      const options = await conn.query(
        'SELECT id FROM service_options WHERE service_id = ? ORDER BY id ASC',
        [sId]
      );
      
      const index = options.findIndex(o => o.id === oId);
      if (index === -1) {
        // Fallback: buscar por el ID literal si findIndex falla por tipos
        const indexAlt = options.findIndex(o => parseInt(o.id) === oId);
        if (indexAlt === -1) throw new Error(`Opción ${oId} no válida para servicio ${sId}`);
      }

      const finalIndex = options.findIndex(o => parseInt(o.id) === oId);

      // Si la opción ya estaba seleccionada, la desmarcamos (toggle)
      const newIndex = (service.selected_option_index === finalIndex) ? null : finalIndex;

      await conn.query(
        'UPDATE proposal_services SET selected_option_index = ? WHERE id = ?',
        [newIndex, sId]
      );
      
      await conn.query('COMMIT');
      return true;
    } catch (err) {
      if (conn) await conn.query('ROLLBACK');
      throw err;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Obtener item por ID
   * @param {number} itemId
   * @returns {Promise<object|null>}
   */
  async getItemById(itemId) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query('SELECT * FROM proposal_items WHERE id = ?', [itemId]);
      if (result.length === 0) return null;

      const item = result[0];
      return {
        ...item,
        allergens: this.safeParse(item.allergens),
        badges: this.safeParse(item.badges)
      };
    } finally {
      conn.release();
    }
  }

  /**
   * Añadir línea de descuento
   */
  async addDiscountLine(proposalId, data) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(
        'INSERT INTO proposal_discounts (proposal_id, name, type, value) VALUES (?, ?, ?, ?)',
        [proposalId, data.name, data.type, data.value]
      );
      return result.insertId || (result[0] && result[0].insertId);
    } finally {
      conn.release();
    }
  }

  /**
   * Eliminar línea de descuento
   */
  async deleteDiscountLine(discountId, proposalId) {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        'DELETE FROM proposal_discounts WHERE id = ? AND proposal_id = ?',
        [discountId, proposalId]
      );
      return true;
    } finally {
      conn.release();
    }
  }
}

const proposalService = new ProposalService();
proposalService.safeParse = safeParse; // Adjuntar para que desestructuraciones funcionen
module.exports = proposalService;
