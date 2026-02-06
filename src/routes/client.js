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
// DESCARGAR PDF (Public)
// ════════════════════════════════════════════════════════════════

router.post('/p/:hash/download-pdf',
  param('hash')
    .isLength({ min: 32, max: 64 })
    .withMessage('Hash inválido'),
  clientController.downloadPDF
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
