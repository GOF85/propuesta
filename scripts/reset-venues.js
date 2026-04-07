#!/usr/bin/env node

/**
 * Script: Limpiar toda la base de datos de venues
 * Uso: node scripts/reset-venues.js
 * 
 * ⚠️ ADVERTENCIA: Esta operación es IRREVERSIBLE
 * Elimina TODOS los venues de la base de datos
 */

const { pool } = require('../src/config/db');

async function resetVenues() {
  console.log('\n⚠️  ALERTA: Esta operación eliminará TODOS los venues de la BD\n');
  
  // Pedir confirmación via stdin
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('¿Estás seguro? Escribe "SÍ" para confirmar: ', async (answer) => {
    rl.close();

    if (answer.toUpperCase() !== 'SÍ') {
      console.log('\n❌ Operación cancelada\n');
      process.exit(0);
    }

    let conn;
    try {
      conn = await pool.getConnection();
      
      // Obtener cuenta actual
      const [countBefore] = await conn.query('SELECT COUNT(*) as count FROM venues');
      const beforeCount = countBefore.count;

      console.log(`\n🔄 Eliminando ${beforeCount} venues de la base de datos...`);

      // Ejecutar DELETE
      const result = await conn.query('DELETE FROM venues');

      console.log(`✅ Completado: ${result.affectedRows} venues eliminados\n`);

      // Verificar que quedó vacío
      const [countAfter] = await conn.query('SELECT COUNT(*) as count FROM venues');
      console.log(`✨ Venues restantes en BD: ${countAfter.count}\n`);

      process.exit(0);
    } catch (err) {
      console.error('\n❌ Error:', err.message, '\n');
      process.exit(1);
    } finally {
      if (conn) conn.end();
    }
  });
}

// Ejecutar
resetVenues();
