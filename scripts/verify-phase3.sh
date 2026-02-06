#!/usr/bin/env bash

# 🚀 PHASE 3 COMPLETION VERIFICATION SCRIPT
# Verifica que todos los archivos de Phase 3 fueron creados correctamente

echo "════════════════════════════════════════════════════════════════"
echo "🔍 PHASE 3 COMPLETION VERIFICATION"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Contador
PASSED=0
FAILED=0

# Función para verificar archivo
check_file() {
  local file=$1
  local description=$2
  
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅ $description${NC}"
    echo "   File: $file"
    wc -l "$file" | awk '{print "   Lines: " $1}'
    ((PASSED++))
  else
    echo -e "${RED}❌ $description${NC}"
    echo "   File: $file (NOT FOUND)"
    ((FAILED++))
  fi
  echo ""
}

# Función para verificar directorio
check_dir() {
  local dir=$1
  local description=$2
  
  if [ -d "$dir" ]; then
    echo -e "${GREEN}✅ $description${NC}"
    echo "   Directory: $dir"
    ((PASSED++))
  else
    echo -e "${RED}❌ $description${NC}"
    echo "   Directory: $dir (NOT FOUND)"
    ((FAILED++))
  fi
  echo ""
}

# ════════════════════════════════════════════════════════════════
# PHASE 3 BACKEND FILES
# ════════════════════════════════════════════════════════════════
echo "📂 BACKEND CONTROLLERS & ROUTES"
echo "─────────────────────────────────────────────────────────────"
check_file "src/controllers/editorController.js" "EditorController (HTTP Handlers)"
check_file "src/routes/editor.js" "Editor Routes"
check_file "src/routes/api.js" "API Routes (RESTful)"

# ════════════════════════════════════════════════════════════════
# PHASE 3 FRONTEND FILES
# ════════════════════════════════════════════════════════════════
echo "🎨 FRONTEND VIEWS & SCRIPTS"
echo "─────────────────────────────────────────────────────────────"
check_file "views/commercial/editor.ejs" "Editor View (UI)"
check_file "public/js/editor.js" "Editor JavaScript (Interactivity)"

# ════════════════════════════════════════════════════════════════
# PHASE 3 DOCUMENTATION
# ════════════════════════════════════════════════════════════════
echo "📚 DOCUMENTATION"
echo "─────────────────────────────────────────────────────────────"
check_file "docs/PHASE3_COMPLETION.md" "Phase 3 Completion Report"
check_file "docs/PHASE3_TESTING.md" "Phase 3 Testing Guide (20 test cases)"
check_file "docs/PHASE3_STATUS.md" "Phase 3 Status Report"

# ════════════════════════════════════════════════════════════════
# INTEGRATION CHECK
# ════════════════════════════════════════════════════════════════
echo "🔗 INTEGRATION CHECKS"
echo "─────────────────────────────────────────────────────────────"

# Check if app.js registers new routes
if grep -q "editorRoutes" src/app.js; then
  echo -e "${GREEN}✅ app.js registers editorRoutes${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ app.js does NOT register editorRoutes${NC}"
  ((FAILED++))
fi

if grep -q "apiRoutes" src/app.js; then
  echo -e "${GREEN}✅ app.js registers apiRoutes${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ app.js does NOT register apiRoutes${NC}"
  ((FAILED++))
fi

echo ""

# ════════════════════════════════════════════════════════════════
# SYNTAX CHECKS
# ════════════════════════════════════════════════════════════════
echo "🔧 SYNTAX VALIDATION"
echo "─────────────────────────────────────────────────────────────"

# Check JavaScript syntax
for js_file in src/controllers/editorController.js src/routes/editor.js src/routes/api.js public/js/editor.js; do
  if node -c "$js_file" 2>/dev/null; then
    echo -e "${GREEN}✅ $js_file syntax OK${NC}"
    ((PASSED++))
  else
    echo -e "${RED}❌ $js_file has syntax errors${NC}"
    ((FAILED++))
  fi
done

echo ""

# ════════════════════════════════════════════════════════════════
# CONTENT CHECKS
# ════════════════════════════════════════════════════════════════
echo "📝 CONTENT VERIFICATION"
echo "─────────────────────────────────────────────────────────────"

# Check editorController has key methods
if grep -q "renderEditor\|updateProposal\|calculateTotals\|publishProposal" src/controllers/editorController.js; then
  echo -e "${GREEN}✅ EditorController has key methods${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ EditorController missing key methods${NC}"
  ((FAILED++))
fi

# Check editor.ejs has key sections
if grep -q "Información de la Propuesta\|Venues\|Servicios" views/commercial/editor.ejs; then
  echo -e "${GREEN}✅ editor.ejs has key sections${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ editor.ejs missing key sections${NC}"
  ((FAILED++))
fi

# Check editor.js has key functions
if grep -q "calculateTotals\|addService\|addVenue\|showNotification" public/js/editor.js; then
  echo -e "${GREEN}✅ editor.js has key functions${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ editor.js missing key functions${NC}"
  ((FAILED++))
fi

# Check api.js has endpoints
if grep -q "POST.*services\|DELETE.*services\|POST.*venues\|POST.*calculate" src/routes/api.js; then
  echo -e "${GREEN}✅ api.js has API endpoints${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ api.js missing API endpoints${NC}"
  ((FAILED++))
fi

echo ""

# ════════════════════════════════════════════════════════════════
# SUMMARY
# ════════════════════════════════════════════════════════════════
echo "════════════════════════════════════════════════════════════════"
echo "📊 VERIFICATION RESULTS"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "✅ PASSED: ${GREEN}${PASSED}${NC}"
echo -e "❌ FAILED: ${RED}${FAILED}${NC}"
echo ""

TOTAL=$((PASSED + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 PHASE 3 VERIFICATION: 100% COMPLETE${NC}"
  echo -e "${GREEN}All checks passed! Ready for Phase 3 testing.${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  PHASE 3 VERIFICATION: ${PERCENTAGE}% COMPLETE${NC}"
  echo -e "${YELLOW}Some issues detected. Please review above.${NC}"
  exit 1
fi
