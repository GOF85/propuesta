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
// EXCEPTO las rutas de magic link /p/:hash que son públicas
router.use((req, res, next) => {
  // Permitir rutas públicas (magic links)
  if (req.path.startsWith('/p/')) {
    return next();
  }
  // Aplicar autenticación a todas las demás
  authenticateUser(req, res, next);
});

// ============ DASHBOARD - GET ============

/**
 * GET /dashboard
 * Listar propuestas con filtros
 * Query: ?status=draft&search=amazon&page=1
 */
router.get('/dashboard', [
  query('status')
    .optional()
    .isIn(['all', 'unread', 'Pipe', 'Aceptada', 'Anulada', 'archived', 'draft', 'sent', 'accepted', 'cancelled'])
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
router.get('/proposal/new', (req, res, next) => DashboardController.newProposal(req, res, next));

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
    .withMessage('Número de personas inválido'),
  body('brand_color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color inválido'),
  body('logo_url')
    .optional()
    .isString()
    .trim()
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
 * GET /admin
 * ADMIN ONLY: Dashboard administrativo principal
 * Requiere rol: admin
 */
router.get('/admin',
  authenticateUser,
  authorizeRole('admin'),
  (req, res, next) => {
    const AdminController = require('../controllers/adminController');
    AdminController.getAdminDashboard(req, res, next);
  }
);

/**
 * GET /admin/sustainability
 * ADMIN ONLY: Panel de gestión de sostenibilidad
 */
router.get('/admin/sustainability',
  authenticateUser,
  authorizeRole('admin'),
  (req, res, next) => {
    const AdminController = require('../controllers/adminController');
    AdminController.getSustainabilityPanel(req, res, next);
  }
);

/**
 * POST /admin/sustainability
 * ADMIN ONLY: Actualizar configuración de sostenibilidad
 */
router.post('/admin/sustainability',
  authenticateUser,
  authorizeRole('admin'),
  (req, res, next) => {
    const AdminController = require('../controllers/adminController');
    AdminController.updateSustainability(req, res, next);
  }
);

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
 * GET /admin/venues/queue-template
 * ADMIN ONLY: Descargar plantilla CSV para cola de scraping
 */
router.get('/admin/venues/queue-template',
  authenticateUser,
  authorizeRole('admin'),
  (req, res, next) => {
    const AdminController = require('../controllers/adminController');
    AdminController.getQueueTemplate(req, res, next);
  }
);

/**
 * GET /admin/users
 * ADMIN ONLY: Gestión de usuarios
 */
router.get('/admin/users',
  authenticateUser,
  authorizeRole('admin'),
  (req, res, next) => {
    const AdminController = require('../controllers/adminController');
    AdminController.getUsersPanel(req, res, next);
  }
);

/**
 * Image Catalog Routes
 */
router.get('/admin/images',
  authenticateUser,
  authorizeRole('admin'),
  (req, res, next) => {
    const AdminController = require('../controllers/adminController');
    AdminController.getImagesPanel(req, res, next);
  }
);

router.post('/admin/catalog/upload',
  authenticateUser,
  authorizeRole('admin'),
  (req, res, next) => {
    console.log('🛤️ [Router] Detectada ruta POST /admin/catalog/upload (Nueva Ruta)');
    const AdminController = require('../controllers/adminController');
    AdminController.uploadImage(req, res, next);
  }
);

router.post('/admin/images/delete/:id',
  authenticateUser,
  authorizeRole('admin'),
  (req, res, next) => {
    const AdminController = require('../controllers/adminController');
    AdminController.deleteImage(req, res, next);
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
 * GET /admin/venues/export
 * ADMIN ONLY: Exportar venues como CSV
 */
router.get('/admin/venues/export',
  authenticateUser,
  authorizeRole('admin'),
  (req, res, next) => {
    const AdminController = require('../controllers/adminController');
    AdminController.exportVenues(req, res, next);
  }
);

/**
 * GET /admin/dishes/export
 * ADMIN ONLY: Exportar platos como CSV
 */
router.get('/admin/dishes/export',
  authenticateUser,
  authorizeRole('admin'),
  (req, res, next) => {
    const AdminController = require('../controllers/adminController');
    AdminController.exportDishes(req, res, next);
  }
);

/**
 * POST /admin/dishes
 * ADMIN ONLY: Crear nuevo plato
 */
router.post('/admin/dishes',
  authenticateUser,
  authorizeRole('admin'),
  [
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
    body('category').optional().trim(),
    body('base_price').optional().isFloat({ min: 0 }).withMessage('Precio inválido')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const AdminController = require('../controllers/adminController');
    AdminController.createDish(req, res, next);
  }
);

/**
 * PUT /admin/dishes/:id
 * ADMIN ONLY: Actualizar plato
 */
router.put('/admin/dishes/:id',
  authenticateUser,
  authorizeRole('admin'),
  [
    param('id').isInt().withMessage('ID inválido'),
    body('name').optional().trim(),
    body('base_price').optional().isFloat({ min: 0 }).withMessage('Precio inválido')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const AdminController = require('../controllers/adminController');
    AdminController.updateDish(req, res, next);
  }
);

/**
 * DELETE /admin/dishes/:id
 * ADMIN ONLY: Eliminar plato
 */
router.delete('/admin/dishes/:id',
  authenticateUser,
  authorizeRole('admin'),
  [
    param('id').isInt().withMessage('ID inválido')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const AdminController = require('../controllers/adminController');
    AdminController.deleteDish(req, res, next);
  }
);

/**
 * POST /admin/dishes/:id/duplicate
 * ADMIN ONLY: Duplicar plato
 */
router.post('/admin/dishes/:id/duplicate',
  authenticateUser,
  authorizeRole('admin'),
  [
    param('id').isInt().withMessage('ID inválido')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const AdminController = require('../controllers/adminController');
    AdminController.duplicateDish(req, res, next);
  }
);

/**
 * POST /admin/dishes/import
 * ADMIN ONLY: Importar platos desde CSV
 */
router.post('/admin/dishes/import',
  authenticateUser,
  authorizeRole('admin'),
  (req, res, next) => {
    const AdminController = require('../controllers/adminController');
    AdminController.importDishes(req, res, next);
  }
);

/**
 * GET /admin/menus
 * ADMIN ONLY: Gestión de menús del catálogo
 */
router.get('/admin/menus',
  authenticateUser,
  authorizeRole('admin'),
  (req, res, next) => {
    const AdminController = require('../controllers/adminController');
    AdminController.getMenusPanel(req, res, next);
  }
);

/**
 * POST /admin/menus
 * ADMIN ONLY: Crear nuevo menú
 */
router.post('/admin/menus',
  authenticateUser,
  authorizeRole('admin'),
  [
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
    body('base_price').optional().isFloat({ min: 0 }).withMessage('Precio inválido')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const AdminController = require('../controllers/adminController');
    AdminController.createMenu(req, res, next);
  }
);

/**
 * PUT /admin/menus/:id
 * ADMIN ONLY: Actualizar menú
 */
router.put('/admin/menus/:id',
  authenticateUser,
  authorizeRole('admin'),
  [
    param('id').isInt().withMessage('ID inválido'),
    body('name').optional().trim(),
    body('base_price').optional().isFloat({ min: 0 }).withMessage('Precio inválido')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const AdminController = require('../controllers/adminController');
    AdminController.updateMenu(req, res, next);
  }
);

/**
 * DELETE /admin/menus/:id
 * ADMIN ONLY: Eliminar menú
 */
router.delete('/admin/menus/:id',
  authenticateUser,
  authorizeRole('admin'),
  [
    param('id').isInt().withMessage('ID inválido')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const AdminController = require('../controllers/adminController');
    AdminController.deleteMenu(req, res, next);
  }
);

/**
 * POST /admin/menus/:id/duplicate
 * ADMIN ONLY: Duplicar menú
 */
router.post('/admin/menus/:id/duplicate',
  authenticateUser,
  authorizeRole('admin'),
  [
    param('id').isInt().withMessage('ID inválido')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const AdminController = require('../controllers/adminController');
    AdminController.duplicateMenu(req, res, next);
  }
);

/**
 * POST /admin/menus/import
 * ADMIN ONLY: Importar menús desde CSV
 */
router.post('/admin/menus/import',
  authenticateUser,
  authorizeRole('admin'),
  (req, res, next) => {
    const AdminController = require('../controllers/adminController');
    AdminController.importMenus(req, res, next);
  }
);

/**
 * GET /admin/menus/export
 * ADMIN ONLY: Exportar menús a CSV
 */
router.get('/admin/menus/export',
  authenticateUser,
  authorizeRole('admin'),
  (req, res, next) => {
    const AdminController = require('../controllers/adminController');
    AdminController.exportMenus(req, res, next);
  }
);

/**
 * --- CATEGORÍAS ---
 */
router.get('/admin/categories',
  authenticateUser,
  authorizeRole('admin'),
  (req, res, next) => {
    const AdminController = require('../controllers/adminController');
    AdminController.getCategoriesPanel(req, res, next);
  }
);

router.post('/admin/categories',
  authenticateUser,
  authorizeRole('admin'),
  (req, res, next) => {
    const AdminController = require('../controllers/adminController');
    AdminController.createCategory(req, res, next);
  }
);

router.post('/admin/categories/:id',
  authenticateUser,
  authorizeRole('admin'),
  (req, res, next) => {
    const AdminController = require('../controllers/adminController');
    AdminController.updateCategory(req, res, next);
  }
);

router.delete('/admin/categories/:id',
  authenticateUser,
  authorizeRole('admin'),
  (req, res, next) => {
    const AdminController = require('../controllers/adminController');
    AdminController.deleteCategory(req, res, next);
  }
);

module.exports = router;
