/**
 * Test scraping de URL específica - BLOKE
 * node scripts/test-scrape-bloke.js
 */

const VenueService = require('../src/services/VenueService');

const testUrl = 'https://micecatering.com/espacio/bloke/';

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
    console.log('✅ DATOS SCRAPEADOS:\n');
    
    console.log('📋 CAMPOS QUE SE RELLENARÁN EN LA BD:\n');
    console.log(`1. name`);
    console.log(`   → "${venueData.name}"\n`);
    
    console.log(`2. description`);
    console.log(`   → "${venueData.description.substring(0, 100)}${venueData.description.length > 100 ? '...' : ''}"\n`);
    
    console.log(`3. capacity_cocktail`);
    console.log(`   → NULL (manual desde BD)\n`);
    
    console.log(`4. capacity_banquet`);
    console.log(`   → NULL (manual desde BD)\n`);
    
    console.log(`5. capacity_theater`);
    console.log(`   → NULL (manual desde BD)\n`);
    
    console.log(`6. address`);
    console.log(`   → "${venueData.address || 'No detectada'}"\n`);
    
    console.log(`7. features (${venueData.features.length} características)`);
    venueData.features.forEach((f, i) => {
      console.log(`   ${i + 1}. ${f}`);
    });
    console.log();
    
    console.log(`8. images (${venueData.images.length} imágenes)`);
    console.log(`   Carpeta: /uploads/venue-[hash]/`);
    console.log(`   Contenido: ${venueData.images.length} archivos .webp`);
    if (venueData.images.length > 0) {
      console.log(`   Primeras 3:`)
      venueData.images.slice(0, 3).forEach((img, i) => {
        console.log(`     ${i + 1}. ${img.split('/').pop()}`);
      });
      if (venueData.images.length > 3) {
        console.log(`     ... (+ ${venueData.images.length - 3} más)`);
      }
    }
    console.log();
    
    console.log(`9. external_url`);
    console.log(`   → "${venueData.external_url}"\n`);
    
    console.log(`10. map_iframe`);
    console.log(`   → ${venueData.map_iframe ? 'Generado ✓' : 'NULL'}\n`);
    
    console.log('━'.repeat(80));
    console.log('\n📊 INSERT FINAL EN BD:\n');
    
    console.log(`INSERT INTO venues (`);
    console.log(`  name, description, capacity_cocktail, capacity_banquet,`);
    console.log(`  capacity_theater, features, address, external_url, images, map_iframe`);
    console.log(`)`);
    console.log(`VALUES (`);
    console.log(`  '${venueData.name}',`);
    console.log(`  '${venueData.description.substring(0, 80)}...',`);
    console.log(`  NULL,`);
    console.log(`  NULL,`);
    console.log(`  NULL,`);
    console.log(`  '${JSON.stringify(venueData.features)}',`);
    console.log(`  '${venueData.address}',`);
    console.log(`  '${venueData.external_url}',`);
    console.log(`  '${JSON.stringify(venueData.images)}',`);
    console.log(`  ${venueData.map_iframe ? "'[iframe HTML generado]'" : 'NULL'}`);
    console.log(`);`);
    
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
