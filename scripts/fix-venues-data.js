#!/usr/bin/env node
/**
 * Script para limpiar datos corruptos en tabla venues
 * Problema: Algunos campos features/images no son JSON válido
 * Solución: Convertir a JSON válido o limpiar
 */

const { pool } = require('../src/config/db');

async function fixVenuesData() {
  const conn = await pool.getConnection();
  
  try {
    console.log('🔍 Verificando y limpiando datos de venues...\n');
    
    // Obtener todos los venues
    const venues = await conn.query('SELECT id, name, features, images FROM venues');
    
    if (venues.length === 0) {
      console.log('ℹ️  No hay venues en la base de datos');
      conn.end();
      await pool.end();
      return;
    }
    
    let fixed = 0;
    
    // Procesar cada venue
    for (const venue of venues) {
      let needsUpdate = false;
      let newFeatures = venue.features;
      let newImages = venue.images;
      
      // Validar y corregir features
      if (venue.features && typeof venue.features === 'string') {
        try {
          JSON.parse(venue.features);
          // JSON válido, no necesita cambio
        } catch (err) {
          console.log(`⚠️  Venue ${venue.id} (${venue.name}): features inválido`);
          console.log(`   Antes: ${venue.features.substring(0, 60)}`);
          
          // Si comienza con [ o {, intentar parsear parcialmente
          // Si no, tratarlo como un string simple y convertir a array
          if (!venue.features.startsWith('[') && !venue.features.startsWith('{')) {
            // Convertir string simple a array JSON
            const items = venue.features
              .split(',')
              .map(s => s.trim())
              .filter(s => s.length > 0 && s !== 'null');
            
            newFeatures = JSON.stringify(items);
            console.log(`   Después: ${newFeatures.substring(0, 60)}`);
            needsUpdate = true;
          } else {
            // Intentar limpiar y parsear
            try {
              const cleaned = venue.features.replace(/'/g, '"');
              JSON.parse(cleaned);
              newFeatures = cleaned;
              console.log(`   Corregido: ${newFeatures.substring(0, 60)}`);
              needsUpdate = true;
            } catch (e2) {
              // Si sigue siendo inválido, vaciar
              console.log(`   ERROR GRAVE: No se puede parsear. Vaciando.`);
              newFeatures = JSON.stringify([]);
              needsUpdate = true;
            }
          }
        }
      }
      
      // Validar y corregir images
      if (venue.images && typeof venue.images === 'string') {
        try {
          JSON.parse(venue.images);
          // JSON válido, no necesita cambio
        } catch (err) {
          console.log(`⚠️  Venue ${venue.id} (${venue.name}): images inválido`);
          console.log(`   Antes: ${venue.images.substring(0, 60)}`);
          
          // Mismo tratamiento que features
          if (!venue.images.startsWith('[') && !venue.images.startsWith('{')) {
            const items = venue.images
              .split(',')
              .map(s => s.trim())
              .filter(s => s.length > 0 && s !== 'null');
            
            newImages = JSON.stringify(items);
            console.log(`   Después: ${newImages.substring(0, 60)}`);
            needsUpdate = true;
          } else {
            try {
              const cleaned = venue.images.replace(/'/g, '"');
              JSON.parse(cleaned);
              newImages = cleaned;
              console.log(`   Corregido: ${newImages.substring(0, 60)}`);
              needsUpdate = true;
            } catch (e2) {
              console.log(`   ERROR GRAVE: No se puede parsear. Vaciando.`);
              newImages = JSON.stringify([]);
              needsUpdate = true;
            }
          }
        }
      }
      
      // Actualizar si fue necesario
      if (needsUpdate) {
        await conn.query(
          'UPDATE venues SET features = ?, images = ? WHERE id = ?',
          [newFeatures, newImages, venue.id]
        );
        fixed++;
        console.log(`✅ Actualizado\n`);
      }
    }
    
    console.log('\n✅ Limpieza completada');
    console.log(`📊 ${fixed} venues corregidos de ${venues.length} total`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    conn.end();
    await pool.end();
  }
}

fixVenuesData().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
