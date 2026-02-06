/**
 * Script de mantenimiento: Corregir is_editing en propuestas
 * Propósito: Asegurar que propuestas con status='sent' tengan is_editing=false
 */

const { pool } = require('./src/config/db');

async function fixProposals() {
  let conn;
  try {
    conn = await pool.getConnection();

    console.log('📋 Verificando propuestas...');
    
    // Ver estado actual
    const current = await conn.query('SELECT id, client_name, status, is_editing FROM proposals');
    console.log('\n📊 Propuestas antes de corregir:');
    console.table(current);

    // Corregir: sent/accepted → is_editing = false
    console.log('\n🔧 Corrigiendo propuestas...');
    const sentResult = await conn.query(
      'UPDATE proposals SET is_editing = FALSE WHERE status IN ("sent", "accepted")'
    );
    console.log(`✅ Actualizadas las propuestas con status sent/accepted: ${sentResult.affectedRows} registros`);

    // Ver estado después
    const after = await conn.query('SELECT id, client_name, status, is_editing FROM proposals');
    console.log('\n✅ Propuestas después de corregir:');
    console.table(after);

    console.log('\n🎉 Mantenimiento completado exitosamente');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (conn) conn.end();
  }
}

fixProposals();
