/**
 * EditorController
 * Propósito: Manejar requests HTTP para la edición de propuestas
 * Pattern: Service Pattern (request → validate → authorize → service → response)
 */

const { validationResult } = require('express-validator');
const ProposalService = require('../services/ProposalService');

class EditorController {
  /**
   * GET /proposal/:id/edit
   * Mostrar formulario de edición de propuesta
   */
  async renderEditor(req, res, next) {
    try {
      const { id } = req.params;

      // Validar ID
      if (!id || isNaN(id)) {
        return res.status(400).render('errors/400', {
          message: 'ID de propuesta inválido',
          user: req.user
        });
      }

      // Obtener propuesta completa
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal) {
        return res.status(404).render('errors/404', {
          message: 'Propuesta no encontrada',
          user: req.user
        });
      }

      // Verificar permisos (user_id)
      if (proposal.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).render('errors/403', {
          message: 'No tienes permiso para editar esta propuesta',
          user: req.user
        });
      }

      // Obtener venues disponibles desde la BD
      let allVenues = [];
      try {
        const VenueService = require('../services/VenueService');
        const venueService = new VenueService();
        allVenues = await venueService.getAll({ limit: 500 }) || [];
      } catch (err) {
        console.error('Error cargando venues:', err.message);
        // Continuar sin venues si hay error
      }

      // Verificar que no esté en modo mantenimiento para cliente
      if (proposal.is_editing === false) {
        // Si is_editing = false, el cliente está viéndola
        req.flash('warning', 'Esta propuesta está siendo visualizada por el cliente. Los cambios no serán visibles.');
      }

      // Renderizar editor con datos de propuesta
      res.render('commercial/editor', {
        proposal,
        availableVenues: allVenues,
        title: `Editar: ${proposal.client_name}`,
        breadcrumb: [
          { label: 'Dashboard', url: '/dashboard' },
          { label: proposal.client_name }
        ],
        user: req.user
      });
    } catch (err) {
      console.error('Error en renderEditor:', err);
      next(err);
    }
  }

  /**
   * POST /proposal/:id/update
   * Guardar cambios de propuesta
   */
  async updateProposal(req, res, next) {
    try {
      const { id } = req.params;
      const { client_name, client_email, event_date, pax, legal_conditions, valid_until } = req.body;

      // Validar cambios
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      // Obtener propuesta actual
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal) {
        return res.status(404).json({
          success: false,
          message: 'Propuesta no encontrada'
        });
      }

      // Verificar permisos
      if (proposal.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso'
        });
      }

      // Actualizar
      const changes = {
        client_name: client_name || proposal.client_name,
        client_email: client_email || proposal.client_email,
        event_date: event_date || proposal.event_date,
        pax: pax || proposal.pax,
        legal_conditions: legal_conditions || proposal.legal_conditions,
        valid_until: valid_until || proposal.valid_until,
        updated_at: new Date()
      };

      await ProposalService.updateProposal(id, changes);

      req.flash('success', 'Propuesta actualizada correctamente');
      res.json({
        success: true,
        message: 'Guardado exitoso'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/proposals/:id/services
   * Agregar servicio a propuesta
   */
  async addService(req, res, next) {
    try {
      const { id } = req.params;
      const { title, type, vat_rate } = req.body;

      // Validar
      if (!title || !type) {
        return res.status(400).json({
          success: false,
          message: 'Título y tipo requeridos'
        });
      }

      // Verificar propuesta y permisos
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || proposal.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No permitido'
        });
      }

      // Obtener siguiente orden
      const conn = await require('../config/db').getConnection();
      const [existingServices] = await conn.query(
        'SELECT MAX(order_index) as max_order FROM proposal_services WHERE proposal_id = ?',
        [id]
      );
      const nextOrder = (existingServices[0]?.max_order || -1) + 1;

      // Crear servicio
      const [result] = await conn.query(
        `INSERT INTO proposal_services 
         (proposal_id, title, type, vat_rate, order_index) 
         VALUES (?, ?, ?, ?, ?)`,
        [id, title, type, vat_rate || 10, nextOrder]
      );

      conn.end();

      // Retornar ID del nuevo servicio
      res.json({
        success: true,
        service_id: result.insertId,
        message: 'Servicio agregado'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/proposals/:id/services/:serviceId
   * Eliminar servicio
   */
  async removeService(req, res, next) {
    try {
      const { id, serviceId } = req.params;

      // Verificar propuesta y permisos
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || proposal.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No permitido'
        });
      }

      const conn = await require('../config/db').getConnection();

      // Eliminar servicio (cascade elimina opciones e items)
      const result = await conn.query(
        'DELETE FROM proposal_services WHERE id = ? AND proposal_id = ?',
        [serviceId, id]
      );

      conn.end();

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Servicio no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Servicio eliminado'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/proposals/:id/calculate
   * Recalcular totales de propuesta (Motor Financiero Completo)
   */
  async calculateTotals(req, res, next) {
    try {
      const { id } = req.params;

      // Verificar propuesta y permisos
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || proposal.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No permitido'
        });
      }

      // Calcular totales con el motor financiero completo
      const totals = await ProposalService.calculateTotals(id, { 
        persist: true, 
        auditUserId: req.user.id 
      });

      res.json({
        success: true,
        totals,
        formatted: {
          total_base: new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
          }).format(totals.total_base),
          total_discount: new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
          }).format(totals.total_discount),
          total_vat: new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
          }).format(totals.total_vat),
          total_final: new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
          }).format(totals.total_final),
          total_margin: new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
          }).format(totals.total_margin),
          margin_percentage: `${totals.margin_percentage.toFixed(2)}%`
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/proposals/:id/venues
   * Agregar venue a propuesta
   */
  async addVenue(req, res, next) {
    try {
      const { id } = req.params;
      const { venue_id } = req.body;

      if (!venue_id) {
        return res.status(400).json({
          success: false,
          message: 'venue_id requerido'
        });
      }

      // Verificar permisos
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || proposal.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No permitido'
        });
      }

      const conn = await require('../config/db').getConnection();

      // Agregar venue
      const [result] = await conn.query(
        'INSERT INTO proposal_venues (proposal_id, venue_id) VALUES (?, ?)',
        [id, venue_id]
      );

      conn.end();

      res.json({
        success: true,
        venue_id: result.insertId,
        message: 'Venue agregado'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/proposals/:id/venues/:venueId
   * Eliminar venue
   */
  async removeVenue(req, res, next) {
    try {
      const { id, venueId } = req.params;

      // Verificar permisos
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || proposal.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No permitido'
        });
      }

      const conn = await require('../config/db').getConnection();
      const result = await conn.query(
        'DELETE FROM proposal_venues WHERE id = ? AND proposal_id = ?',
        [venueId, id]
      );
      conn.end();

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Venue no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Venue eliminado'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /proposal/:id/publish
   * Cambiar estado a "enviada"
   */
  async publishProposal(req, res, next) {
    try {
      const { id } = req.params;

      // Verificar propuesta y permisos
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || proposal.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No permitido'
        });
      }

      // Validar que tenga datos mínimos
      if (!proposal.client_name || !proposal.pax) {
        req.flash('error', 'Completa cliente y pax antes de enviar');
        return res.redirect(`/proposal/${id}/edit`);
      }

      // Cambiar a enviada + desactivar modo edición
      await ProposalService.updateProposal(id, {
        status: 'sent',
        is_editing: false
      });

      req.flash('success', 'Propuesta enviada al cliente');
      res.redirect('/dashboard');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /proposal/:id/cancel
   * Cambiar estado a "anulada"
   */
  async cancelProposal(req, res, next) {
    try {
      const { id } = req.params;

      const proposal = await ProposalService.getProposalById(id);
      if (!proposal) {
        req.flash('error', 'Propuesta no encontrada');
        return res.redirect('/dashboard');
      }

      if (proposal.user_id !== req.user.id && req.user.role !== 'admin') {
        req.flash('error', 'No tienes permiso');
        return res.redirect('/dashboard');
      }

      if (proposal.status === 'cancelled') {
        req.flash('info', 'La propuesta ya estaba anulada');
        return res.redirect(`/proposal/${id}/edit`);
      }

      await ProposalService.updateProposal(id, {
        status: 'cancelled'
      });

      req.flash('success', 'Propuesta anulada');
      res.redirect('/dashboard');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new EditorController();
