/**
 * MariaDB Connection Pool Configuration
 * Utiliza prepared statements para seguridad contra inyección SQL
 * Contexto: Backend-only, servicios manejan todas las queries
 */

const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'catering_user',
  password: process.env.DB_PASS || 'secure_password',
  database: process.env.DB_NAME || 'catering_proposals',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInterval: 30000,
  connectTimeout: 10000,
});

/**
 * Verifica conexión al iniciar la app
 * @throws Error si no puede conectarse a la BD
 */
async function initializePool() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Conexión a MariaDB exitosa');
    conn.end();
  } catch (err) {
    console.error('❌ Error de conexión a MariaDB:', err.message);
    process.exit(1);
  }
}

module.exports = {
  pool,
  initializePool,
};
