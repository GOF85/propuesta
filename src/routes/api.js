/**
 * API Routes
 * Propósito: Endpoints JSON para interactividad sin recargar página
 * Pattern: RESTful API + JSON responses
 */

const express = require('express');
const { body, param } = require('express-validator');
const editorController = require('../controllers/editorController');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/proposals/:id/services
 * Agregar servicio a propuesta
 */
router.post(
  '/api/proposals/:id/services',
  authenticateUser,
  param('id').isInt().toInt(),
  body('title').trim().isLength({ min: 2, max: 255 }),
  body('type').isIn(['gastronomy', 'logistics', 'staff', 'other']),
  body('vat_rate').optional().isDecimal(),
  editorController.addService
);

/**
 * DELETE /api/proposals/:id/services/:serviceId
 * Eliminar servicio
 */
router.delete(
  '/api/proposals/:id/services/:serviceId',
  authenticateUser,
  param('id').isInt().toInt(),
  param('serviceId').isInt().toInt(),
  editorController.removeService
);

/**
 * POST /api/proposals/:id/venues
 * Agregar venue a propuesta
 */
router.post(
  '/api/proposals/:id/venues',
  authenticateUser,
  param('id').isInt().toInt(),
  body('venue_id').isInt().toInt(),
  editorController.addVenue
);

/**
 * DELETE /api/proposals/:id/venues/:venueId
 * Eliminar venue
 */
router.delete(
  '/api/proposals/:id/venues/:venueId',
  authenticateUser,
  param('id').isInt().toInt(),
  param('venueId').isInt().toInt(),
  editorController.removeVenue
);

/**
 * POST /api/proposals/:id/calculate
 * Recalcular totales (motor financiero)
 */
router.post(
  '/api/proposals/:id/calculate',
  authenticateUser,
  param('id').isInt().toInt(),
  editorController.calculateTotals
);

/**
 * GET /api/proposals/:id/data
 * Obtener datos actualizados de propuesta (para refresh)
 */
router.get(
  '/api/proposals/:id/data',
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

      // Retornar datos completos
      res.json({
        success: true,
        proposal
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/proposals/:id/options
 * Agregar opción a servicio
 */
router.post(
  '/api/proposals/:id/options',
  authenticateUser,
  param('id').isInt().toInt(),
  body('service_id').isInt().toInt(),
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('price_pax').isDecimal(),
  body('discount_pax').optional().isDecimal(),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { service_id, name, price_pax, discount_pax } = req.body;

      // Verificar permisos
      const ProposalService = require('../services/ProposalService');
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || proposal.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No permitido'
        });
      }

      const conn = await require('../config/db').getConnection();

      // Crear opción
      const [result] = await conn.query(
        `INSERT INTO service_options 
         (service_id, name, price_pax, discount_pax) 
         VALUES (?, ?, ?, ?)`,
        [service_id, name, price_pax, discount_pax || 0]
      );

      conn.end();

      res.json({
        success: true,
        option_id: result.insertId,
        message: 'Opción agregada'
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/proposals/:id/options/:optionId
 * Eliminar opción
 */
router.delete(
  '/api/proposals/:id/options/:optionId',
  authenticateUser,
  param('id').isInt().toInt(),
  param('optionId').isInt().toInt(),
  async (req, res, next) => {
    try {
      const { id, optionId } = req.params;

      // Verificar permisos
      const ProposalService = require('../services/ProposalService');
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || proposal.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No permitido'
        });
      }

      const conn = await require('../config/db').getConnection();
      const result = await conn.query(
        'DELETE FROM service_options WHERE id = ?',
        [optionId]
      );
      conn.end();

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Opción no encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Opción eliminada'
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * ════════════════════════════════════════════════════════════════
 * RUTAS DE UPLOAD - ImageService
 * ════════════════════════════════════════════════════════════════
 */

/**
 * POST /api/admin/upload/image
 * Subir imagen única con Sharp: Resize → WebP → Save
 * Body: FormData con 'file' (binary)
 */
router.post(
  '/api/admin/upload/image',
  authenticateUser,
  async (req, res, next) => {
    try {
      // Verificar si es admin
      if (req.session.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Solo admin puede subir imágenes'
        });
      }

      const adminController = require('../controllers/adminController');
      await adminController.uploadImage(req, res);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/admin/upload/logo
 * Subir logo del cliente (con extracción de color dominante)
 */
router.post(
  '/api/admin/upload/logo',
  authenticateUser,
  async (req, res, next) => {
    try {
      if (req.session.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Solo admin puede subir logos'
        });
      }

      const adminController = require('../controllers/adminController');
      await adminController.uploadClientLogo(req, res);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/admin/upload/batch
 * Subir múltiples imágenes
 */
router.post(
  '/api/admin/upload/batch',
  authenticateUser,
  async (req, res, next) => {
    try {
      if (req.session.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Solo admin puede subir imágenes'
        });
      }

      const adminController = require('../controllers/adminController');
      await adminController.uploadBatch(req, res);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/admin/image/:hash
 * Eliminar imagen por hash
 */
router.delete(
  '/api/admin/image/:hash',
  authenticateUser,
  param('hash').isLength({ min: 12, max: 12 }),
  async (req, res, next) => {
    try {
      if (req.session.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'No permitido'
        });
      }

      const errors = require('express-validator').validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const adminController = require('../controllers/adminController');
      await adminController.deleteImage(req, res);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
