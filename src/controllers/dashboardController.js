/**
 * DashboardController.js
 * Manejador HTTP para el dashboard comercial
 * - Listar propuestas
 * - Filtrar por estado, búsqueda
 * - Render con datos
 */

const { validationResult, query } = require('express-validator');
const ProposalService = require('../services/ProposalService');
const { PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_COLORS } = require('../config/constants');

class DashboardController {
  /**
   * GET /dashboard - Listar propuestas del usuario
   * Query params: status, search, page
   */
  async getProposals(req, res, next) {
    try {
      // Validar inputs
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        req.flash('error', 'Parámetros inválidos');
        return res.redirect('/dashboard');
      }

      // Extraer parámetros
      const { status, search, page = 1 } = req.query;
      const userId = req.session.user.id;

      // Fetch propuestas
      const proposals = await ProposalService.listProposals(userId, {
        status: status || 'all',
        search: search || '',
        page: parseInt(page),
        limit: 10
      });

      // Enriquecer propuestas con labels
      const enrichedProposals = proposals.map(p => ({
        ...p,
        statusLabel: PROPOSAL_STATUS_LABELS[p.status] || p.status,
        statusColor: PROPOSAL_STATUS_COLORS[p.status] || 'gray',
        formattedTotal: `${(p.total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
        formattedDate: p.event_date ? new Date(p.event_date).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) : 'Sin fecha'
      }));

      // Render
      res.render('commercial/dashboard', {
        proposals: enrichedProposals,
        currentFilter: status || 'all',
        searchTerm: search || '',
        pageNumber: parseInt(page)
      });
    } catch (err) {
      console.error('Error en getProposals:', err);
      next(err); // Pasa al global error handler
    }
  }

  /**
   * GET /proposal/new - Formulario de nueva propuesta
   */
  async newProposal(req, res, next) {
    try {
      res.render('commercial/new-proposal', {
        title: 'Nueva Propuesta'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /proposal - Crear nueva propuesta
   */
  async createProposal(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.session.user.id;
      const { client_name, event_name, event_date, pax } = req.body;

      const newProposal = await ProposalService.createProposal(userId, {
        client_name,
        event_name,
        event_date,
        pax: parseInt(pax)
      });

      req.flash('success', 'Propuesta creada correctamente');
      res.redirect(`/proposal/${newProposal.id}/edit`);
    } catch (err) {
      console.error('Error en createProposal:', err);
      req.flash('error', 'Error al crear propuesta');
      res.redirect('/dashboard');
    }
  }

  /**
   * POST /proposal/:id/duplicate - Duplicar propuesta
   */
  async duplicateProposal(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.session.user.id;

      // Verificar que la propuesta pertenece al usuario
      const original = await ProposalService.getProposalById(id);
      if (original.user_id !== userId) {
        req.flash('error', 'No tienes permisos para duplicar esta propuesta');
        return res.redirect('/dashboard');
      }

      const newId = await ProposalService.duplicateProposal(id);

      req.flash('success', 'Propuesta duplicada correctamente');
      res.redirect(`/proposal/${newId}/edit`);
    } catch (err) {
      console.error('Error en duplicateProposal:', err);
      req.flash('error', 'Error al duplicar propuesta');
      res.redirect('/dashboard');
    }
  }

  /**
   * POST /proposal/:id/delete - Eliminar propuesta
   */
  async deleteProposal(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.session.user.id;

      // Verificar permisos
      const proposal = await ProposalService.getProposalById(id);
      if (proposal.user_id !== userId) {
        req.flash('error', 'No tienes permisos para eliminar esta propuesta');
        return res.redirect('/dashboard');
      }

      await ProposalService.deleteProposal(id);

      req.flash('success', 'Propuesta eliminada');
      res.redirect('/dashboard');
    } catch (err) {
      console.error('Error en deleteProposal:', err);
      req.flash('error', 'Error al eliminar propuesta');
      res.redirect('/dashboard');
    }
  }

  /**
   * POST /proposal/:id/status - Cambiar estado
   */
  async updateStatus(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { status } = req.body;
      const userId = req.session.user.id;

      // Verificar permisos
      const proposal = await ProposalService.getProposalById(id);
      if (proposal.user_id !== userId) {
        return res.status(403).json({ error: 'No permitido' });
      }

      await ProposalService.updateProposal(id, { status });

      res.json({ success: true, status });
    } catch (err) {
      console.error('Error en updateStatus:', err);
      next(err);
    }
  }
}

module.exports = new DashboardController();
