# 📤 Sincronización de Uploads al VPS

## Overview

Después del scraping de venues, las imágenes se descargan, optimizan con Sharp (WebP, resize) y se guardan en `/public/uploads/`. 

Luego **se sincronizan automáticamente al VPS** usando rsync.

## Flujo Automático

```
Admin click "Scrapear micecatering.com"
    ↓
VenueService.scrapeFromListPage()
    ├─ Puppeteer descarga HTML
    ├─ Extrae URLs de imágenes
    ├─ Descargar cada imagen
    ├─ Sharp: resize (max 1920px) → WebP → comprime
    ├─ Guarda en: /public/uploads/{hash}/image.webp
    └─ Inserta en BD
    ↓
SyncService.syncUploadsToVPS()
    └─ rsync (sshpass): envía .webp nuevos al VPS
    ↓
✅ Completo
```

## Sincronización Manual

```bash
# Forzar sincronización de uploads
npm run sync:uploads

# O directamente:
node scripts/sync-uploads-vps.js
```

## Configuración

**SyncService.js** (src/services/SyncService.js):
- `VPS_HOST`: `root@188.95.113.225`
- `VPS_PATH`: `/var/www/vhosts/micecatering.eu/propuesta.micecatering.eu/public/uploads`
- `SSH_PASS`: Contraseña (desde .env en producción)

## What Gets Synced?

Solo archivos **`.webp`** optimizados:
```
rsync --filter="+ *.webp" --filter="- *" ...
```

Esto evita:
- ❌ Copiar originales grandes
- ❌ Sincronizar node_modules
- ✅ Solo imágenes compactadas

## Troubleshooting

**⚠️ "sshpass not found"**
```bash
# macOS
brew install sshpass

# Ubuntu/Debian
sudo apt-get install sshpass
```

**⚠️ "Permission denied" en VPS**
```bash
# SSH al VPS y verifica permisos
ssh root@188.95.113.225
ls -la /var/www/vhosts/micecatering.eu/propuesta.micecatering.eu/public/uploads/
```

**⚠️ Sincronización lenta**
- Agrega `--progress` a rsync para ver velocidad
- Ejecuta en off-peak hours
- Usa `--bwlimit=1024` para limitar ancho de banda

## URLs en Aplicación

Después del scraping, las imágenes están disponibles en:

```
Local:  http://localhost:3000/uploads/{hash}/image.webp
VPS:    https://propuesta.micecatering.eu/uploads/{hash}/image.webp
```

Ambas rutas sirven el mismo archivo (sincronizado).

---

✅ Completamente automatizado. No requiere intervención manual en scraping.
