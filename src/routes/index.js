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

// ============ ROOT REDIRECT ============
router.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.redirect('/login');
});

// ============ RUTAS PROTEGIDAS (Requieren login) ============
// Se irán añadiendo en las próximas fases

// ============ EXPORTAR ============
module.exports = router;
