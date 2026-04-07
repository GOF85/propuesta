
const fs = require('fs');
const path = require('path');
const { pool } = require('./src/config/db');

async function importFromTemplate() {
  try {
    const templatePath = path.join(__dirname, 'data/venues-template.json');
    if (!fs.existsSync(templatePath)) {
      console.log('Template not found');
      return;
    }

    const venues = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    console.log(`Importing ${venues.length} venues from template...`);

    const conn = await pool.getConnection();
    for (const v of venues) {
      try {
        await conn.query(
          'INSERT INTO venues (name, description, address, external_url, images) VALUES (?, ?, ?, ?, ?)',
          [v.name, v.description, v.address, v.external_url, JSON.stringify(v.images || [])]
        );
        console.log(`✅ ${v.name}`);
      } catch (err) {
        console.warn(`❌ ${v.name}: ${err.message}`);
      }
    }
    conn.end();
    console.log('Done.');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

importFromTemplate();
