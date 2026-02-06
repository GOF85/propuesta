#!/bin/bash
# Manual deployment script - run this on the server
# Usage: Copy this script to server and run it

echo "🔧 Aplicando fixes al editor de propuestas"
echo "============================================"

cd /var/www/vhosts/micecatering.eu/propuesta.micecatering.eu || exit 1

echo "📦 Creando backup..."
cp src/services/ProposalService.js src/services/ProposalService.js.backup
cp src/controllers/editorController.js src/controllers/editorController.js.backup

echo "
⚠️  AHORA DEBES EDITAR ESTOS ARCHIVOS MANUALMENTE:

1. src/services/ProposalService.js - Línea 89-144
   Reemplazar el método getProposalById() completo

2. src/controllers/editorController.js - Línea 14-65  
   Reemplazar el método renderEditor() completo

Los cambios están en tu repositorio Git local.

O puedes usar este comando para subir via Git:
---
cd /var/www/vhosts/micecatering.eu/propuesta.micecatering.eu
git pull origin main
pm2 restart propuesta-app
---

📝 También puedes copiar archivos manualmente via SFTP usando:
   Host: 188.95.113.225
   User: root
   Password: (la que tienes)
   Path: /var/www/vhosts/micecatering.eu/propuesta.micecatering.eu/
"

echo "✨ Después de aplicar cambios, reinicia con:"
echo "   pm2 restart propuesta-app"
