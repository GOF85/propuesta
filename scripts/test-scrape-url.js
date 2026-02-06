/**
 * Test scraping de URL específica
 * node scripts/test-scrape-url.js
 */

const VenueService = require('../src/services/VenueService');

const testUrl = 'https://micecatering.com/espacio/oh-my-club/';

async function testScraping() {
  console.log('🎯 Test de scraping para:');
  console.log(`   ${testUrl}\n`);
  console.log('━'.repeat(80));
  
  try {
    console.log('🚀 Iniciando scraping...\n');
    
    const venueData = await VenueService.scrapeFromCustomUrl(testUrl);
    
    if (!venueData) {
      console.log('❌ No se pudo extraer información del venue\n');
      process.exit(1);
    }
    
    console.log('\n━'.repeat(80));
    console.log('✅ DATOS EXTRAÍDOS:\n');
    console.log('📋 INFORMACIÓN BÁSICA:');
    console.log(`   Nombre: "${venueData.name}"`);
    console.log(`   Descripción: "${venueData.description.substring(0, 200)}${venueData.description.length > 200 ? '...' : ''}"`);
    console.log(`   URL Externa: ${venueData.external_url}`);
    
    console.log('\n👥 CAPACIDADES:');
    console.log(`   Cóctel: ${venueData.capacity_cocktail || 'No detectada'}`);
    console.log(`   Banquete: ${venueData.capacity_banquet || 'No detectada'}`);
    console.log(`   Teatro: ${venueData.capacity_theater || 'No detectada'}`);
    
    console.log('\n📍 UBICACIÓN:');
    console.log(`   Dirección: ${venueData.address || 'No detectada'}`);
    console.log(`   Map iframe: ${venueData.map_iframe ? 'Generado ✓' : 'No generado'}`);
    
    console.log('\n✨ CARACTERÍSTICAS:');
    if (venueData.features && venueData.features.length > 0) {
      venueData.features.forEach((f, i) => {
        console.log(`   ${i + 1}. ${f}`);
      });
    } else {
      console.log('   (Ninguna detectada)');
    }
    
    console.log('\n📸 IMÁGENES:');
    if (venueData.images && venueData.images.length > 0) {
      console.log(`   Total procesadas: ${venueData.images.length}`);
      venueData.images.forEach((img, i) => {
        console.log(`   ${i + 1}. ${img}`);
      });
    } else {
      console.log('   (Ninguna procesada)');
    }
    
    console.log('\n━'.repeat(80));
    console.log('\n📊 CÓMO SE RELLENARÁN LOS CAMPOS EN LA BD:\n');
    
    console.log('INSERT INTO venues (');
    console.log('  name,              →', `"${venueData.name}"`);
    console.log('  description,       →', `"${venueData.description.substring(0, 80)}..."`);
    console.log('  capacity_cocktail, →', venueData.capacity_cocktail || 'NULL');
    console.log('  capacity_banquet,  →', venueData.capacity_banquet || 'NULL');
    console.log('  capacity_theater,  →', venueData.capacity_theater || 'NULL');
    console.log('  features,          →', venueData.features && venueData.features.length > 0 ? `JSON array con ${venueData.features.length} items` : 'NULL');
    console.log('  address,           →', venueData.address ? `"${venueData.address}"` : 'NULL');
    console.log('  external_url,      →', `"${venueData.external_url}"`);
    console.log('  images,            →', venueData.images && venueData.images.length > 0 ? `JSON array con ${venueData.images.length} rutas` : 'NULL');
    console.log('  map_iframe         →', venueData.map_iframe ? 'HTML iframe generado' : 'NULL');
    console.log(')');
    
    console.log('\n✅ Test completado exitosamente!\n');
    process.exit(0);
    
  } catch (err) {
    console.error('\n❌ ERROR en scraping:');
    console.error(`   ${err.message}`);
    console.error('\n📌 Stack trace:');
    console.error(err.stack);
    console.log('\n💡 NOTA: Si el scraping falla, puedes usar el formulario manual en /admin/venues\n');
    process.exit(1);
  }
}

// Ejecutar test
testScraping();
