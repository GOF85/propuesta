#!/usr/bin/env node

/**
 * Script: Seed Test Data
 * Purpose: Inserta datos de prueba para desarrollar y testear el dashboard
 * Usage: npm run seed
 */

require('dotenv').config({ path: '.env.local' });
const { v4: uuid } = require('uuid');
const pool = require('../src/config/db');

const testData = {
  userId: 'test-user-001',
  proposals: [
    {
      id: uuid(),
      client_name: 'Amazon Web Services',
      event_name: 'Tech Summit 2026',
      event_date: '2026-03-15',
      pax: 250,
      status: 'draft',
      total_estimated: 15000.50
    },
    {
      id: uuid(),
      client_name: 'Google Spain',
      event_name: 'Annual Gala Dinner',
      event_date: '2026-04-10',
      pax: 180,
      status: 'sent',
      total_estimated: 12500.75
    },
    {
      id: uuid(),
      client_name: 'Microsoft Iberia',
      event_name: 'Team Building',
      event_date: '2026-02-28',
      pax: 120,
      status: 'accepted',
      total_estimated: 8750.00
    },
    {
      id: uuid(),
      client_name: 'Telefónica S.A.',
      event_name: 'Executive Meeting',
      event_date: '2026-05-20',
      pax: 95,
      status: 'draft',
      total_estimated: 6200.00
    }
  ]
};

async function seedData() {
  let conn;
  try {
    conn = await pool.getConnection();

    console.log('🌱 Iniciando seed de datos de prueba...\n');

    // 1. Verificar que existe el usuario
    const userExists = await conn.query(
      'SELECT id FROM users WHERE id = ?',
      [testData.userId]
    );

    if (!userExists.length) {
      console.log('👤 Insertando usuario de prueba...');
      await conn.query(
        `INSERT INTO users (id, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())`,
        [testData.userId, 'test@example.com', 'password123', 'commercial']
      );
      console.log('✅ Usuario creado: test@example.com\n');
    } else {
      console.log('ℹ️  Usuario ya existe\n');
    }

    // 2. Insertar propuestas
    console.log('📋 Insertando propuestas de prueba...');
    for (const proposal of testData.proposals) {
      const exists = await conn.query(
        'SELECT id FROM proposals WHERE id = ?',
        [proposal.id]
      );

      if (!exists.length) {
        await conn.query(
          `INSERT INTO proposals 
           (id, user_id, unique_hash, client_name, event_name, event_date, pax, status, total_estimated, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            proposal.id,
            testData.userId,
            uuid(),
            proposal.client_name,
            proposal.event_name,
            proposal.event_date,
            proposal.pax,
            proposal.status,
            proposal.total_estimated
          ]
        );
        console.log(`  ✅ ${proposal.client_name} (${proposal.status})`);
      }
    }

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
