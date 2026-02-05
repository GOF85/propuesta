/**
 * Authentication Middleware
 * Verifica que el usuario esté autenticado y tenga la sesión activa
 */

const authenticateUser = (req, res, next) => {
  if (!req.session.user) {
    req.flash('error', 'Debes iniciar sesión');
    return res.redirect('/login');
  }
  next();
};

/**
 * Autorización por rol
 * @param {string} requiredRole - 'admin' o 'commercial'
 */
const authorizeRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.session.user) {
      req.flash('error', 'Debes iniciar sesión');
      return res.redirect('/login');
    }
    if (req.session.user.role !== requiredRole && requiredRole !== '*') {
      req.flash('error', 'No tienes permisos para acceder a esta página');
      return res.status(403).render('errors/403', {
        title: 'Acceso denegado',
      });
    }
    next();
  };
};

/**
 * Error Handler Middleware
 * Captura y formatea errores de las rutas
 */
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  
  console.error(`[ERROR ${status}] ${message}`, err);
  
  // Si es una petición AJAX, devuelve JSON
  if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    return res.status(status).json({ error: message });
  }
  
  // Si es una página normal, renderiza error view
  res.status(status).render('errors/500', {
    title: 'Error del servidor',
    message: process.env.NODE_ENV === 'production' ? 'Error interno' : message,
  });
};

module.exports = {
  authenticateUser,
  authorizeRole,
  errorHandler,
};
