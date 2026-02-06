#!/usr/bin/env node

/**
 * Script: Seed Test Data
 * Purpose: Inserta datos de prueba para desarrollar y testear el dashboard
 * Usage: npm run seed
 */

require('dotenv').config({ path: '.env.local' });
const { v4: uuid } = require('uuid');
const { pool } = require('../src/config/db');

const testData = {
  userId: 'test-user-001',
  proposals: [
    {
      id: uuid(),
      client_name: 'Amazon Web Services',
      event_date: '2026-03-15',
      pax: 250,
      status: 'draft'
    },
    {
      id: uuid(),
      client_name: 'Google Spain',
      event_date: '2026-04-10',
      pax: 180,
      status: 'sent'
    },
    {
      id: uuid(),
      client_name: 'Microsoft Iberia',
      event_date: '2026-02-28',
      pax: 120,
      status: 'accepted'
    },
    {
      id: uuid(),
      client_name: 'Telefónica S.A.',
      event_date: '2026-05-20',
      pax: 95,
      status: 'draft'
    }
  ]
};

async function seedData() {
  let conn;
  try {
    // PRIMERA CONEXIÓN: usuario
    conn = await pool.getConnection();
    console.log('🌱 Iniciando seed de datos de prueba...\n');
    await conn.query(
      'DELETE FROM users WHERE email = ? AND id != ?',
      ['test@example.com', testData.userId]
    );
    const userExists = await conn.query(
      'SELECT id FROM users WHERE id = ?',
      [testData.userId]
    );
    if (!userExists.length) {
      console.log('👤 Insertando usuario de prueba...');
      try {
        await conn.query(
          `INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())`,
          [testData.userId, 'Test User', 'test@example.com', 'password123', 'commercial']
        );
        console.log('✅ Usuario creado: test@example.com\n');
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY' || (err.errno === 1062)) {
          console.log('ℹ️  Usuario ya existe (email duplicado)\n');
        } else {
          throw err;
        }
      }
    } else {
      console.log('ℹ️  Usuario ya existe\n');
    }
    await conn.end();

    // SEGUNDA CONEXIÓN: propuestas
    conn = await pool.getConnection();
    console.log('📋 Insertando propuestas de prueba...');
    for (const proposal of testData.proposals) {
      const exists = await conn.query(
        'SELECT id FROM proposals WHERE id = ?',
        [proposal.id]
      );
      if (!exists.length) {
        await conn.query(
          `INSERT INTO proposals 
           (id, user_id, unique_hash, client_name, event_date, pax, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            proposal.id,
            testData.userId,
            uuid(),
            proposal.client_name,
            proposal.event_date,
            proposal.pax,
            proposal.status
          ]
        );
        console.log(`  ✅ ${proposal.client_name} (${proposal.status})`);
      }
    }
    await conn.end();

    console.log('\n✨ Seed completado exitosamente!\n');
    console.log('📊 Datos insertados:');
    console.log(`   - Usuario: ${testData.userId} (test@example.com)`);
    console.log(`   - Propuestas: ${testData.proposals.length}`);
    console.log('\n🚀 Accede a: http://localhost:3000/dashboard');
    console.log('   Usuario: test@example.com');
    console.log('   Contraseña: password123\n');

  } catch (err) {
    console.error('❌ Error durante seed:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
    process.exit(0);
  }
}

seedData();
