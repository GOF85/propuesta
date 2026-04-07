/**
 * SustainabilityService.js
 * Servicio para gestionar la configuración de sostenibilidad
 * Lee y escribe directamente en src/config/sustainability.js
 */

const fs = require('fs');
const path = require('path');

class SustainabilityService {
  constructor() {
    this.configPath = path.join(__dirname, '../config/sustainability.js');
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig() {
    // Limpiar caché de require para asegurar datos frescos
    const resolvedPath = require.resolve(this.configPath);
    if (require.cache[resolvedPath]) {
      delete require.cache[resolvedPath];
    }
    return require(this.configPath);
  }

  /**
   * Guarda la nueva configuración en el archivo
   * @param {Array} data - Array de objetos de configuración
   */
  async saveConfig(data) {
    try {
      if (!Array.isArray(data)) {
        throw new Error('La configuración debe ser un array');
      }

      const content = `/**
 * Configuración de la Propuesta Sostenible
 * Edita este archivo para cambiar los textos, iconos e imágenes de la sección de sostenibilidad.
 * Generado automáticamente por SustainabilityService
 */

module.exports = ${JSON.stringify(data, null, 2)};
`;

      fs.writeFileSync(this.configPath, content, 'utf8');
      return true;
    } catch (err) {
      console.error('Error al guardar configuración de sostenibilidad:', err);
      throw err;
    }
  }
}

module.exports = new SustainabilityService();
