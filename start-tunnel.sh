#!/bin/bash
# Script para iniciar el túnel SSH a la BD de producción
# Uso: ./start-tunnel.sh

echo "🔐 Iniciando túnel SSH a base de datos de producción..."
echo ""
echo "📝 Esto va a:"
echo "   ✓ Conectar al VPS (188.95.113.225)"
echo "   ✓ Crear un túnel del puerto local 3306 → remoto 3306"
echo "   ✓ Permitir que tu app en local use la BD de producción"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - Deja esta terminal ABIERTA mientras desarrollas"
echo "   - Para cerrar el túnel: Ctrl+C en esta ventana"
echo "   - Tu app usará localhost:3306 pero conecta al VPS"
echo ""
echo "🚀 Iniciando túnel..."
echo ""

# Crear el túnel SSH
# -N: No ejecutar comando remoto (solo túnel)
# -L: Local forwarding (puerto_local:host_remoto:puerto_remoto)
ssh -N -L 3306:localhost:3306 root@188.95.113.225

echo ""
echo "🛑 Túnel cerrado"
