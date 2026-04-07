/**
 * Script: Crear venues de ejemplo para testing
 * Uso: node scripts/create-sample-venues.js
 * Propósito: Poblar BD con 3 venues de ejemplo para visualización
 */

const { pool } = require('../src/config/db');

const sampleVenues = [
  {
    name: 'ESPACIO MADRID - Sala Goya',
    description: 'Espacio vanguardista en pleno centro de Madrid. Sala polivalente con luz natural y acabados premium. Perfecta para eventos corporativos, presentaciones y cenas de gala. Incluye sistema de sonido profesional y proyección 4K.',
    address: 'Calle Alcalá 123, 28014 Madrid',
    external_url: 'https://www.micecatering.com/venues/espacio-madrid-goya',
    images: JSON.stringify([]),
    map_iframe: null
  },
  {
    name: 'HOTEL PALACIO REAL - Salón Versalles',
    description: 'Salón histórico con arquitectura del siglo XIX. Techos altos con molduras clásicas, arañas de cristal y ventanales con vistas al Palacio Real. Ideal para bodas, eventos de lujo y celebraciones exclusivas.',
    address: 'Plaza de Oriente 7, 28013 Madrid',
    external_url: 'https://www.micecatering.com/venues/hotel-palacio-versalles',
    images: JSON.stringify([]),
    map_iframe: null
  },
  {
    name: 'ROOFTOP BCN - Sky Terrace',
    description: 'Terraza exclusiva en la azotea con vistas 360° de Barcelona. Ambiente cosmopolita con decoración lounge y jardín vertical. Equipada con bar completo, zona chill-out y DJ booth. Perfecta para eventos outdoor y afterworks.',
    address: 'Passeig de Gràcia 88, 08008 Barcelona',
    external_url: 'https://www.micecatering.com/venues/rooftop-bcn-sky',
    images: JSON.stringify([]),
    map_iframe: null
  }
];

async function createSampleVenues() {
  let conn;
  try {
    console.log('🚀 Creando venues de ejemplo...\n');
    
    conn = await pool.getConnection();

    for (const venue of sampleVenues) {
      try {
        const result = await conn.query(
          `INSERT INTO venues 
           (name, description, address, external_url, images, map_iframe)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            venue.name,
            venue.description,
            venue.address,
            venue.external_url,
            venue.images,
            venue.map_iframe
          ]
        );

        console.log(`✅ Venue creado: ${venue.name} (ID: ${result.insertId})`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  Ya existe: ${venue.name}`);
        } else {
          console.error(`❌ Error creando ${venue.name}:`, err.message);
        }
      }
    }

    // Verificar total
    const [count] = await conn.query('SELECT COUNT(*) as total FROM venues');
    console.log(`\n✅ Total venues en BD: ${count.total}`);
    console.log('\n🎉 Proceso completado!');
    console.log('👉 Accede a: http://localhost:3000/admin/venues\n');

  } catch (err) {
    console.error('💥 Error fatal:', err.message);
    process.exit(1);
  } finally {
    if (conn) conn.end();
    process.exit(0);
  }
}

// Ejecutar
createSampleVenues();
