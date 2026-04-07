require('dotenv').config();
const { pool } = require('../src/config/db');

async function fixMaps() {
  try {
    const venues = await pool.query("SELECT id, address, name FROM venues WHERE map_iframe LIKE '%openstreetmap.org%'");
    console.log(`Encontrados ${venues.length} venues con mapas OSM incorrectos.`);
    
    for (const venue of venues) {
      if (!venue.address) {
        console.warn(`Venue ${venue.name} no tiene dirección para generar mapa.`);
        continue;
      }
      
      const encoded = encodeURIComponent(venue.address);
      const newIframe = `<iframe width="100%" height="400" style="border:0;" src="https://maps.google.com/maps?q=${encoded}&t=&z=15&ie=UTF8&iwloc=&output=embed" allowfullscreen="" loading="lazy"></iframe>`;
      
      await pool.query('UPDATE venues SET map_iframe = ? WHERE id = ?', [newIframe, venue.id]);
      console.log(`✅ Mapa corregido para: ${venue.name}`);
    }
  } catch (err) {
    console.error('Error actualizando mapas:', err);
  } finally {
    process.exit(0);
  }
}

fixMaps();
