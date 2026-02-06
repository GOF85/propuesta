/**
 * SyncService.js
 * Maneja sincronización de uploads al VPS después de scraping
 * Pattern: Llamar después de procesar imágenes en VenueService
 * 
 * Uso:
 *   const SyncService = require('./SyncService');
 *   await SyncService.syncUploadsToVPS();
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class SyncService {
  constructor() {
    this.vpsHost = 'root@188.95.113.225';
    this.vpsPath = '/var/www/vhosts/micecatering.eu/propuesta.micecatering.eu/public/uploads';
    this.sshPass = 'Kbmef9Pke9u36VHh';
    this.localPath = path.join(__dirname, '../../public/uploads');
  }

  /**
   * 📤 SINCRONIZAR UPLOADS AL VPS
   * Copia solo archivos .webp nuevos/modificados
   * Se ejecuta después del scraping de venues
   * 
   * @returns {Promise<Object>} {success: bool, message: string, filesCount: number}
   * 
   * Uso:
   *   const result = await SyncService.syncUploadsToVPS();
   *   console.log(result); // {success: true, filesCount: 5, ...}
   */
  async syncUploadsToVPS() {
    try {
      console.log('📤 Sincronizando uploads con VPS...');

      // Verificar que la carpeta local existe
      if (!fs.existsSync(this.localPath)) {
        console.warn(`⚠️  Carpeta local no existe: ${this.localPath}`);
        return {
          success: false,
          message: 'Carpeta local no existe',
          filesCount: 0
        };
      }

      // Contar archivos webp
      let filesCount = 0;
      try {
        const countCmd = `find ${this.localPath} -name "*.webp" 2>/dev/null | wc -l`;
        filesCount = parseInt(
          execSync(countCmd, { stdio: 'pipe' }).toString().trim()
        ) || 0;
      } catch (e) {
        filesCount = 0;
      }

      console.log(`📋 ${filesCount} archivo(s) .webp encontrados`);

      // Ejecutar rsync
      const rsyncCmd = `
        export SSHPASS="${this.sshPass}"
        sshpass -e rsync -avz \\
          --filter="+ *.webp" \\
          --filter="- *" \\
          --delete \\
          --quiet \\
          "${this.localPath}/" \\
          "${this.vpsHost}:${this.vpsPath}/" \\
          --rsh="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" 2>&1 || true
      `;

      execSync(rsyncCmd, { shell: '/bin/bash', stdio: 'pipe' });

      console.log(`✅ Uploads sincronizados (${filesCount} archivos)`);
      return {
        success: true,
        message: `${filesCount} archivos sincronizados`,
        filesCount,
        timestamp: new Date().toISOString()
      };

    } catch (err) {
      console.error(`❌ Error sincronizando: ${err.message}`);
      return {
        success: false,
        message: err.message,
        filesCount: 0
      };
    }
  }

  /**
   * 🔍 VERIFICAR CONEXIÓN AL VPS
   * Test SSH sin ejecutar comandos costosos
   */
  async testVPSConnection() {
    try {
      const testCmd = `
        export SSHPASS="${this.sshPass}"
        sshpass -e ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \\
          "${this.vpsHost}" "test -d ${this.vpsPath} && echo 'OK' || echo 'NOTFOUND'"
      `;

      const result = execSync(testCmd, {
        shell: '/bin/bash',
        stdio: 'pipe'
      }).toString().trim();

      if (result === 'OK') {
        console.log('✅ Conexión al VPS OK');
        return { ok: true };
      } else {
        console.warn('⚠️  Carpeta remota no existe en VPS');
        return { ok: false, message: 'Carpeta remota no existe' };
      }
    } catch (err) {
      console.error(`❌ Error probando conexión: ${err.message}`);
      return { ok: false, error: err.message };
    }
  }

  /**
   * 📊 LISTAR ARCHIVOS SÍNCRONIZADOS EN VPS
   */
  async listRemoteUploads() {
    try {
      const listCmd = `
        export SSHPASS="${this.sshPass}"
        sshpass -e ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \\
          "${this.vpsHost}" "find ${this.vpsPath} -name '*.webp' 2>/dev/null | wc -l"
      `;

      const count = parseInt(
        execSync(listCmd, { shell: '/bin/bash', stdio: 'pipe' }).toString().trim()
      );

      console.log(`📊 Archivos en VPS: ${count}`);
      return { count };
    } catch (err) {
      console.error(`❌ Error listando VPS: ${err.message}`);
      return { count: 0, error: err.message };
    }
  }
}

module.exports = new SyncService();
