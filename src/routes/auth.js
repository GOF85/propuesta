/**
 * Authentication Routes (Login / Register)
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// ============ GET /login - Login Page ============
router.get('/login', (req, res) => {
  // Devolver página de login HTML inline  
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Iniciar Sesión - MICE Catering</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
  </style>
</head>
<body class="min-h-screen flex items-center justify-center">
  <div class="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
    <h1 class="text-3xl font-bold text-center mb-8">🍽️ MICE Catering</h1>
    <form method="POST" action="/login" class="space-y-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
        <input type="email" name="email" placeholder="tu@email.com" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
        <input type="password" name="password" placeholder="••••••••" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required />
      </div>
      <button type="submit" class="w-full bg-purple-600 text-white font-semibold py-2 rounded-lg hover:bg-purple-700 transition">Entrar</button>
    </form>
    <div class="mt-6 p-3 bg-blue-50 rounded border border-blue-200 text-sm">
      <strong>🧪 Demo:</strong> test@example.com / password123
    </div>
  </div>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// ============ POST /login - Login Submit ============
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', 'Email o contraseña inválidos');
    return res.redirect('/login');
  }

  const { email, password } = req.body;

  try {
    // TODO: Implementar autenticación con BD en Phase 2
    // Por ahora: credentials hardcodeados para testing
    if (email === 'test@example.com' && password === 'password123') {
      req.session.user = {
        id: 12,
        name: 'Test User',
        email: email,
        role: 'commercial',
      };
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          req.flash('error', 'Error al guardar sesión');
          return res.redirect('/login');
        }
        req.flash('success', 'Bienvenido');
        res.redirect('/dashboard');
      });
    } else {
      req.flash('error', 'Credenciales incorrectas');
      res.redirect('/login');
    }
  } catch (err) {
    console.error('Login error:', err);
    req.flash('error', 'Error en el servidor');
    res.redirect('/login');
  }
});

// ============ GET /logout - Logout ============
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.redirect('/dashboard');
    }
    req.flash('success', 'Sesión cerrada');
    res.redirect('/login');
  });
});

module.exports = router;
