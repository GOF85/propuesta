/**
 * Dashboard Routes
 * Rutas para dashboard comercial
 */

const express = require('express');
const { query, param, body, validationResult } = require('express-validator');
const { authenticateUser, authorizeRole } = require('../middleware/auth');
const DashboardController = require('../controllers/dashboardController');

const router = express.Router();

// Todas las rutas requieren autenticación y rol de comercial/admin
router.use(authenticateUser);

// ============ DASHBOARD - GET ============

/**
 * GET /dashboard
 * Listar propuestas con filtros
 * Query: ?status=draft&search=amazon&page=1
 */
router.get('/dashboard', [
  query('status')
    .optional()
    .isIn(['all', 'draft', 'sent', 'accepted'])
    .withMessage('Estado inválido'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Búsqueda muy larga'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página inválida')
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', 'Parámetros inválidos');
    return res.redirect('/dashboard');
  }
  DashboardController.getProposals(req, res, next);
});

/**
 * GET /proposal/new
 * Mostrar formulario de nueva propuesta
 */
router.get('/proposal/new', DashboardController.newProposal);

// ============ PROPUESTAS - CRUD ============

/**
 * POST /proposal
 * Crear nueva propuesta
 */
router.post('/proposal', [
  body('client_name')
    .trim()
    .notEmpty()
    .withMessage('Nombre del cliente requerido')
    .isLength({ max: 255 })
    .withMessage('Nombre muy largo'),
  body('event_date')
    .optional()
    .isISO8601()
    .withMessage('Fecha inválida'),
  body('pax')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Número de personas inválido')
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', 'Datos inválidos: ' + errors.array()[0].msg);
    return res.redirect('/proposal/new');
  }
  DashboardController.createProposal(req, res, next);
});

/**
 * POST /proposal/:id/duplicate
 * Duplicar una propuesta existente
 */
router.post('/proposal/:id/duplicate', [
  param('id')
    .isInt()
    .withMessage('ID inválido')
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', 'ID inválido');
    return res.redirect('/dashboard');
  }
  DashboardController.duplicateProposal(req, res, next);
});

/**
 * POST /proposal/:id/delete
 * Eliminar una propuesta
 */
router.post('/proposal/:id/delete', [
  param('id')
    .isInt()
    .withMessage('ID inválido')
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', 'ID inválido');
    return res.redirect('/dashboard');
  }
  DashboardController.deleteProposal(req, res, next);
});

/**
 * POST /proposal/:id/status
 * Cambiar estado de una propuesta (AJAX)
 */
router.post('/proposal/:id/status', [
  param('id')
    .isInt()
    .withMessage('ID inválido'),
  body('status')
    .isIn(['draft', 'sent', 'accepted'])
    .withMessage('Estado inválido')
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  DashboardController.updateStatus(req, res, next);
});

// ============ ADMIN PANEL ============

/**
 * GET /admin/venues
 * ADMIN ONLY: Gestión de venues con scraping
 * Requiere rol: admin
 */
router.get('/admin/venues',
  authenticateUser,
  authorizeRole('admin'),
  (req, res, next) => {
    const AdminController = require('../controllers/adminController');
    AdminController.getVenuesListPage(req, res, next);
  }
);

/**
 * GET /admin/dishes
 * ADMIN ONLY: Gestión de platos del catálogo
 */
router.get('/admin/dishes',
  authenticateUser,
  authorizeRole('admin'),
  (req, res, next) => {
    const AdminController = require('../controllers/adminController');
    AdminController.getDishesPanel(req, res, next);
  }
);

/**
 * GET /admin/services
 * ADMIN ONLY: Gestión de servicios
 */
router.get('/admin/services',
  authenticateUser,
  authorizeRole('admin'),
  (req, res, next) => {
    const AdminController = require('../controllers/adminController');
    AdminController.getServicesPanel(req, res, next);
  }
);

module.exports = router;
