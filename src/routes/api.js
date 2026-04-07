/**
 * API Routes
 * Propósito: Endpoints JSON para interactividad sin recargar página
 * Pattern: RESTful API + JSON responses
 */

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const editorController = require('../controllers/editorController');
const dashboardController = require('../controllers/dashboardController');
const AdminController = require('../controllers/adminController');
const { pool } = require('../config/db');
const { authenticateUser, authorizeRole } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/categories
 * Listar categorías disponibles
 */
router.get(
  '/api/categories',
  authenticateUser,
  async (req, res) => {
    try {
      const { type = 'dish' } = req.query;
      const rows = await pool.query('SELECT * FROM app_categories WHERE type = ? ORDER BY name ASC', [type]);
      res.json({ success: true, categories: rows });
    } catch (err) {
      console.error('❌ Error en GET /api/categories:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

/**
 * GET /api/admin/images
 * Obtener catálogo de imágenes
 */
router.get(
  '/api/admin/images',
  authenticateUser,
  authorizeRole('admin'),
  (req, res, next) => AdminController.getImagesApi(req, res, next)
);

/**
 * Middleware para capturar errores de validación de express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn('[API Validation Error]', errors.array());
    return res.status(400).json({
      success: false,
      validationErrors: errors.array(),
      message: 'Datos de entrada no válidos'
    });
  }
  next();
};

/**
 * GET /api/proposals/:id
 * Obtener datos completos de la propuesta (JSON)
 */
router.get(
  '/api/proposals/:id',
  authenticateUser,
  param('id').isInt().toInt(),
  (req, res, next) => editorController.getProposalData(req, res, next)
);

/**
 * GET /api/proposals/:id/validate
 * Validación de completitud de la propuesta
 */
router.get(
  '/api/proposals/:id/validate',
  authenticateUser,
  param('id').isInt().toInt(),
  (req, res, next) => editorController.validateProposal(req, res, next)
);

/**
 * PATCH /api/proposals/:id
 * Actualización parcial de una propuesta
 */
router.patch(
  '/api/proposals/:id',
  authenticateUser,
  param('id').isInt().toInt(),
  body('discount_percentage').optional().isDecimal(),
  body('discount_fixed').optional().isDecimal(),
  body('discount_reason').optional().trim(),
  body('client_name').optional().trim(),
  body('event_date').optional().isISO8601(),
  validate,
  (req, res, next) => editorController.updateProposal(req, res, next)
);

/**
 * GESTIÓN DE DESCUENTOS ADICIONALES
 */
router.post(
  '/api/proposals/:id/discounts',
  authenticateUser,
  param('id').isInt().toInt(),
  body('name').trim().notEmpty(),
  body('type').isIn(['percentage', 'fixed']),
  body('value').isDecimal(),
  validate,
  (req, res, next) => editorController.addDiscountLine(req, res, next)
);

router.delete(
  '/api/proposals/:id/discounts/:discountId',
  authenticateUser,
  param('id').isInt().toInt(),
  param('discountId').isInt().toInt(),
  (req, res, next) => editorController.deleteDiscountLine(req, res, next)
);

/**
 * POST /api/proposals/:id/services
 * Agregar servicio a propuesta
 */
router.post(
  '/api/proposals/:id/services',
  authenticateUser,
  param('id').isInt().toInt(),
  body('title').trim().isLength({ min: 2, max: 255 }),
  body('type').isIn(['gastronomy', 'logistics', 'staff', 'extras', 'other']),
  body('vat_rate').optional({ checkFalsy: true }).isDecimal(),
  body('pax').optional({ checkFalsy: true }).isInt({ min: 1 }),
  body('service_date').optional({ checkFalsy: true }).isISO8601(),
  body('start_time').optional({ checkFalsy: true }),
  body('end_time').optional({ checkFalsy: true }),
  body('duration').optional({ checkFalsy: true }).isInt(),
  body('comments').optional({ checkFalsy: true }).trim(),
  body('location').optional({ checkFalsy: true }).trim(),
  body('is_multichoice').optional().toBoolean(),
  validate,
  (req, res, next) => editorController.addService(req, res, next)
);

/**
 * PUT /api/proposals/:id/services/:serviceId
 * Actualizar servicio
 */
router.put(
  '/api/proposals/:id/services/:serviceId',
  authenticateUser,
  param('id').isInt().toInt(),
  param('serviceId').isInt().toInt(),
  body('title').trim().isLength({ min: 2, max: 255 }),
  body('type').isIn(['gastronomy', 'logistics', 'staff', 'extras', 'other']),
  body('pax').optional({ checkFalsy: true }).isInt({ min: 1 }),
  body('vat_rate').optional({ checkFalsy: true }).isDecimal(),
  body('service_date').optional({ checkFalsy: true }).isISO8601(),
  body('start_time').optional({ checkFalsy: true }),
  body('end_time').optional({ checkFalsy: true }),
  body('duration').optional({ checkFalsy: true }).isInt(),
  body('comments').optional({ checkFalsy: true }).trim(),
  body('location').optional({ checkFalsy: true }).trim(),
  body('is_multichoice').optional().toBoolean(),
  validate,
  (req, res, next) => editorController.updateService(req, res, next)
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
  validate,
  (req, res, next) => editorController.removeService(req, res, next)
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
  (req, res, next) => editorController.addVenue(req, res, next)
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
  (req, res, next) => editorController.removeVenue(req, res, next)
);

/**
 * POST /api/proposals/:id/calculate
 * Recalcular totales (motor financiero)
 */
router.post(
  '/api/proposals/:id/calculate',
  authenticateUser,
  param('id').isInt().toInt(),
  (req, res, next) => editorController.calculateTotals(req, res, next)
);

/**
 * POST /api/proposals/:id/toggle-editing
 * Cambiar estado de edición (Modo Mantenimiento) desde API
 */
router.post(
  '/api/proposals/:id/toggle-editing',
  authenticateUser,
  param('id').isInt().toInt(),
  body('is_editing').isBoolean(),
  (req, res, next) => editorController.toggleEditing(req, res, next)
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
  (req, res, next) => editorController.addOption(req, res, next)
);

/**
 * PUT /api/proposals/:id/options/:optionId
 * Actualizar opción (Choice)
 */
router.put(
  '/api/proposals/:id/options/:optionId',
  authenticateUser,
  param('id').isInt().toInt(),
  param('optionId').isInt().toInt(),
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('price_pax').isDecimal(),
  validate,
  (req, res, next) => editorController.updateOption(req, res, next)
);

/**
 * GET /api/services/:serviceId
 * Obtener un servicio detallado (para AJAX)
 */
router.get(
  '/api/services/:serviceId',
  authenticateUser,
  param('serviceId').isInt().toInt(),
  (req, res, next) => editorController.getService(req, res, next)
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

      const conn = await pool.getConnection();
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
 * GET /api/options/:id
 * Obtener detalles de una opción para multimedia
 */
router.get(
  '/api/options/:id',
  authenticateUser,
  param('id').isInt().toInt(),
  validate,
  async (req, res, next) => {
    try {
      const conn = await pool.getConnection();
      try {
        const [option] = await conn.query('SELECT * FROM service_options WHERE id = ?', [req.params.id]);
        
        if (!option) {
          return res.status(404).json({ success: false, message: 'No encontrado' });
        }

        const ProposalService = require('../services/ProposalService');
        option.images = ProposalService.safeParse(option.images);
        option.badges = ProposalService.safeParse(option.badges);

        res.json(option);
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error('[API] Error in GET /api/options/:id:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

/**
 * PATCH /api/options/:id/media
 * Actualizar multimedia de una opción
 */
router.patch(
  '/api/options/:id/media',
  authenticateUser,
  param('id').isInt().toInt(),
  body('description').optional({ checkFalsy: true }).trim(),
  body('badges').optional().isArray(),
  body('images').optional().isArray(),
  body('video_url').optional({ checkFalsy: true }).trim(),
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { description, badges, images, video_url } = req.body;
      const conn = await pool.getConnection();

      await conn.query(
        'UPDATE service_options SET description = ?, badges = ?, images = ?, video_url = ? WHERE id = ?',
        [description, JSON.stringify(badges || []), JSON.stringify(images || []), (video_url || '').trim() || null, id]
      );

      conn.release();
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/proposals/:id/options/:optionId/duplicate
 * Duplicar una opción (menú)
 */
router.post(
  '/api/proposals/:id/options/:optionId/duplicate',
  authenticateUser,
  param('id').isInt().toInt(),
  param('optionId').isInt().toInt(),
  (req, res, next) => editorController.duplicateOption(req, res, next)
);

/**
 * POST /api/proposals/:id/services/:serviceId/duplicate
 * Duplicar hito
 */
router.post(
  '/api/proposals/:id/services/:serviceId/duplicate',
  authenticateUser,
  param('id').isInt().toInt(),
  param('serviceId').isInt().toInt(),
  (req, res, next) => editorController.duplicateService(req, res, next)
);

/**
 * POST /api/proposals/:id/options/:optionId/import-menu
 * Importar menú completo a una opción
 */
router.post(
  '/api/proposals/:id/options/:optionId/import-menu',
  authenticateUser,
  param('id').isInt().toInt(),
  param('optionId').isInt().toInt(),
  body('menuId').isInt().toInt(),
  validate,
  (req, res, next) => editorController.importMenu(req, res, next)
);

/**
 * PUT /api/proposals/:id/items/reorder
 * Reordenar ítems mediante D&D
 */
router.put(
  '/api/proposals/:id/items/reorder',
  authenticateUser,
  param('id').isInt().toInt(),
  body('items').isArray(),
  validate,
  (req, res, next) => editorController.reorderItems(req, res, next)
);

/**
 * PUT /api/proposals/:id/items/:itemId
 * Actualizar ítem (clonado) con IVA, precio unitario, etc.
 */
router.put(
  '/api/proposals/:id/items/:itemId',
  authenticateUser,
  param('id').isInt().toInt(),
  param('itemId').isInt().toInt(),
  (req, res, next) => editorController.updateItem(req, res, next)
);

/**
 * DELETE /api/proposals/:id/items/:itemId
 * Eliminar ítem de la propuesta
 */
router.delete(
  '/api/proposals/:id/items/:itemId',
  authenticateUser,
  param('id').isInt().toInt(),
  param('itemId').isInt().toInt(),
  (req, res, next) => editorController.removeItem(req, res, next)
);

/**
 * ════════════════════════════════════════════════════════════════
 * RUTAS DE UPLOAD - Client Logo (Commercial Users)
 * ════════════════════════════════════════════════════════════════
 */

/**
 * POST /api/proposal/upload-logo
 * Subir logo del cliente durante creación de propuesta
 * Accesible por: users comerciales (sin requerir admin)
 */
router.post(
  '/api/proposal/upload-logo',
  authenticateUser,
  async (req, res, next) => {
    try {
      const dashboardController = require('../controllers/dashboardController');
      await dashboardController.uploadClientLogo(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * ════════════════════════════════════════════════════════════════
 * RUTAS DE UPLOAD - ImageService (Admin Only)
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
      await adminController.uploadImageAPI(req, res);
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
      await adminController.deleteImageAPI(req, res);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * ════════════════════════════════════════════════════════════════
 * RUTAS DE VENUES - VenueService + Puppeteer Scraping
 * ════════════════════════════════════════════════════════════════
 */

/**
 * GET /api/venues
 * Listar todos los venues con filtros opcionales
 * Query params: ?search=xxx
 */
router.get('/api/venues', async (req, res, next) => {
  try {
    const VenueService = require('../services/VenueService');
    const { search, features } = req.query;

    const filters = {};
    if (search) filters.search = search;
    if (features) filters.features = features;

    const venues = await VenueService.getAll(filters);

    res.json({
      success: true,
      count: venues.length,
      venues
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/venues/:id
 * Obtener venue específico
 */
router.get('/api/venues/:id', param('id').isInt().toInt(), async (req, res, next) => {
  try {
    const { id } = req.params;
    const VenueService = require('../services/VenueService');

    const venue = await VenueService.getById(id);

    res.json({
      success: true,
      venue
    });
  } catch (err) {
    if (err.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        error: err.message
      });
    }
    next(err);
  }
});

/**
 * POST /api/admin/venues/scrape
 * ADMIN ONLY: Ejecutar scraping de micecatering.com
 * Timeout: 45s (Puppeteer tarda)
 */
router.post('/api/admin/venues/scrape', authenticateUser, async (req, res, next) => {
  try {
    const user = req.user || (req.session && req.session.user);
    const role = user?.role || user?.ROLE;
    
    if (role !== 'admin' && role !== 'commercial') {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para realizar esta acción'
      });
    }

    console.log(`🚀 Usuario (${role}) solicitando scraping de venues...`);
    const VenueService = require('../services/VenueService');

    // Ejecutar scraping + inserción
    const result = await VenueService.syncVenuesFromWebsite();

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/venues/scrape-url
 * ADMIN ONLY: Scrapear venue desde URL personalizada
 * Body: {url: "https://ejemplo.com/venue/nombre"}
 * Timeout: 45s (Puppeteer tarda)
 */
router.post(
  '/api/admin/venues/scrape-url',
  authenticateUser,
  body('url').trim().isURL().withMessage('URL inválida'),
  async (req, res, next) => {
    try {
      // Validar rol (Permitir comercial también para el editor de propuestas)
      const user = req.user || (req.session && req.session.user);
      const role = user?.role || user?.ROLE;
      if (role !== 'admin' && role !== 'commercial') {
        return res.status(403).json({
          success: false,
          error: 'No tienes permisos para realizar esta acción'
        });
      }

      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'URL inválida',
          details: errors.array()
        });
      }

      const { url, queueId } = req.body;
      console.log(`🚀 Usuario (${role}) solicitando scraping de URL: ${url} (Queue ID: ${queueId || 'manual'})`);

      const VenueService = require('../services/VenueService');

      // Si viene de la cola, marcar como procesando
      if (queueId) {
        try {
          await VenueService.updatePendingStatus(queueId, 'processing');
        } catch (queueErr) {
          console.error('Error actualizando estado de cola a processing:', queueErr);
        }
      }

      // Scrapear desde URL personalizada
      let venueData;
      try {
        venueData = await VenueService.scrapeFromCustomUrl(url);
      } catch (scrapeErr) {
        // Si hay error en scraping y viene de cola, marcar error
        if (queueId) {
          await VenueService.updatePendingStatus(queueId, 'failed', scrapeErr.message);
        }
        throw scrapeErr;
      }

      if (!venueData) {
        if (queueId) {
          await VenueService.updatePendingStatus(queueId, 'failed', 'No se pudo extraer información');
        }
        return res.status(400).json({
          success: false,
          error: 'No se pudo extraer información del venue desde la URL proporcionada'
        });
      }

      // Persistir en BD
      const venueId = await VenueService.insertOrUpdateVenue(venueData);

      // Si viene de la cola, marcar como completado
      if (queueId) {
        try {
          await VenueService.updatePendingStatus(queueId, 'completed');
        } catch (queueCompErr) {
          console.error('Error actualizando estado de cola a completed:', queueCompErr);
        }
      }

      // Obtener venue completo
      const venue = await VenueService.getById(venueId);

      res.json({
        success: true,
        message: `✅ Venue "${venue.name}" importado correctamente`,
        venue,
        venueId
      });

    } catch (err) {
      console.error('Error en scrape-url:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Error al scrapear venue desde URL'
      });
    }
  }
);

/**
 * POST /api/admin/venues/import
 * ADMIN ONLY: Importar venues desde CSV
 * Form-data: {csvFile: File}
 */
router.post(
  '/api/admin/venues/import',
  authenticateUser,
  async (req, res, next) => {
    try {
      if (req.session.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Solo admin puede importar venues'
        });
      }

      const adminController = require('../controllers/adminController');
      await adminController.importVenues(req, res);
    } catch (err) {
      console.error('Error en importar venues:', err);
      next(err);
    }
  }
);

/**
 * POST /api/admin/venues/queue
 * ADMIN ONLY: Añadir URL individual a la cola de scraping
 */
router.post(
  '/api/admin/venues/queue',
  authenticateUser,
  body('url').trim().isURL().withMessage('URL de micecatering.com inválida'),
  async (req, res, next) => {
    try {
      if (req.session.user?.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Acceso restringido a administradores' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: 'URL inválida', details: errors.array() });
      }

      const VenueService = require('../services/VenueService');
      const queueId = await VenueService.addPendingScrape(req.body.url);

      res.json({
        success: true,
        message: 'URL añadida a la cola de scraping',
        queueId
      });
    } catch (err) {
      console.error('❌ Error al añadir URL a la cola:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

/**
 * DELETE /api/admin/venues/queue/:id
 * ADMIN ONLY: Eliminar URL de la cola de scraping
 */
router.delete(
  '/api/admin/venues/queue/:id',
  authenticateUser,
  param('id').isInt().toInt(),
  async (req, res, next) => {
    try {
      if (req.session.user?.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Acceso restringido' });
      }

      const { id } = req.params;
      const VenueService = require('../services/VenueService');
      await VenueService.deletePendingScrape(id);

      res.json({
        success: true,
        message: 'URL eliminada de la cola'
      });
    } catch (err) {
      console.error('❌ Error al eliminar de la cola:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

/**
 * POST /api/admin/venues/queue/import
 * ADMIN ONLY: Importar URLs a la cola de scraping desde CSV
 */
router.post(
  '/api/admin/venues/queue/import',
  authenticateUser,
  async (req, res, next) => {
    try {
      if (req.session.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Solo admin puede importar a la cola de scraping'
        });
      }

      const adminController = require('../controllers/adminController');
      await adminController.importQueue(req, res);
    } catch (err) {
      console.error('Error en importar cola:', err);
      next(err);
    }
  }
);

/**
 * POST /api/admin/venues/manual
 * ADMIN ONLY: Crear venue manualmente (fallback sin scraping)
 * Body: {name, description, address, external_url}
 */
router.post(
  '/api/admin/venues/manual',
  authenticateUser,
  body('name').trim().isLength({ min: 2, max: 255 }),
  body('description').optional().trim(),
  body('address').optional().trim(),
  body('external_url')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('URL inválida si se proporciona'),
  async (req, res, next) => {
    try {
      if (req.session.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Solo admin'
        });
      }

      const errors = require('express-validator').validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const VenueService = require('../services/VenueService');
      const id = await VenueService.createManual(req.body);

      const venue = await VenueService.getById(id);

      res.json({
        success: true,
        message: 'Venue creado',
        venue
      });
    } catch (err) {
      if (err.message.includes('obligatorio')) {
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }
      next(err);
    }
  }
);

/**
 * PUT /api/admin/venues/:id
 * ADMIN ONLY: Actualizar venue existente
 */
router.put(
  '/api/admin/venues/:id',
  authenticateUser,
  param('id').isInt().toInt(),
  body('name').optional().trim().isLength({ min: 2, max: 255 }),
  body('description').optional().trim(),
  body('address').optional().trim(),
  body('external_url')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('URL inválida si se proporciona'),
  async (req, res, next) => {
    try {
      if (req.session.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Solo admin'
        });
      }

      const errors = require('express-validator').validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const VenueService = require('../services/VenueService');

      const venue = await VenueService.updateManual(id, req.body);

      res.json({
        success: true,
        message: 'Venue actualizado',
        venue
      });
    } catch (err) {
      if (err.message.includes('no encontrado')) {
        return res.status(404).json({
          success: false,
          error: err.message
        });
      }
      next(err);
    }
  }
);

/**
 * DELETE /api/admin/venues/reset-all
 * ADMIN ONLY: Eliminar TODOS los venues (útil para resetear BD)
 * ⚠️ OPERACIÓN IRREVERSIBLE - Confirmación requerida
 */
router.delete(
  '/api/admin/venues/reset-all',
  authenticateUser,
  async (req, res, next) => {
    try {
      if (req.session.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Solo admin'
        });
      }

      // Doble confirmación: body con flag
      const { confirm } = req.body;
      if (confirm !== 'RESETEAR_TODOS_LOS_VENUES') {
        return res.status(400).json({
          success: false,
          error: 'Confirmación incorrecta. Envía {confirm: "RESETEAR_TODOS_LOS_VENUES"}'
        });
      }

      const VenueService = require('../services/VenueService');
      const deletedCount = await VenueService.deleteAll();

      res.json({
        success: true,
        message: `✅ Base de datos limpiada: ${deletedCount} venues eliminados`,
        deletedCount
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/admin/venues/:id
 * ADMIN ONLY: Eliminar venue
 */
router.delete(
  '/api/admin/venues/:id',
  authenticateUser,
  param('id').isInt().toInt(),
  async (req, res, next) => {
    try {
      if (req.session.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Solo admin'
        });
      }

      const { id } = req.params;
      const VenueService = require('../services/VenueService');

      const deleted = await VenueService.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Venue no encontrado'
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
);

/**
 * ============================================================================
 * MOTOR FINANCIERO - Endpoints para cálculos, descuentos, márgenes
 * ============================================================================
 */

/**
 * GET /api/proposals/:id/totals
 * Obtener totales detallados de una propuesta
 */
router.get(
  '/api/proposals/:id/totals',
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

      // Calcular totales sin persistir (para preview)
      const totals = await ProposalService.calculateTotals(id, { 
        persist: false, 
        auditUserId: req.user.id 
      });

      res.json({
        success: true,
        totals
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/proposals/:id/discount
 * Aplicar descuento manual a una propuesta
 */
router.post(
  '/api/proposals/:id/discount',
  authenticateUser,
  param('id').isInt().toInt(),
  body('discount_percentage').isFloat({ min: 0, max: 100 }),
  body('reason').trim().isLength({ min: 3, max: 255 }),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { discount_percentage, reason } = req.body;
      const ProposalService = require('../services/ProposalService');

      // Verificar permisos
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || proposal.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No permitido'
        });
      }

      // Aplicar descuento
      const totals = await ProposalService.applyManualDiscount(
        id,
        req.user.id,
        discount_percentage,
        reason
      );

      res.json({
        success: true,
        message: 'Descuento aplicado correctamente',
        totals
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/proposals/:id/discount
 * Eliminar descuento manual
 */
router.delete(
  '/api/proposals/:id/discount',
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

      // Eliminar descuento (poner a 0)
      const totals = await ProposalService.applyManualDiscount(
        id,
        req.user.id,
        0,
        'Descuento eliminado'
      );

      res.json({
        success: true,
        message: 'Descuento eliminado',
        totals
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/proposals/:id/margin-analysis
 * Obtener análisis de márgenes detallado
 */
router.get(
  '/api/proposals/:id/margin-analysis',
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

      const analysis = await ProposalService.getMarginAnalysis(id);

      res.json({
        success: true,
        analysis
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/proposals/:id/audit-log
 * Obtener historial de cambios de precio
 */
router.get(
  '/api/proposals/:id/audit-log',
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

      const auditLog = await ProposalService.getPriceAuditLog(id);

      res.json({
        success: true,
        audit_log: auditLog
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/volume-discounts
 * ⚠️ COMENTADO: Tabla volume_discount_tiers no existe
 * Obtener configuración de descuentos por volumen
 */
// router.get(
//   '/api/volume-discounts',
//   authenticateUser,
//   async (req, res, next) => {
//     try {
//       const ProposalService = require('../services/ProposalService');
//       const tiers = await ProposalService.getVolumeDiscountTiers();
//
//       res.json({
//         success: true,
//         tiers
//       });
//     } catch (err) {
//       next(err);
//     }
//   }
// );

/**
 * PUT /api/volume-discounts/:tierId
 * ⚠️ COMENTADO: Tabla volume_discount_tiers no existe
 * Actualizar tier de descuento por volumen (solo admin)
 */
// router.put(
//   '/api/volume-discounts/:tierId',
//   authenticateUser,
//   param('tierId').isInt().toInt(),
//   body('min_pax').optional().isInt({ min: 0 }),
//   body('max_pax').optional().isInt({ min: 0 }),
//   body('discount_percentage').optional().isFloat({ min: 0, max: 100 }),
//   body('description').optional().trim(),
//   body('is_active').optional().isBoolean(),
//   async (req, res, next) => {
//     try {
//       // Solo admin puede modificar
//       if (req.user.role !== 'admin') {
//         return res.status(403).json({
//           success: false,
//           message: 'Solo administradores pueden modificar descuentos'
//         });
//       }
//
//       const { tierId } = req.params;
//       const ProposalService = require('../services/ProposalService');
//       
//       const success = await ProposalService.updateVolumeDiscountTier(tierId, req.body);
//
//       if (!success) {
//         return res.status(400).json({
//           success: false,
//           message: 'No hay cambios válidos'
//         });
//       }
//
//       res.json({
//         success: true,
//         message: 'Tier actualizado correctamente'
//       });
//     } catch (err) {
//       next(err);
//     }
//   }
// );

/**
 * POST /api/volume-discounts
 * ⚠️ COMENTADO: Tabla volume_discount_tiers no existe
 * Crear nuevo tier de descuento por volumen (solo admin)
 */
// router.post(
//   '/api/volume-discounts',
//   authenticateUser,
//   body('min_pax').isInt({ min: 0 }),
//   body('max_pax').optional().isInt({ min: 0 }),
//   body('discount_percentage').isFloat({ min: 0, max: 100 }),
//   body('description').optional().trim(),
//   async (req, res, next) => {
//     try {
//       // Solo admin puede crear
//       if (req.user.role !== 'admin') {
//         return res.status(403).json({
//           success: false,
//           message: 'Solo administradores pueden crear descuentos'
//         });
//       }
//
//       const ProposalService = require('../services/ProposalService');
//       const tierId = await ProposalService.createVolumeDiscountTier(req.body);
//
//       res.json({
//         success: true,
//         message: 'Tier creado correctamente',
//         tier_id: tierId
//       });
//     } catch (err) {
//       next(err);
//     }
//   }
// );

/**
 * GET /api/dashboard/search
 * Búsqueda AJAX en tiempo real para dashboard
 * Query: ?status=draft&search=texto
 */
router.get(
  '/api/dashboard/search',
  authenticateUser,
  async (req, res, next) => {
    try {
      const { status, search } = req.query;
      const userId = req.session.user.id;
      const ProposalService = require('../services/ProposalService');

      // Llamar al servicio de listado
      const proposals = await ProposalService.listProposals(userId, {
        status: status || 'all',
        search: search || '',
        page: 1,
        limit: 10 // Coincidir con límite de dashboard
      });

      // Enriquecer con labels
      const { PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_COLORS } = require('../config/constants');
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

      res.json({
        success: true,
        proposals: enrichedProposals,
        count: enrichedProposals.length
      });
    } catch (err) {
      console.error('Error en búsqueda:', err);
      res.status(500).json({
        success: false,
        message: 'Error en la búsqueda'
      });
    }
  }
);

// ============ USER MANAGEMENT API (ADMIN ONLY) ============

/**
 * POST /api/admin/users
 * Crear un nuevo usuario
 */
router.post(
  '/api/admin/users',
  authenticateUser,
  authorizeRole('admin'),
  [
    body('name').trim().notEmpty().withMessage('El nombre es obligatorio'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('role').isIn(['admin', 'commercial']).withMessage('Rol inválido')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    AdminController.createUser(req, res);
  }
);

/**
 * GET /api/admin/users/:id
 * Obtener datos de un usuario
 */
router.get(
  '/api/admin/users/:id',
  authenticateUser,
  authorizeRole('admin'),
  param('id').isInt().toInt(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }
    AdminController.getUser(req, res);
  }
);

/**
 * PUT /api/admin/users/:id
 * Actualizar un usuario
 */
router.put(
  '/api/admin/users/:id',
  authenticateUser,
  authorizeRole('admin'),
  param('id').isInt().toInt(),
  [
    body('name').trim().notEmpty().withMessage('El nombre es obligatorio'),
    body('email').isEmail().withMessage('Email inválido'),
    body('role').isIn(['admin', 'commercial']).withMessage('Rol inválido'),
    body('password').optional({ checkFalsy: true }).isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    AdminController.updateUser(req, res);
  }
);

/**
 * DELETE /api/admin/users/:id
 * Eliminar un usuario
 */
router.delete(
  '/api/admin/users/:id',
  authenticateUser,
  authorizeRole('admin'),
  param('id').isInt().toInt(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }
    AdminController.deleteUser(req, res);
  }
);

/**
 * ========== DISHES & MENUS ITEMS API ==========
 */

/**
 * GET /api/dishes
 * Buscar platos por término (autocomplete)
 */
router.get(
  '/api/dishes',
  authenticateUser,
  async (req, res) => {
    try {
      const { q, limit = 10000 } = req.query;
      console.log(`[API] GET /api/dishes - q: "${q}", limit: ${limit}`);
      const DishService = require('../services/DishService');

      // Si no hay término de búsqueda, devolvemos platos por defecto (los últimos 10000)
      if (!q || q.trim().length === 0) {
        console.log('[API] No search term, returning default dishes');
        const { dishes } = await DishService.getAll({ limit: 10000 });
        return res.json({ success: true, dishes });
      }

      // Bajamos el límite a 1 carácter
      if (q.trim().length < 1) {
        console.log('[API] Search term too short');
        return res.json({ success: true, dishes: [] });
      }

      const dishes = await DishService.search(q, limit);
      console.log(`[API] Found ${dishes.length} dishes`);
      res.json({ success: true, dishes });
    } catch (err) {
      console.error('❌ Error en GET /api/dishes:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

/**
 * GET /api/admin/menus/:id
 * Obtener un menú detallado
 */
router.get(
  '/api/admin/menus/:id',
  authenticateUser,
  authorizeRole('admin'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const MenuService = require('../services/MenuService');
      const menu = await MenuService.getById(id);
      
      if (!menu) {
        return res.status(404).json({ success: false, message: 'Menú no encontrado' });
      }
      
      res.json({ success: true, menu });
    } catch (err) {
      console.error('❌ Error en GET /api/admin/menus/:id:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

/**
 * GET /api/dishes/:id
 * Obtener detalles de un plato
 */
router.get(
  '/api/dishes/:id',
  authenticateUser,
  param('id').isInt().toInt(),
  async (req, res) => {
    try {
      const { id } = req.params;
      const DishService = require('../services/DishService');

      const dish = await DishService.getById(id);
      if (!dish) {
        return res.status(404).json({ success: false, error: 'Plato no encontrado' });
      }

      res.json({ success: true, dish });
    } catch (err) {
      console.error('❌ Error en GET /api/dishes/:id:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

/**
 * GET /api/services (formerly /api/menus)
 * Listar servicios disponibles del catálogo
 */
router.get(
  '/api/services',
  authenticateUser,
  async (req, res) => {
    try {
      const { search, limit = 10000, offset = 0 } = req.query;
      const MenuService = require('../services/MenuService');

      const { menus, total } = await MenuService.getAll({
        search,
        limit,
        offset
      });

      res.json({ success: true, services: menus, total });
    } catch (err) {
      console.error('❌ Error en GET /api/services:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Alias para compatibilidad con el editor antiguo
router.get('/api/menus', authenticateUser, (req, res) => {
  res.redirect(301, `/api/services?${new URLSearchParams(req.query).toString()}`);
});

/**
 * GET /api/menus/:id
 * Obtener un menú con sus platos
 */
router.get(
  '/api/menus/:id',
  authenticateUser,
  param('id').isInt().toInt(),
  async (req, res) => {
    try {
      const { id } = req.params;
      const MenuService = require('../services/MenuService');

      const menu = await MenuService.getById(id);
      if (!menu) {
        return res.status(404).json({ success: false, error: 'Menú no encontrado' });
      }

      res.json({ success: true, menu });
    } catch (err) {
      console.error('❌ Error en GET /api/menus/:id:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

/**
 * GET /api/menus/:id/dishes
 * Obtener platos de un menú
 */
router.get(
  '/api/menus/:id/dishes',
  authenticateUser,
  param('id').isInt().toInt(),
  async (req, res) => {
    try {
      const { id } = req.params;
      const MenuService = require('../services/MenuService');

      const dishes = await MenuService.getDishesForMenu(id);
      res.json({ success: true, dishes });
    } catch (err) {
      console.error('❌ Error en GET /api/menus/:id/dishes:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

/**
 * POST /api/proposals/:id/options/:optionId/items
 * Añadir items/platos a una opción
 * Body: {source: 'menu'|'dish', sourceId, customPrice?, items?: [...]}
 */
router.post(
  '/api/proposals/:id/options/:optionId/items',
  authenticateUser,
  param('id').isInt().toInt(),
  param('optionId').isInt().toInt(),
  [
    body('source').isIn(['menu', 'dish']).withMessage('Source debe ser "menu" o "dish"'),
    body('sourceId').isInt().withMessage('sourceId debe ser un número'),
    body('customPrice').optional().isFloat({ min: 0 }).withMessage('customPrice debe ser positivo'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('quantity debe ser >= 1')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id, optionId } = req.params;
      const { source, sourceId, customPrice, quantity = 1 } = req.body;
      const ProposalService = require('../services/ProposalService');
      const MenuService = require('../services/MenuService');

      let items = [];

      if (source === 'menu') {
        // Obtener todos los platos del menú
        const menu = await MenuService.getById(sourceId);
        if (!menu) {
          return res.status(404).json({ success: false, error: 'Menú no encontrado' });
        }

        // Crear items a partir de los platos del menú
        items = menu.dishes.map(dish => ({
          dishId: dish.id,
          quantity
        }));
      } else {
        // source === 'dish'
        items = [{ dishId: sourceId, quantity }];
      }

      const createdItems = await ProposalService.addItemsToOption(optionId, items);

      // Recalcular totales de la propuesta
      const totals = await ProposalService.calculateTotals(id, { persist: true });

      res.json({
        success: true,
        items: createdItems,
        totals
      });
    } catch (err) {
      console.error('❌ Error en POST /api/proposals/:id/options/:optionId/items:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

/**
 * DELETE /api/proposals/:id/items/:itemId
 * Eliminar un item de la propuesta
 */
router.delete(
  '/api/proposals/:id/items/:itemId',
  authenticateUser,
  param('id').isInt().toInt(),
  param('itemId').isInt().toInt(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id, itemId } = req.params;
      const ProposalService = require('../services/ProposalService');

      const success = await ProposalService.removeItem(itemId);

      if (!success) {
        return res.status(404).json({ success: false, error: 'Item no encontrado' });
      }

      // Recalcular totales
      const totals = await ProposalService.calculateTotals(id, { persist: true });

      res.json({
        success: true,
        message: 'Item eliminado',
        totals
      });
    } catch (err) {
      console.error('❌ Error en DELETE /api/proposals/:id/items/:itemId:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

/**
 * PUT /api/proposals/:id/items/:itemId
 * Actualizar un item (descripción, cantidad, precio, etc)
 */
router.put(
  '/api/proposals/:id/items/:itemId',
  authenticateUser,
  param('id').isInt().toInt(),
  param('itemId').isInt().toInt(),
  [
    body('name').optional().trim(),
    body('description').optional().trim(),
    body('quantity').optional().isInt({ min: 1 }),
    body('custom_price').optional().isFloat({ min: 0 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id, itemId } = req.params;
      const ProposalService = require('../services/ProposalService');

      const updated = await ProposalService.updateItem(itemId, req.body);

      // Recalcular totales
      const totals = await ProposalService.calculateTotals(id, { persist: true });

      res.json({
        success: true,
        item: updated,
        totals
      });
    } catch (err) {
      console.error('❌ Error en PUT /api/proposals/:id/items/:itemId:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

/**
 * GET /api/proposals/:id/messages
 * Obtener mensajes del chat
 */
router.get(
  '/api/proposals/:id/messages',
  authenticateUser,
  param('id').isInt().toInt(),
  validate,
  (req, res, next) => editorController.getMessages(req, res, next)
);

/**
 * POST /api/proposals/:id/messages
 * Enviar un mensaje al chat
 */
router.post(
  '/api/proposals/:id/messages',
  authenticateUser,
  param('id').isInt().toInt(),
  body('message_body').trim().isLength({ min: 1, max: 2000 }),
  validate,
  (req, res, next) => editorController.sendMessage(req, res, next)
);

/**
 * POST /api/proposals/:id/messages/mark-read
 * Marcar mensajes como leídos
 */
router.post(
  '/api/proposals/:id/messages/mark-read',
  authenticateUser,
  param('id').isInt().toInt(),
  validate,
  (req, res, next) => editorController.markMessagesAsRead(req, res, next)
);

/**
 * GET /api/dashboard/pending-messages
 * Obtener todos los mensajes no leídos para el sidebar
 */
router.get(
  '/api/dashboard/pending-messages',
  authenticateUser,
  (req, res, next) => dashboardController.getPendingMessages(req, res, next)
);

// --- VENUES ADMIN QUEUE ---

/**
 * POST /api/admin/venues/queue
 * Añadir URL a la cola de scraping
 */
router.post(
  '/api/admin/venues/queue',
  authenticateUser,
  authorizeRole('admin'),
  async (req, res) => {
    try {
      let { url } = req.body;
      if (!url) return res.status(400).json({ success: false, error: 'URL requerida' });

      // Normalizar URL si le falta el protocolo
      url = url.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const VenueService = require('../services/VenueService');
      const queueId = await VenueService.addPendingScrape(url);
      
      const scares = await VenueService.getPendingScrapes();
      const newScrape = scares.find(s => s.id == queueId);

      res.json({
        success: true,
        message: 'URL añadida a la cola correctamente',
        queueItem: newScrape
      });
    } catch (err) {
      console.error('Error añadiendo URL a la cola:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

/**
 * DELETE /api/admin/venues/queue/:id
 * Eliminar URL de la cola
 */
router.delete(
  '/api/admin/venues/queue/:id',
  authenticateUser,
  authorizeRole('admin'),
  param('id').isInt().toInt(),
  async (req, res) => {
    try {
      const { id } = req.params;
      const VenueService = require('../services/VenueService');
      await VenueService.deletePendingScrape(id);
      res.json({ success: true, message: 'URL eliminada de la cola' });
    } catch (err) {
      console.error('Error eliminando URL de la cola:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;

