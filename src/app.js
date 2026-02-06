/**
 * Express Application Setup
 * Middlewares, EJS templating, static files, session handling
 * Tailwind CSS vía CDN para MVP
 */

const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
require('dotenv').config();

const { errorHandler } = require('./middleware/auth');

const app = express();

// ============ CONFIGURACIÓN DE VISTAS (EJS) ============
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// ============ MIDDLEWARES GLOBALES ============

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// Flash messages
app.use(flash());

// ============ MIDDLEWARE DE VARIABLES LOCALES ============
/**
 * Inyecta variables globales en todas las vistas (EJS)
 * - user: info del usuario sesionado
 * - messages: mensajes flash
 * - helpers: funciones de formato
 */
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg = req.flash('error');
  res.locals.info_msg = req.flash('info');
  
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
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  res.locals.statusLabel = (status) => {
    const labels = {
      'draft': 'Borrador',
      'sent': 'Enviada',
      'accepted': 'Aceptada'
    };
    return labels[status] || status;
  };
  
  next();
});

// ============ RUTAS PRINCIPALES ============
const routes = require('./routes/index');
const dashboardRoutes = require('./routes/dashboard');
const authRoutes = require('./routes/auth');
const editorRoutes = require('./routes/editor');
const apiRoutes = require('./routes/api');
const clientRoutes = require('./routes/client');

// Orden IMPORTANTE: authRoutes primero para que /login y /logout funcionen
app.use('/', authRoutes);
app.use('/', routes);
app.use('/', dashboardRoutes);
app.use('/', editorRoutes);
app.use('/', apiRoutes);
app.use('/', clientRoutes); // Magic link routes (public)

// ============ MANEJO DE ERRORES ============

// 404 Handler
app.use((req, res) => {
  res.status(404).render('errors/404', {
    title: 'Página no encontrada',
  });
});

// Error handler global
app.use(errorHandler);

module.exports = app;
