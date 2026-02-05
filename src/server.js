/**
 * Entry Point - Servidor Node.js
 * Inicializa DB, Express y escucha en el puerto configurado
 */

require('dotenv').config();

const app = require('./app');
const { initializePool } = require('./config/db');

const PORT = process.env.PORT || 3000;

/**
 * Inicia el servidor
 */
async function startServer() {
  try {
    // Verifica conexión a MariaDB
    await initializePool();
    
    // Inicia Express
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║     🍽️  MICE CATERING PROPOSALS - Servidor Activo    ║
║                                                       ║
║  🔗 http://localhost:${PORT}                        
║  📊 http://localhost:${PORT}/health                 
║  🏗️  Modo: ${process.env.NODE_ENV || 'development'}
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('❌ Fallo al iniciar servidor:', err);
    process.exit(1);
  }
}

startServer();

// Manejo de señales para shutdown elegante
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM recibido - cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n📴 SIGINT recibido - cerrando servidor...');
  process.exit(0);
});
