/**
 * Script de prueba: Crear una propuesta de prueba para el editor
 * Uso: node scripts/create-test-proposal.js
 */

require('dotenv').config({ path: '.env.local' });
const { pool } = require('../src/config/db');

async function createTestProposal() {
  let conn;
  try {
    conn = await pool.getConnection();

    // 1. Crear usuario de prueba (si no existe)
    const [existingUser] = await conn.query(
      'SELECT id FROM users WHERE email = ?',
      ['test@micecatering.com']
    );

    let userId;
    if (existingUser && existingUser.length > 0) {
      userId = existingUser[0].id;
      console.log(`✅ Usuario existente encontrado: ID ${userId}`);
    } else {
      const userResult = await conn.query(
        `INSERT INTO users (email, password, name, role, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [
          'test@micecatering.com',
          'hashed_password_here',
          'Test User',
          'commercial'
        ]
      );
      userId = userResult.insertId;
      console.log(`✅ Usuario creado: ID ${userId}`);
    }

    // 2. Crear propuesta de prueba
    const [existingProposal] = await conn.query(
      'SELECT id FROM proposals WHERE client_name = ?',
      ['Cliente Test']
    );

    let proposalId;
    if (existingProposal && existingProposal.length > 0) {
      proposalId = existingProposal[0].id;
      console.log(`✅ Propuesta existente encontrada: ID ${proposalId}`);
    } else {
      const proposalResult = await conn.query(
        `INSERT INTO proposals 
         (user_id, unique_hash, client_name, client_email, event_date, pax, status, is_editing, total_base, total_vat, total_final, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          userId,
          'test' + Date.now(),
          'Cliente Test',
          'cliente@test.com',
          new Date().toISOString().split('T')[0],
          50,
          'draft',
          true,
          5000.00,
          500.00,
          5500.00
        ]
      );
      proposalId = proposalResult.insertId;
      console.log(`✅ Propuesta creada: ID ${proposalId}`);
    }

    // 3. Obtener o crear venues de prueba
    const [venues] = await conn.query(
      'SELECT id FROM venues LIMIT 1'
    );

    if (venues && venues.length > 0) {
      const venueId = venues[0].id;
      
      // Agregar venue a la propuesta (si no existe)
      const [existingVenue] = await conn.query(
        'SELECT id FROM proposal_venues WHERE proposal_id = ? AND venue_id = ?',
        [proposalId, venueId]
      );
      
      if (!existingVenue || existingVenue.length === 0) {
        await conn.query(
          'INSERT INTO proposal_venues (proposal_id, venue_id) VALUES (?, ?)',
          [proposalId, venueId]
        );
        console.log(`✅ Venue agregado a la propuesta`);
      }
    }

    // 4. Crear servicios de prueba
    const services = [
      { title: 'Welcome Coffee', type: 'gastronomy' },
      { title: 'Almuerzo de Gala', type: 'gastronomy' },
      { title: 'Transporte', type: 'logistics' }
    ];

    for (const service of services) {
      const [existing] = await conn.query(
        'SELECT id FROM proposal_services WHERE proposal_id = ? AND title = ?',
        [proposalId, service.title]
      );

      if (!existing || existing.length === 0) {
        await conn.query(
          `INSERT INTO proposal_services (proposal_id, title, type, vat_rate, order_index)
           VALUES (?, ?, ?, ?, ?)`,
          [proposalId, service.title, service.type, 21, Math.random()]
        );
        console.log(`✅ Servicio agregado: ${service.title}`);
      }
    }

    console.log(`
╔════════════════════════════════════════════════════════╗
║        ✅ DATOS DE PRUEBA CREADOS EXITOSAMENTE       ║
╠════════════════════════════════════════════════════════╣
║  Usuario ID:         ${userId}
║  Propuesta ID:       ${proposalId}
║  Email de prueba:    test@micecatering.com
║  
║  URL de prueba:
║  http://localhost:3000/proposal/${proposalId}/edit
║════════════════════════════════════════════════════════╝
    `);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (conn) conn.end();
  }
}

// Ejecutar
createTestProposal();
