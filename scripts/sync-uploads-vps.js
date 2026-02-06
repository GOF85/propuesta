#!/usr/bin/env node
/**
 * sync-uploads-vps.js
 * Sincroniza carpeta /public/uploads al VPS después del scraping
 * Uso: node scripts/sync-uploads-vps.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const VPS_HOST = 'root@188.95.113.225';
const VPS_PATH = '/var/www/vhosts/micecatering.eu/propuesta.micecatering.eu/public/uploads';
const SSH_PASS = 'Kbmef9Pke9u36VHh';
const LOCAL_PATH = path.join(__dirname, '../public/uploads');

async function syncUploadsToVPS() {
  try {
    console.log('📤 Sincronizando uploads con VPS...');

    // Verificar que la carpeta local existe
    if (!fs.existsSync(LOCAL_PATH)) {
      console.error('❌ Carpeta local no existe:', LOCAL_PATH);
      process.exit(1);
    }

    // Contar archivos webp a sincronizar
    const files = execSync(`find ${LOCAL_PATH} -name "*.webp" 2>/dev/null | wc -l`).toString().trim();
    console.log(`📋 ${files} archivos .webp encontrados para sincronizar`);

    // Ejecutar rsync con sshpass
    const rsyncCmd = `
      export SSHPASS="${SSH_PASS}"
      sshpass -e rsync -avz \\
        --filter="+ *.webp" \\
        --filter="- *" \\
        --delete \\
        "${LOCAL_PATH}/" \\
        "${VPS_HOST}:${VPS_PATH}/" \\
        --rsh="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" 2>&1
    `;

    console.log('🔄 Ejecutando rsync...');
    const output = execSync(rsyncCmd, { shell: '/bin/bash', stdio: 'pipe' }).toString();

    if (output.includes('sent') || output.includes('received')) {
      console.log('✅ Uploads sincronizados al VPS');
      console.log(`   Carpeta remota: ${VPS_PATH}`);
      return true;
    } else {
      // rsync podría no mostrar stats si no hay cambios
      console.log('✅ Sincronización completada (sin cambios o completada)');
      return true;
    }

  } catch (err) {
    console.error('❌ Error sincronizando:', err.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  syncUploadsToVPS();
}

module.exports = { syncUploadsToVPS };
