/**
 * ImageService.js
 * Propósito: Procesar y optimizar imágenes usando Sharp
 * Pattern: Resizing → WebP conversion → Storage management
 * BRANDING: Extraer colores dominantes con node-vibrant
 */

const sharp = require('sharp');
const { Vibrant } = require('node-vibrant/node');
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
   * @param {String} customFolder - (Opcional) Carpeta personalizada en lugar de hash aleatorio
   * @returns {Promise<{path: String, filename: String, hash: String}>}
   * 
   * Ejemplo uso:
   *   const result = await ImageService.processImage(buffer, 'logo.png');
   *   // result.path = '/uploads/abc123def/image.webp'
   *   
   *   // O con carpeta personalizada:
   *   const result = await ImageService.processImage(buffer, 'logo.png', 'venue-123');
   *   // result.path = '/uploads/venue-123/image.webp'
   */
  async processImage(imageBuffer, originalName = 'image', customFolder = null) {
    try {
      // Usar carpeta personalizada o generar hash único
      const imageHash = customFolder || uuid().substring(0, 12);
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
   * Usa node-vibrant para análisis de paleta
   * @param {Buffer} imageBuffer
   * @returns {Promise<Object>} {hex, rgb, palette}
   */
  async extractDominantColor(imageBuffer) {
    try {
      console.log('🎨 Extrayendo color dominante del logo...');

      // Generar PNG temporal para Vibrant (no soporta WebP directamente)
      const pngBuffer = await sharp(imageBuffer)
        .resize(400, 400, { fit: 'inside' })
        .png()
        .toBuffer();

      // Extraer paleta con Vibrant
      const palette = await Vibrant.from(pngBuffer).getPalette();

      // Prioridad: Vibrant > DarkVibrant > Muted > LightVibrant
      const primarySwatch = palette.Vibrant || palette.DarkVibrant || palette.Muted || palette.LightVibrant;

      if (!primarySwatch) {
        console.warn('⚠️  No se encontró color dominante, usando fallback');
        return this._getFallbackColor();
      }

      const hex = primarySwatch.hex;
      const rgb = primarySwatch.rgb;

      console.log(`✅ Color dominante extraído: ${hex}`);
      console.log(`   RGB: (${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);

      return {
        hex: hex,
        rgb: { r: Math.round(rgb[0]), g: Math.round(rgb[1]), b: Math.round(rgb[2]) },
        palette: {
          vibrant: palette.Vibrant?.hex || hex,
          darkVibrant: palette.DarkVibrant?.hex || hex,
          lightVibrant: palette.LightVibrant?.hex || hex,
          muted: palette.Muted?.hex || hex,
          darkMuted: palette.DarkMuted?.hex || hex,
          lightMuted: palette.LightMuted?.hex || hex
        }
      };
    } catch (err) {
      console.error(`❌ Error extrayendo color: ${err.message}`);
      return this._getFallbackColor();
    }
  }

  /**
   * Generar paleta de colores derivada del color principal
   * Útil para CSS variables (primary, hover, lighter, darker)
   * @param {String} hexColor - Color base en formato #RRGGBB
   * @returns {Object} Paleta completa con variantes
   */
  generateColorPalette(hexColor) {
    try {
      // Convertir HEX a RGB
      const rgb = this._hexToRgb(hexColor);
      if (!rgb) throw new Error('Color HEX inválido');

      // Convertir RGB a HSL para manipular luminosidad/saturación
      const hsl = this._rgbToHsl(rgb.r, rgb.g, rgb.b);

      // Generar variantes
      const palette = {
        primary: hexColor,
        primaryRgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`,
        
        // Hover: 10% más oscuro
        hover: this._hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - 10)),
        
        // Light: 30% más claro
        light: this._hslToHex(hsl.h, Math.max(0, hsl.s - 20), Math.min(100, hsl.l + 30)),
        
        // Dark: 20% más oscuro
        dark: this._hslToHex(hsl.h, Math.min(100, hsl.s + 10), Math.max(0, hsl.l - 20)),
        
        // Complementario (opuesto en rueda de color)
        complement: this._hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l),
        
        // Text: Blanco o negro según luminosidad
        text: hsl.l > 50 ? '#000000' : '#FFFFFF'
      };

      console.log(`🎨 Paleta generada desde ${hexColor}:`);
      console.log(`   Hover: ${palette.hover} | Light: ${palette.light} | Dark: ${palette.dark}`);

      return palette;
    } catch (err) {
      console.error(`❌ Error generando paleta: ${err.message}`);
      return this._getFallbackPalette();
    }
  }

  /**
   * Procesar logo con extracción de branding
   * Combina: processImage + extractDominantColor + generateColorPalette
   * @param {Buffer} imageBuffer
   * @param {String} originalName
   * @returns {Promise<Object>} {path, filename, brandColor, palette}
   */
  async processLogoWithBranding(imageBuffer, originalName = 'logo') {
    try {
      console.log('🏢 Procesando logo con análisis de branding...');

      // 1. Procesar imagen (resize, WebP, save)
      const imageResult = await this.processImage(imageBuffer, originalName);

      // 2. Extraer color dominante
      const colorData = await this.extractDominantColor(imageBuffer);

      // 3. Generar paleta completa
      const palette = this.generateColorPalette(colorData.hex);

      console.log(`✅ Logo procesado con branding completo`);

      return {
        ...imageResult,
        brandColor: colorData.hex,
        brandRgb: colorData.rgb,
        vibrantPalette: colorData.palette,
        generatedPalette: palette
      };
    } catch (err) {
      console.error(`❌ Error procesando logo: ${err.message}`);
      throw err;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // MÉTODOS AUXILIARES (Color Conversion)
  // ═══════════════════════════════════════════════════════════════

  _getFallbackColor() {
    return {
      hex: '#0066cc',
      rgb: { r: 0, g: 102, b: 204 },
      palette: {
        vibrant: '#0066cc',
        darkVibrant: '#004c99',
        lightVibrant: '#3399ff',
        muted: '#4d7fa6',
        darkMuted: '#33577a',
        lightMuted: '#7fa6cc'
      }
    };
  }

  _getFallbackPalette() {
    return {
      primary: '#0066cc',
      primaryRgb: '0, 102, 204',
      hover: '#0052a3',
      light: '#66a3e0',
      dark: '#004080',
      complement: '#cc6600',
      text: '#ffffff'
    };
  }

  _hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  _rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  _hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
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
