#!/usr/bin/env node
/**
 * Script para verificar y crear usuarios necesarios
 * Soluciona el error: "Cannot add or update a child row: a foreign key constraint fails"
 */

const { pool } = require('../src/config/db');
const bcrypt = require('bcryptjs');

async function fixUsers() {
  const conn = await pool.getConnection();
  
  try {
    console.log('🔍 Verificando usuarios existentes...\n');
    
    // Listar usuarios actuales
    const users = await conn.query('SELECT id, name, email, role FROM users ORDER BY id');
    
    if (users.length === 0) {
      console.log('⚠️  No hay usuarios en la base de datos\n');
    } else {
      console.log('📋 Usuarios existentes:');
      users.forEach(u => {
        console.log(`   ID: ${u.id} | ${u.name} (${u.email}) | Rol: ${u.role}`);
      });
      console.log('');
    }
    
    // Verificar si existe usuario con ID 12
    const user12 = users.find(u => u.id === 12);
    
    if (!user12) {
      console.log('❌ Usuario con ID 12 no existe');
      console.log('✅ Creando usuario con ID 12...\n');
      
      const password = await bcrypt.hash('admin123', 10);
      
      // Insertar usuario con ID específico
      await conn.query(
        'INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [12, 'Admin User', 'admin@micecatering.com', password, 'admin']
      );
      
      console.log('✅ Usuario creado exitosamente:');
      console.log('   ID: 12');
      console.log('   Name: Admin User');
      console.log('   Email: admin@micecatering.com');
      console.log('   Password: admin123');
      console.log('   Rol: admin\n');
    } else {
      console.log(`✅ Usuario ID 12 existe: ${user12.name} (${user12.email})\n`);
    }
    
    // Verificar si hay al menos un usuario admin
    const adminUsers = users.filter(u => u.role === 'admin');
    
    if (adminUsers.length === 0 && !user12) {
      console.log('⚠️  No hay usuarios admin. Creando usuario admin por defecto...\n');
      
      const password = await bcrypt.hash('admin123', 10);
      await conn.query(
        'INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, NOW())',
        ['Admin User', 'admin@micecatering.com', password, 'admin']
      );
      
      console.log('✅ Usuario admin creado con credenciales:');
      console.log('   Name: Admin User');
      console.log('   Email: admin@micecatering.com');
      console.log('   Password: admin123\n');
    }
    
    // Listar usuarios finales
    const finalUsers = await conn.query('SELECT id, name, email, role FROM users ORDER BY id');
    console.log('📊 Estado final de usuarios:');
    finalUsers.forEach(u => {
      console.log(`   ID: ${u.id} | ${u.name} (${u.email}) | Rol: ${u.role}`);
    });
    
    console.log('\n✅ Verificación completada. Ahora puedes crear propuestas.');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    conn.end();
    await pool.end();
  }
}

fixUsers().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
