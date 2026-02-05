/**
 * Central Route Registry
 * Importa y registra todas las rutas de la aplicación
 * Se usa en src/app.js
 */

const express = require('express');
const { authenticateUser, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// ============ RUTAS PÚBLICAS ============

// Health check (sin autenticación)
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// ============ RUTAS PROTEGIDAS (Requieren login) ============
// Se irán añadiendo en las próximas fases:
// - GET /dashboard - Dashboard comercial
// - GET /editor/:id - Editor de propuestas
// - GET /p/:hash - Vista cliente (magic link)
// - POST /api/... - Endpoints de API

// ============ EXPORTAR ============
module.exports = router;
