/**
 * client.js Routes
 * Propósito: Endpoints públicos para acceso vía magic link
 * Pattern: Sin autenticación requerida (hash = token)
 */

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
const clientController = require('../controllers/clientController');

// ════════════════════════════════════════════════════════════════
// RUTA DASHBOARD DE CLIENTE (Protegido por login)
// ════════════════════════════════════════════════════════════════
router.get('/my-proposals', async (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  
  try {
    await clientController.getClientDashboard(req, res);
  } catch (err) {
    console.error('Client Dashboard Error:', err);
    req.flash('error', 'Error al cargar tus propuestas');
    res.redirect('/login');
  }
});

// ════════════════════════════════════════════════════════════════
// VER PROPUESTA (Magic Link - Public)
// ════════════════════════════════════════════════════════════════

router.get('/p/:hash', 
  param('hash')
    .isLength({ min: 32, max: 64 })
    .withMessage('Hash inválido'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('errors/400', {
        title: 'Hash inválido',
        error: 'El enlace proporcionado no es válido'
      });
    }
    next();
  },
  clientController.viewProposal
);

// ════════════════════════════════════════════════════════════════
// OBTENER JSON DE PROPUESTA (Para actualizaciones dinámicas)
// ════════════════════════════════════════════════════════════════
router.get('/p/:hash/json',
  param('hash').isLength({ min: 32, max: 64 }).withMessage('Hash inválido'),
  clientController.getProposalJSON
);

// ════════════════════════════════════════════════════════════════
// DESCARGAR PDF (Public)
// ════════════════════════════════════════════════════════════════

router.post('/p/:hash/download-pdf',
  param('hash')
    .isLength({ min: 32, max: 64 })
    .withMessage('Hash inválido'),
  clientController.downloadPDF
);

// ════════════════════════════════════════════════════════════════
// SELECCIONAR VENUE (Public)
// ════════════════════════════════════════════════════════════════

router.post('/p/:hash/select-venue',
  param('hash').isLength({ min: 32, max: 64 }),
  body('venue_id')
    .custom((value) => {
      if (value === null) return true;
      if (typeof value === 'number') return Number.isInteger(value);
      if (typeof value === 'string' && /^\d+$/.test(value)) return true;
      return false;
    })
    .withMessage('venue_id debe ser entero o null')
    .customSanitizer((value) => {
      if (value === null) return null;
      if (typeof value === 'number') return value;
      return parseInt(value, 10);
    }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
  clientController.selectVenue
);

router.post('/p/:hash/select-option',
  param('hash').isLength({ min: 32, max: 64 }),
  body('serviceId').notEmpty().withMessage('Service ID es requerido'),
  // optionId puede ser null/vacío para deseleccionar
  body('optionId').optional({ nullable: true }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
  clientController.selectOption
);

// ════════════════════════════════════════════════════════════════
// ACTUALIZAR ESTADO DE HITO (Public)
// ════════════════════════════════════════════════════════════════

router.post('/p/:hash/milestone/:serviceId/status',
  param('hash').isLength({ min: 32, max: 64 }),
  param('serviceId').isInt().toInt(),
  body('status').isIn(['added', 'pending', 'cancelled']),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
  clientController.updateMilestoneStatus
);

// ════════════════════════════════════════════════════════════════
// ENVIAR MENSAJE (Public - No auth, use rate limiting in production)
// ════════════════════════════════════════════════════════════════

router.post('/p/:hash/messages',
  param('hash')
    .isLength({ min: 32, max: 64 })
    .withMessage('Hash inválido'),
  body('message_body')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Mensaje debe tener entre 1 y 2000 caracteres'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  },
  clientController.sendMessage
);

// ════════════════════════════════════════════════════════════════
// OBTENER MENSAJES (AJAX Polling)
// ════════════════════════════════════════════════════════════════

router.get('/p/:hash/messages',
  param('hash')
    .isLength({ min: 32, max: 64 })
    .withMessage('Hash inválido'),
  clientController.getMessages
);

// ════════════════════════════════════════════════════════════════
// MARCAR MENSAJES COMO LEÍDOS
// ════════════════════════════════════════════════════════════════

router.post('/p/:hash/messages/mark-read',
  param('hash')
    .isLength({ min: 32, max: 64 })
    .withMessage('Hash inválido'),
  clientController.markMessagesAsRead
);

// ════════════════════════════════════════════════════════════════
// ACEPTAR PROPUESTA
// ════════════════════════════════════════════════════════════════

router.post('/p/:hash/accept',
  param('hash')
    .isLength({ min: 32, max: 64 })
    .withMessage('Hash inválido'),
  clientController.acceptProposal
);

// ════════════════════════════════════════════════════════════════
// RECHAZAR PROPUESTA
// ════════════════════════════════════════════════════════════════

router.post('/p/:hash/reject',
  param('hash')
    .isLength({ min: 32, max: 64 })
    .withMessage('Hash inválido'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Motivo muy largo'),
  clientController.rejectProposal
);

// ════════════════════════════════════════════════════════════════
// SOLICITAR MODIFICACIONES
// ════════════════════════════════════════════════════════════════

router.post('/p/:hash/modifications',
  param('hash')
    .isLength({ min: 32, max: 64 })
    .withMessage('Hash inválido'),
  body('modifications')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Describe las modificaciones (10-2000 caracteres)'),
  clientController.requestModifications
);

module.exports = router;
