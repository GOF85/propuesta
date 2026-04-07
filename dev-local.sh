#!/bin/bash
# Script para arrancar el servidor de desarrollo local
# Asume que el túnel SSH ya está corriendo en otra terminal

echo "🚀 Iniciando servidor de desarrollo local..."
echo ""
echo "⚠️  REQUISITO: Debes tener el túnel SSH abierto"
echo "   Si no lo has hecho, ejecuta en OTRA terminal:"
echo "   → ./start-tunnel.sh"
echo ""
echo "📊 Configuración:"
echo "   • App: http://localhost:3000"
echo "   • Base de datos: Producción (vía túnel SSH)"
echo "   • Node: $(node --version)"
echo ""

# Verificar que el archivo .env existe
if [ ! -f .env ]; then
  echo "⚙️  Copiando configuración local..."
  cp .env.local .env
fi

# Dar un momento para leer
sleep 2

# Arrancar el servidor
npm run dev
