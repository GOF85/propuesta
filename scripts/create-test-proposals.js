/**
 * Script para crear propuestas de prueba
 * Uso: node scripts/create-test-proposals.js
 */

const { pool } = require('../src/config/db');
const { v4: uuidv4 } = require('uuid');

async function createTestProposals() {
  const conn = await pool.getConnection();
  try {
    // Verificar si hay usuarios
    const users = await conn.query('SELECT id, email, name FROM users LIMIT 1');
    if (!users || users.length === 0) {
      console.log('❌ ERROR: No hay usuarios en la BD.');
      console.log('   Crea uno con: npm run seed o manualmente en /auth/register');
      process.exit(1);
    }
    
    const userId = users[0].id;
    console.log(`✅ Usuario encontrado: ${users[0].email} (${users[0].name})\n`);
    
    // Crear 3 propuestas de prueba
    const proposals = [
      {
        client_name: 'Conferencia Tecnológica 2026',
        event_date: '2026-03-15',
        pax: 150,
        brand_color: '#31713D',
        status: 'draft'
      },
      {
        client_name: 'Cena de Gala Corporativa',
        event_date: '2026-04-20',
        pax: 80,
        brand_color: '#31713D',
        status: 'sent'
      },
      {
        client_name: 'Presentación de Producto',
        event_date: '2026-05-10',
        pax: 200,
        brand_color: '#31713D',
        status: 'draft'
      }
    ];
    
    console.log('Creando propuestas de prueba...\n');
    
    for (let p of proposals) {
      const hash = uuidv4().replace(/-/g, '').substring(0, 32);
      const result = await conn.query(
        `INSERT INTO proposals (user_id, unique_hash, client_name, event_date, pax, brand_color, status, is_editing) 
         VALUES (?, ?, ?, ?, ?, ?, ?, true)`,
        [userId, hash, p.client_name, p.event_date, p.pax, p.brand_color, p.status]
      );
      console.log(`✅ Propuesta ID ${result.insertId} - ${p.client_name} (${p.status})`);
    }
    
    console.log('\n✨ 3 propuestas de prueba creadas exitosamente');
    console.log('\n📍 Puedes acceder a ellas en:');
    console.log('   https://propuesta.micecatering.eu/dashboard');
    
  } catch (err) {
    console.error('❌ ERROR:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    conn.end();
    process.exit(0);
  }
}

createTestProposals();
