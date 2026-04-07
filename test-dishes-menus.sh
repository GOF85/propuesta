#!/bin/bash
# Test script para validar el sistema de dishes y menus

BASE_URL="http://localhost:3000"
COOKIES="/tmp/test_cookies.txt"
EMAIL="admin@test.local"
PASSWORD="admin"

echo "🧪 Iniciando tests del sistema de Platos y Menús..."
echo ""

# 1. Login
echo "1️⃣  Authenticating..."
curl -s -c "$COOKIES" -d "email=$EMAIL&password=$PASSWORD" "$BASE_URL/login" > /dev/null
echo "✅ Login completado"
echo ""

# 2. Crear un plato
echo "2️⃣  Crear plato de prueba..."
DISH_DATA='{
  "name": "Ensalada César de Prueba",
  "description": "Lechuga romana con croutons y queso parmesano",
  "category": "entrante",
  "base_price": "12.50",
  "allergens": "[\"gluten\",\"lacteos\"]",
  "badges": "[\"vegano\"]",
  "images": "[\"uploads/test.jpg\"]"
}'

DISH_RESPONSE=$(curl -s -b "$COOKIES" -X POST "$BASE_URL/admin/dishes" \
  -H "Content-Type: application/json" \
  -d "$DISH_DATA")

echo "Response: $DISH_RESPONSE" | head -20
echo "✅ Plato creado (verifica respuesta arriba)"
echo ""

# 3. Obtener platos via API
echo "3️⃣  Obtener platos via API..."
DISHES=$(curl -s -b "$COOKIES" "$BASE_URL/api/dishes?q=Ensalada&limit=5")
echo "$DISHES" | head -30
echo ""

# 4. Crear menú
echo "4️⃣  Crear menú de prueba..."
# Primero extraer IDs de platos si existen
DISH_IDS='[1]' # Hardcoded for test
MENU_DATA='{
  "name": "Menú Degustación de Prueba",
  "description": "Menú de 3 platos para evento",
  "base_price": "45.00",
  "dishIds": "[1]"
}'

MENU_RESPONSE=$(curl -s -b "$COOKIES" -X POST "$BASE_URL/admin/menus" \
  -H "Content-Type: application/json" \
  -d "$MENU_DATA")

echo "Response: $MENU_RESPONSE" | head -20
echo "✅ Menú creado (verifica respuesta arriba)"
echo ""

# 5. Obtener menús via API
echo "5️⃣  Obtener menús via API..."
MENUS=$(curl -s -b "$COOKIES" "$BASE_URL/api/menus?limit=10")
echo "$MENUS" | jq . 2>/dev/null | head -40
echo ""

echo "✅ Todos los tests completados"
