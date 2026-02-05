#!/bin/bash

# ====================================================================
# MICE CATERING PROPOSALS - Phase 1 Health Check
# Verifica que toda la estructura está en su lugar
# Uso: bash HEALTH_CHECK.sh
# ====================================================================

echo "🏥 HEALTH CHECK - MICE CATERING PROPOSALS (Phase 1)"
echo "======================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

# Check function
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✅${NC} $1"
    ((PASS++))
  else
    echo -e "${RED}❌${NC} $1 (MISSING)"
    ((FAIL++))
  fi
}

check_dir() {
  if [ -d "$1" ]; then
    echo -e "${GREEN}✅${NC} $1/"
    ((PASS++))
  else
    echo -e "${RED}❌${NC} $1/ (MISSING)"
    ((FAIL++))
  fi
}

# ====== CONFIGURATION ======
echo "📋 CONFIGURATION FILES"
check_file "package.json"
check_file ".env.example"
check_file ".env.local.example"
check_file ".gitignore"
check_file ".eslintrc.json"
echo ""

# ====== BACKEND - CORE ======
echo "🔧 BACKEND - CORE"
check_file "src/server.js"
check_file "src/app.js"
check_dir "src/config"
check_file "src/config/db.js"
check_file "src/config/constants.js"
check_file "src/config/utils.js"
echo ""

# ====== BACKEND - MIDDLEWARE ======
echo "🔐 BACKEND - MIDDLEWARE"
check_dir "src/middleware"
check_file "src/middleware/auth.js"
check_file "src/middleware/maintenance.js"
echo ""

# ====== BACKEND - ROUTES ======
echo "🛣️  BACKEND - ROUTES"
check_dir "src/routes"
check_file "src/routes/index.js"
check_dir "src/controllers"
check_dir "src/services"
echo ""

# ====== FRONTEND - VIEWS ======
echo "🎨 FRONTEND - VIEWS"
check_dir "views"
check_dir "views/partials"
check_file "views/partials/header.ejs"
check_file "views/partials/footer.ejs"
check_file "views/partials/flash-messages.ejs"
echo ""

# ====== FRONTEND - ERRORS ======
echo "⚠️  FRONTEND - ERROR PAGES"
check_dir "views/errors"
check_file "views/errors/403.ejs"
check_file "views/errors/404.ejs"
check_file "views/errors/500.ejs"
echo ""

# ====== FRONTEND - CLIENT ======
echo "👤 FRONTEND - CLIENT VIEWS"
check_dir "views/client"
check_file "views/client/maintenance.ejs"
check_dir "views/commercial"
check_dir "views/auth"
echo ""

# ====== FRONTEND - STATIC ======
echo "🌐 FRONTEND - STATIC ASSETS"
check_dir "public"
check_dir "public/css"
check_file "public/css/tailwind.css"
check_dir "public/js"
check_file "public/js/utils.js"
check_dir "public/uploads"
echo ""

# ====== DOCUMENTATION ======
echo "📚 DOCUMENTATION"
check_file "README.md"
check_file "DEVELOPMENT.md"
check_file "QUICK_REFERENCE.md"
check_file "PHASE1_COMPLETE.md"
check_file ".github/copilot-instructions.md"
check_file "PROJECT.md"
check_file "database.sql"
echo ""

# ====== SUMMARY ======
echo "======================================================"
echo "📊 SUMMARY"
echo "======================================================"
echo -e "${GREEN}✅ Passed: $PASS${NC}"
echo -e "${RED}❌ Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✨ Phase 1 Foundation is 100% COMPLETE!${NC}"
  echo ""
  echo "Next Steps:"
  echo "1. npm install"
  echo "2. cp .env.example .env (and configure)"
  echo "3. mysql ... < database.sql"
  echo "4. npm run dev"
  echo ""
  exit 0
else
  echo -e "${RED}⚠️  Some files are missing. Please check the output above.${NC}"
  exit 1
fi
