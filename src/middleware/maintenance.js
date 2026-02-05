/**
 * Maintenance Mode Middleware
 * Verifica si una propuesta está en modo edición (is_editing = true)
 * Si lo está, el cliente ve una pantalla de espera
 */

const { pool } = require('../config/db');

/**
 * Comprueba el estado de edición de una propuesta
 * @param {req, res, next} params
 */
const checkMaintenanceMode = async (req, res, next) => {
  try {
    const { hash } = req.params;
    
    if (!hash) return next();
    
    const conn = await pool.getConnection();
    const result = await conn.query(
      'SELECT is_editing FROM proposals WHERE unique_hash = ?',
      [hash]
    );
    conn.end();
    
    if (result && result[0] && result[0].is_editing) {
      return res.render('client/maintenance', {
        title: 'Propuesta en edición',
        hash,
      });
    }
    
    next();
  } catch (err) {
    console.error('Error en checkMaintenanceMode:', err);
    next();
  }
};

module.exports = {
  checkMaintenanceMode,
};
