/**
 * Editor Routes
 * Propósito: Definir endpoints para la edición de propuestas
 * Pattern: Expresss routes con validación y middleware
 */

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const editorController = require('../controllers/editorController');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /proposal/:id/edit
 * Mostrar formulario de edición
 */
router.get(
  '/proposal/:id/edit',
  authenticateUser,
  param('id').isInt().toInt(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('errors/400', {
        message: 'ID inválido'
      });
    }
    next();
  },
  (req, res, next) => editorController.renderEditor(req, res, next)
);

/**
 * POST /proposal/:id/update
 * Guardar cambios básicos de propuesta
 */
router.post(
  '/proposal/:id/update',
  authenticateUser,
  (req, res, next) => {
    // Saltamos validaciones para debuggear si el 400 viene de aquí
    editorController.updateProposal(req, res, next);
  }
);

/**
 * POST /proposal/:id/publish
 * Enviar propuesta a cliente (cambiar estado a "sent")
 */
router.post(
  '/proposal/:id/publish',
  authenticateUser,
  param('id').isInt().toInt(),
  (req, res, next) => editorController.publishProposal(req, res, next)
);

/**
 * POST /proposal/:id/archive
 * Archivar propuesta
 */
router.post(
  '/proposal/:id/archive',
  authenticateUser,
  param('id').isInt().toInt(),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const ProposalService = require('../services/ProposalService');

      // Verificar permisos
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || proposal.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No permitido'
        });
      }

      // Archivar (cambiar estado)
      await ProposalService.updateProposal(id, {
        status: 'archived'
      });

      req.flash('success', 'Propuesta archivada');
      res.redirect('/dashboard');
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /proposal/:id/cancel
 * Anular propuesta
 */
router.post(
  '/proposal/:id/cancel',
  authenticateUser,
  param('id').isInt().toInt(),
  (req, res, next) => editorController.cancelProposal(req, res, next)
);

module.exports = router;
