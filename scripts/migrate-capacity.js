#!/usr/bin/env node

/**
 * Ejecutar migración de capacidad: 3 columnas → 1 columna
 */

const { pool } = require('../src/config/db');

async function runMigration() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Conectado a MariaDB');

    // 1. Verificar columnas actuales
    console.log('\n📋 Columnas actuales en venues:');
    const columns = await conn.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'venues' AND TABLE_SCHEMA = 'catering_proposals'
    `);
    columns.forEach(col => console.log(`  - ${col.COLUMN_NAME}`));

    // 2. Agregar columna capacity si no existe
    console.log('\n🔧 Agregando columna capacity si no existe...');
    try {
      await conn.query(`
        ALTER TABLE venues ADD COLUMN capacity INT DEFAULT 0 AFTER description
      `);
      console.log('✅ Columna capacity agregada');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('ℹ️  Columna capacity ya existe');
      } else {
        throw err;
      }
    }

    // 3. Verificar si existen columnas antiguas
    const oldColumnsResult = await conn.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'venues' AND TABLE_SCHEMA = 'catering_proposals'
      AND COLUMN_NAME IN ('capacity_cocktail', 'capacity_banquet', 'capacity_theater')
    `);

    if (oldColumnsResult.length > 0) {
      console.log('\n📊 Migrando datos de columnas antiguas...');
      const oldColumns = oldColumnsResult.map(r => r.COLUMN_NAME).join(', ');
      console.log(`  Encontradas: ${oldColumns}`);

      // Actualizar capacity con valores de las columnas antiguas
      await conn.query(`
        UPDATE venues 
        SET capacity = COALESCE(capacity_cocktail, capacity_banquet, capacity_theater, 0)
        WHERE capacity = 0
      `);
      console.log('✅ Datos migrados correctamente');

      // Eliminar columnas antiguas
      console.log('\n🗑️  Eliminando columnas antiguas...');
      if (oldColumnsResult.some(r => r.COLUMN_NAME === 'capacity_cocktail')) {
        await conn.query('ALTER TABLE venues DROP COLUMN capacity_cocktail');
        console.log('  ✅ capacity_cocktail eliminada');
      }
      if (oldColumnsResult.some(r => r.COLUMN_NAME === 'capacity_banquet')) {
        await conn.query('ALTER TABLE venues DROP COLUMN capacity_banquet');
        console.log('  ✅ capacity_banquet eliminada');
      }
      if (oldColumnsResult.some(r => r.COLUMN_NAME === 'capacity_theater')) {
        await conn.query('ALTER TABLE venues DROP COLUMN capacity_theater');
        console.log('  ✅ capacity_theater eliminada');
      }
    } else {
      console.log('ℹ️  No hay columnas antiguas, base de datos ya está migrada');
    }

    // 4. Verificar resultado final
    console.log('\n✅ Verificando resultado final...');
    const venues = await conn.query('SELECT id, name, capacity FROM venues LIMIT 5');
    console.log('  Primeras 5 venues:');
    venues.forEach(v => {
      console.log(`    [${v.id}] ${v.name} - Capacidad: ${v.capacity}`);
    });

    console.log('\n✅ Migración completada exitosamente!');
    conn.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en migración:', err.message);
    console.error(err);
    process.exit(1);
  }
}

runMigration();
