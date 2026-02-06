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
  editorController.renderEditor
);

/**
 * POST /proposal/:id/update
 * Guardar cambios básicos de propuesta
 */
router.post(
  '/proposal/:id/update',
  authenticateUser,
  param('id').isInt().toInt(),
  body('client_name').optional().trim().isLength({ min: 2, max: 255 }),
  body('client_email').optional().isEmail(),
  body('event_date').optional().isISO8601(),
  body('pax').optional().isInt({ min: 0 }),
  body('valid_until').optional().isISO8601(),
  body('legal_conditions').optional().trim(),
  editorController.updateProposal
);

/**
 * POST /proposal/:id/publish
 * Enviar propuesta a cliente (cambiar estado a "sent")
 */
router.post(
  '/proposal/:id/publish',
  authenticateUser,
  param('id').isInt().toInt(),
  editorController.publishProposal
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

module.exports = router;
