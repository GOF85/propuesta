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

/**
 * ════════════════════════════════════════════════════════════════
 * RUTAS DE VENUES - VenueService + Puppeteer Scraping
 * ════════════════════════════════════════════════════════════════
 */

/**
 * GET /api/venues
 * Listar todos los venues con filtros opcionales
 * Query params: ?search=xxx&minCapacity=100&features=wifi
 */
router.get('/api/venues', async (req, res, next) => {
  try {
    const VenueService = require('../services/VenueService');
    const { search, minCapacity, features } = req.query;

    const filters = {};
    if (search) filters.search = search;
    if (minCapacity) filters.minCapacity = parseInt(minCapacity);
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
    if (req.session.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Solo admin puede ejecutar scraping'
      });
    }

    console.log('🚀 Admin solicitando scraping de venues...');
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
      // Validar rol admin
      if (req.session.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Solo admin puede ejecutar scraping'
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

      const { url } = req.body;
      console.log(`🚀 Admin solicitando scraping de URL: ${url}`);

      const VenueService = require('../services/VenueService');

      // Scrapear desde URL personalizada
      const venueData = await VenueService.scrapeFromCustomUrl(url);

      if (!venueData) {
        return res.status(400).json({
          success: false,
          error: 'No se pudo extraer información del venue desde la URL proporcionada'
        });
      }

      // Persistir en BD
      const venueId = await VenueService.insertOrUpdateVenue(venueData);

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
 * POST /api/admin/venues/manual
 * ADMIN ONLY: Crear venue manualmente (fallback sin scraping)
 * Body: {name, description, capacity, features[], address, external_url}
 */
router.post(
  '/api/admin/venues/manual',
  authenticateUser,
  body('name').trim().isLength({ min: 2, max: 255 }),
  body('description').optional().trim(),
  body('capacity').optional().isInt({ min: 0 }),
  body('address').optional().trim(),
  body('external_url').optional().isURL(),
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
  body('capacity').optional().isInt({ min: 0 }),
  body('address').optional().trim(),
  body('external_url').optional().isURL(),
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
        limit: 50 // Mayor límite para búsqueda
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

module.exports = router;

