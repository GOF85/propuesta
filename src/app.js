/**
 * Express Application Setup
 * Middlewares, EJS templating, static files, session handling
 * Tailwind CSS vía CDN para MVP
 */

const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const fileUpload = require('express-fileupload');
const path = require('path');
const dayjs = require('dayjs');
require('dayjs/locale/es'); // Importar locale español
dayjs.locale('es'); // Establecer como global
require('dotenv').config();

const { errorHandler, authorizeRole } = require('./middleware/auth');
const DashboardController = require('./controllers/dashboardController');
const AdminController = require('./controllers/adminController');
const ClientController = require('./controllers/clientController');
const ChatService = require('./services/ChatService');
const SustainabilityService = require('./services/SustainabilityService');

// Helper: Admin-only middleware
const requireAdmin = authorizeRole('admin');

const app = express();

// ============ CONFIGURACIÓN DE VISTAS (EJS) ============
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// ============ MIDDLEWARES GLOBALES ============

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload (para imágenes, CSV, etc)
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  abortOnLimit: true,
  responseOnLimit: 'Archivo demasiado grande',
  useTempFiles: false, // Procesamos en memoria
  safeFileNames: true,
  preserveExtension: true
}));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 24 horas
  },
}));

// Robust req.user assignment and normalization
app.use((req, res, next) => {
  if (req.session && req.session.user) {
    const sUser = req.session.user;
    req.user = {
      id: sUser.id || sUser.ID,
      role: sUser.role || sUser.ROLE,
      name: sUser.name || sUser.NAME || sUser.username,
      email: sUser.email || sUser.EMAIL
    };
  }
  next();
});

// Contador global de mensajes no leídos (solo para comerciales/admin)
app.use(async (req, res, next) => {
  res.locals.totalUnreadChats = 0;
  if (req.user && req.user.role !== 'client') {
    try {
      res.locals.totalUnreadChats = await ChatService.getTotalUnreadForUser(req.user.id, req.user.role);
    } catch (err) {
      console.error('Error in unread count middleware:', err);
    }
  }
  next();
});

// Flash messages
app.use(flash());

// ============ DEBUG MIDDLEWARE ============
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============ MIDDLEWARE DE VARIABLES LOCALES ============
/**
 * Inyecta variables globales en todas las vistas (EJS)
 * - user: info del usuario sesionado
 * - messages: mensajes flash
 * - helpers: funciones de formato
 */
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.isDev = process.env.NODE_ENV !== 'production';
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg = req.flash('error');
  res.locals.info_msg = req.flash('info');
  res.locals.dayjs = dayjs;
  res.locals.sustainabilityConfig = SustainabilityService.getConfig();
  
  // Helpers para vistas
  res.locals.formatCurrency = (amount) => {
    if (!amount) return '0,00 €';
    return amount.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' €';
  };
  
  res.locals.formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  res.locals.statusLabel = (status) => {
    const labels = {
      'Pipe': 'Pipe',
      'Aceptada': 'Aceptada',
      'Anulada': 'Anulada',
      'archived': 'Archivada'
    };
    return labels[status] || status;
  };
  
  next();
});

// ============ RUTAS PRINCIPALES ============

// RUTA ROOT
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.redirect('/login');
});

app.post('/admin/dishes/import', requireAdmin, (req, res) => {
  AdminController.importDishes(req, res);
});

app.get('/admin/dishes/export', requireAdmin, (req, res) => {
  AdminController.exportDishes(req, res);
});

app.post('/admin/dishes/:id/delete', requireAdmin, (req, res) => {
  AdminController.deleteDish(req, res);
});

// ============ RUTAS DEV (Solo desarrollo) ============
if (process.env.NODE_ENV !== 'production') {
  app.get('/dev/toggle-role', (req, res) => {
    if (!req.session.user) {
      req.session.user = { id: 1, name: 'Dev User', role: 'admin', email: 'dev@micecatering.com' };
    } else {
      req.session.user.role = req.session.user.role === 'admin' ? 'commercial' : 'admin';
    }
    req.flash('info', `Rol cambiado a: ${req.session.user.role === 'admin' ? 'Administrador' : 'Comercial'}`);
    res.redirect(req.get('referer') || '/dashboard');
  });
}

// ============ RUTAS - Orden importante ============
const routes = require('./routes/index');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const editorRoutes = require('./routes/editor');
const apiRoutes = require('./routes/api');
const clientRoutes = require('./routes/client');

// Orden IMPORTANTE: authRoutes primero para que /login y /logout funcionen
app.use('/', authRoutes);
app.use('/', routes);
app.use('/', dashboardRoutes);        // ← Incluye /admin, /admin/venues
app.use('/', editorRoutes);
app.use('/', apiRoutes);              // Image upload & data API endpoints
app.use('/', clientRoutes);           // Magic link routes (public)

// ============ MANEJO DE ERRORES ============

// 404 Handler
app.use((req, res) => {
  res.status(404).send('404 - Página no encontrada');
});

// Error handler global
app.use(errorHandler);

module.exports = app;
