#!/bin/bash

# 🚀 PHASE 2 QUICK START VERIFICATION SCRIPT
# Purpose: Verify Phase 2 deployment is ready to test
# Usage: chmod +x docs/QUICK_START.sh && ./docs/QUICK_START.sh

set -e

echo "═══════════════════════════════════════════════════════════"
echo "🚀 PHASE 2 QUICK START VERIFICATION"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js v20+"
    exit 1
fi
NODE_VERSION=$(node -v)
echo "✅ Node.js: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo "✅ npm: $NPM_VERSION"

# Check MySQL client
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL client not found (needed for database setup)"
    echo "   → Install: brew install mysql-client (macOS)"
    echo "   → Or: sudo apt-get install mysql-client (Linux)"
fi

echo ""

# Step 2: Check files exist
echo -e "${BLUE}Step 2: Verifying files...${NC}"
echo ""

FILES=(
    "src/services/ProposalService.js"
    "src/controllers/dashboardController.js"
    "src/routes/dashboard.js"
    "views/commercial/dashboard.ejs"
    "views/commercial/new-proposal.ejs"
    "scripts/seed-test-data.js"
    "docs/PHASE2_TESTING.md"
    "docs/PHASE2_COMPLETION.md"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file not found"
        exit 1
    fi
done

echo ""

# Step 3: Check package.json
echo -e "${BLUE}Step 3: Checking package.json...${NC}"
echo ""

if grep -q '"seed": "node scripts/seed-test-data.js"' package.json; then
    echo "✅ Seed script defined in package.json"
else
    echo "❌ Seed script not found in package.json"
    exit 1
fi

echo ""

# Step 4: Install dependencies
echo -e "${BLUE}Step 4: Installing dependencies...${NC}"
echo ""

if [ -d "node_modules" ]; then
    echo "ℹ️  node_modules already exists, skipping npm install"
    echo "   Run 'npm install' manually if you want to update"
else
    echo "📦 Installing npm packages..."
    npm install --silent
    echo "✅ Dependencies installed"
fi

echo ""

# Step 5: Environment setup
echo -e "${BLUE}Step 5: Checking environment...${NC}"
echo ""

if [ -f ".env.local" ]; then
    echo "✅ .env.local exists"
    if grep -q "DB_HOST" .env.local; then
        echo "   ℹ️  MariaDB configuration found"
    fi
else
    echo "⚠️  .env.local not found"
    echo "   → Create it: cp .env.example .env.local"
    echo "   → Then edit with your MariaDB credentials"
    echo ""
    echo "   Required variables:"
    echo "   - DB_HOST=localhost"
    echo "   - DB_USER=catering_user"
    echo "   - DB_PASS=your_password"
    echo "   - DB_NAME=catering_proposals"
fi

echo ""

# Step 6: Database check
echo -e "${BLUE}Step 6: Checking database...${NC}"
echo ""

if [ -f "database.sql" ]; then
    echo "✅ database.sql exists"
    TABLES=$(grep "CREATE TABLE" database.sql | wc -l)
    echo "   ℹ️  Contains $TABLES table definitions"
    echo ""
    echo "   To import schema:"
    echo "   mysql -u root -p < database.sql"
else
    echo "❌ database.sql not found"
fi

echo ""

# Step 7: Documentation check
echo -e "${BLUE}Step 7: Checking documentation...${NC}"
echo ""

DOCS=(
    "docs/PHASE2_TESTING.md"
    "docs/PHASE2_COMPLETION.md"
    "docs/INDEX.md"
    "docs/MANIFEST.md"
    "docs/STATUS.md"
    "docs/STAKEHOLDER_SUMMARY.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        LINES=$(wc -l < "$doc")
        echo "✅ $doc ($LINES lines)"
    else
        echo "⚠️  $doc not found"
    fi
done

echo ""

# Step 8: Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ PHASE 2 VERIFICATION COMPLETE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo "📋 Next steps:"
echo ""
echo "1️⃣  Configure environment (if not already done):"
echo "   cp .env.example .env.local"
echo "   nano .env.local  # Edit with your DB credentials"
echo ""
echo "2️⃣  Import database schema:"
echo "   mysql -u root -p < database.sql"
echo ""
echo "3️⃣  Seed test data:"
echo "   npm run seed"
echo ""
echo "4️⃣  Start development server:"
echo "   npm run dev"
echo ""
echo "5️⃣  Open browser and visit:"
echo "   http://localhost:3000/dashboard"
echo ""
echo "6️⃣  Login with test credentials:"
echo "   Email: test@example.com"
echo "   Password: password123"
echo ""
echo "7️⃣  Follow Phase 2 testing guide:"
echo "   → See docs/PHASE2_TESTING.md"
echo ""
echo -e "${YELLOW}📚 Documentation:${NC}"
echo "   - docs/INDEX.md - Navigation guide"
echo "   - docs/STATUS.md - Final status report"
echo "   - docs/STAKEHOLDER_SUMMARY.md - For management"
echo ""
echo -e "${GREEN}Ready to test! 🚀${NC}"
echo ""
