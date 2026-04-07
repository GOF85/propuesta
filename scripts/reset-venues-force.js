#!/usr/bin/env node

/**
 * Script: Limpiar BD de venues (sin confirmación)
 * Uso: node scripts/reset-venues-force.js
 * 
 * ⚠️ ADVERTENCIA: Elimina TODOS los venues de la base de datos SIN CONFIRMACIÓN
 * Solo usar en ambientes de desarrollo/testing
 */

const { pool } = require('../src/config/db');

async function resetVenuesForce() {
  console.log('\n🗑️  Borrando TODOS los venues de la base de datos...');
  
  let conn;
  try {
    conn = await pool.getConnection();
    
    // Obtener cuenta actual
    const [countBefore] = await conn.query('SELECT COUNT(*) as count FROM venues');
    const beforeCount = countBefore.count;

    // Ejecutar DELETE
    const result = await conn.query('DELETE FROM venues');

    console.log(`✅ Eliminados: ${result.affectedRows} venues`);
    console.log(`📊 Venues antes: ${beforeCount}`);

    // Verificar
    const [countAfter] = await conn.query('SELECT COUNT(*) as count FROM venues');
    console.log(`📊 Venues después: ${countAfter.count}`);
    console.log('✨ Base de datos lista para new data\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (conn) conn.end();
  }
}

resetVenuesForce();
