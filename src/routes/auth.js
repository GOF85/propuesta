/**
 * Authentication Routes (Login / Register)
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// ============ GET /login - Login Page ============
router.get('/login', (req, res) => {
  res.render('auth/login', {
    title: 'Iniciar Sesión',
    error_msg: req.flash('error'),
    success_msg: req.flash('success')
  });
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
