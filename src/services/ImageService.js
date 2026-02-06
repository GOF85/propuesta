/**
 * ImageService.js
 * Propósito: Procesar y optimizar imágenes usando Sharp
 * Pattern: Resizing → WebP conversion → Storage management
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuid } = require('uuid');

class ImageService {
  constructor() {
    // Directorio base para uploads
    this.uploadsDir = path.join(__dirname, '../../public/uploads');
    this.maxWidth = 1920;
    this.quality = 80; // Calidad WebP
  }

  /**
   * Procesar imagen: Resize → WebP → Save
   * @param {Buffer} imageBuffer - Buffer de imagen original
   * @param {String} originalName - Nombre original del archivo (metadata)
   * @returns {Promise<{path: String, filename: String, hash: String}>}
   * 
   * Ejemplo uso:
   *   const result = await ImageService.processImage(buffer, 'logo.png');
   *   // result.path = '/uploads/abc123def/image.webp'
   */
  async processImage(imageBuffer, originalName = 'image') {
    try {
      // Generar hash único para la carpeta
      const imageHash = uuid().substring(0, 12);
      const imageDir = path.join(this.uploadsDir, imageHash);

      // Crear directorio si no existe
      await fs.mkdir(imageDir, { recursive: true });

      // Extraer extensión y generar nombre final
      const ext = path.extname(originalName).toLowerCase();
      const baseName = path.basename(originalName, ext);
      const filename = `${baseName}-${Date.now()}.webp`;
      const filePath = path.join(imageDir, filename);

      // Procesar imagen con Sharp
      const metadata = await sharp(imageBuffer).metadata();
      
      // Logging
      console.log(`📸 Procesando imagen: ${originalName}`);
      console.log(`   Original: ${metadata.width}x${metadata.height}px`);

      // Redimensionar si es mayor a maxWidth
      let transform = sharp(imageBuffer);
      
      if (metadata.width > this.maxWidth) {
        transform = transform.resize(this.maxWidth, null, {
          fit: 'inside',
          withoutEnlargement: true
        });
        console.log(`   ↓ Redimensionado a max ${this.maxWidth}px`);
      }

      // Convertir a WebP y guardar
      await transform
        .webp({ quality: this.quality })
        .toFile(filePath);

      // Obtener info del archivo guardado
      const stats = await fs.stat(filePath);
      const originalSizeKB = (imageBuffer.length / 1024).toFixed(2);
      const finalSizeKB = (stats.size / 1024).toFixed(2);
      const compressionRatio = ((1 - stats.size / imageBuffer.length) * 100).toFixed(1);

      console.log(`   ✅ Guardado: ${filename}`);
      console.log(`   Compresión: ${originalSizeKB}KB → ${finalSizeKB}KB (${compressionRatio}%)`);

      return {
        path: `/uploads/${imageHash}/${filename}`,
        filename: filename,
        hash: imageHash,
        directory: imageDir,
        sizeKB: finalSizeKB,
        width: metadata.width > this.maxWidth ? this.maxWidth : metadata.width,
        height: metadata.height
      };
    } catch (err) {
      console.error(`❌ Error procesando imagen: ${err.message}`);
      throw new Error(`Falló procesamiento de imagen: ${err.message}`);
    }
  }

  /**
   * Procesar múltiples imágenes (batch)
   * @param {Array} filesArray - Array de {buffer, name}
   * @returns {Promise<Array>} Array de resultados
   */
  async processImageBatch(filesArray) {
    try {
      const results = [];
      for (const file of filesArray) {
        const result = await this.processImage(file.buffer, file.name);
        results.push(result);
      }
      return results;
    } catch (err) {
      console.error(`❌ Error en batch: ${err.message}`);
      throw err;
    }
  }

  /**
   * Extraer color dominante de logo (para branding)
   * Requiere: npm install node-vibrant (opcional)
   * @param {Buffer} imageBuffer
   * @returns {Promise<Object>} {hex, rgb, hsl}
   */
  async extractDominantColor(imageBuffer) {
    try {
      // Reducir imagen a 150x150 para análisis rápido
      const reduced = await sharp(imageBuffer)
        .resize(150, 150)
        .toBuffer();

      // Placeholder: en producción usar node-vibrant
      // Para MVP, retornar color por defecto
      console.log(`🎨 Color dominante: pendiente implementar node-vibrant`);
      
      return {
        hex: '#0066cc',
        rgb: { r: 0, g: 102, b: 204 },
        hsl: { h: 210, s: 100, l: 40 }
      };
    } catch (err) {
      console.error(`Warning: No se pudo extraer color: ${err.message}`);
      return {
        hex: '#0066cc',
        rgb: { r: 0, g: 102, b: 204 },
        hsl: { h: 210, s: 100, l: 40 }
      };
    }
  }

  /**
   * Limpiar imágenes antiguas (por hash)
   * @param {String} imageHash - Hash único de la carpeta
   * @returns {Promise<Object>} {deleted: bool, message: string}
   */
  async deleteImage(imageHash) {
    try {
      if (!imageHash || imageHash.length !== 12) {
        throw new Error('Hash inválido');
      }

      const imageDir = path.join(this.uploadsDir, imageHash);
      
      // Verificar que la carpeta existe
      await fs.access(imageDir);

      // Eliminar recursivamente
      await fs.rm(imageDir, { recursive: true, force: true });

      console.log(`🗑️  Imagen eliminada: ${imageHash}`);
      return {
        deleted: true,
        message: `Carpeta ${imageHash} eliminada`
      };
    } catch (err) {
      console.error(`❌ Error eliminando imagen: ${err.message}`);
      return {
        deleted: false,
        message: err.message
      };
    }
  }

  /**
   * Validar que el buffer es una imagen válida
   * @param {Buffer} buffer
   * @returns {Promise<Boolean>}
   */
  async validateImage(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        valid: true,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        space: metadata.space
      };
    } catch (err) {
      return {
        valid: false,
        error: 'No es una imagen válida'
      };
    }
  }

  /**
   * Generar thumbnail (preview pequeño)
   * @param {Buffer} imageBuffer
   * @param {Number} size - Tamaño en px (default 400)
   * @returns {Promise<Buffer>}
   */
  async generateThumbnail(imageBuffer, size = 400) {
    try {
      return await sharp(imageBuffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 75 })
        .toBuffer();
    } catch (err) {
      console.error(`❌ Error generando thumbnail: ${err.message}`);
      throw err;
    }
  }
}

module.exports = new ImageService();
