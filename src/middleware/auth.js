/**
 * Authentication Middleware
 * Verifica que el usuario esté autenticado y tenga la sesión activa
 */

const authenticateUser = (req, res, next) => {
  if (!req.session.user) {
    // Para API requests, devolver JSON
    if (req.xhr || req.headers.accept?.includes('application/json') || req.path.startsWith('/api/')) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado. Debes iniciar sesión.'
      });
    }
    // Para páginas, redirigir a login
    req.flash('error', 'Debes iniciar sesión');
    return res.redirect('/login');
  }
  
  // Establecer req.user para compatibilidad con controladores que lo esperan
  const sUser = req.session.user;
  req.user = {
    id: sUser.id || sUser.ID,
    role: sUser.role || sUser.ROLE,
    name: sUser.name || sUser.NAME || sUser.username,
    email: sUser.email || sUser.EMAIL
  };
  
  next();
};

/**
 * Autorización por rol
 * @param {string} requiredRole - 'admin' o 'commercial'
 */
const authorizeRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.session.user) {
      // Para API requests, devolver JSON
      if (req.xhr || req.headers.accept?.includes('application/json') || req.path.startsWith('/api/')) {
        return res.status(401).json({
          success: false,
          error: 'No autenticado. Debes iniciar sesión.'
        });
      }
      // Para páginas, redirigir a login
      req.flash('error', 'Debes iniciar sesión');
      return res.redirect('/login');
    }
    if (req.session.user.role !== requiredRole && requiredRole !== '*') {
      // Para API requests, devolver JSON
      if (req.xhr || req.headers.accept?.includes('application/json') || req.path.startsWith('/api/')) {
        return res.status(403).json({
          success: false,
          error: 'No tienes permisos para realizar esta acción.'
        });
      }
      // Para páginas, renderizar error
      req.flash('error', 'No tienes permisos para acceder a esta página');
      return res.status(403).render('errors/403', {
        title: 'Acceso denegado',
      });
    }

    // Establecer req.user para compatibilidad
    req.user = req.session.user;

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
  
  // Si ya se enviaron las cabeceras, no podemos hacer mucho más
  if (res.headersSent) {
    return next(err);
  }

  // Si es una petición AJAX o espera JSON, devuelve JSON
  if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
    return res.status(status).json({ success: false, error: message });
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
