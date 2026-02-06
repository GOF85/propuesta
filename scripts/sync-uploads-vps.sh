#!/bin/bash
# 📤 Sincronizar uploads al VPS
# Uso: ./scripts/sync-uploads-vps.sh
# Solo sincroniza nuevas imágenes optimizadas después del scraping

set -e

VPS_HOST="root@188.95.113.225"
VPS_PATH="/var/www/vhosts/micecatering.eu/propuesta.micecatering.eu/public/uploads"
LOCAL_PATH="./public/uploads"
SSH_PASS="Kbmef9Pke9u36VHh"

echo "📤 Sincronizando uploads con VPS..."

# Usar sshpass para evitar prompt de contraseña
export SSHPASS="$SSH_PASS"

# rsync: copiar solo archivos webp nuevos
sshpass -e rsync -avz \
  --filter="+ *.webp" \
  --filter="- *" \
  --delete \
  "$LOCAL_PATH/" \
  "$VPS_HOST:$VPS_PATH/" \
  --rsh="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

if [ $? -eq 0 ]; then
  echo "✅ Uploads sincronizados al VPS"
else
  echo "❌ Error sincronizando uploads"
  exit 1
fi
