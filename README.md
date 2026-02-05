# 🍽️ MICE CATERING PROPOSALS - Setup & Development

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your MariaDB credentials, email, etc.
```

### 3. Initialize Database
```bash
# Import the schema
mysql -u catering_user -p catering_proposals < database.sql
```

### 4. Start Development Server
```bash
npm run dev
```

Server will be available at `http://localhost:3000`

---

## 📁 Project Structure

```
src/
  ├── config/           # DB Pool + Constants
  ├── controllers/      # HTTP Request Handlers
  ├── services/         # Business Logic + SQL
  ├── routes/           # Endpoint Definitions
  ├── middleware/       # Auth, Error Handling
  ├── app.js           # Express Setup
  └── server.js        # Entry Point
  
views/
  ├── partials/        # Reusable Components (header, footer)
  ├── commercial/      # Dashboard, Editor
  ├── client/          # Public Views
  ├── auth/            # Login/Register
  └── errors/          # 404, 500

public/
  ├── css/             # Stylesheets
  ├── js/              # Client Scripts
  └── uploads/         # User Images
```

---

## 🏗️ Architecture: SERVICE PATTERN

```
Route → Controller → Service → Database
         (validate)  (logic)    (SQL)
```

- **Routes:** Define endpoints only (no business logic)
- **Controllers:** Validate input, call services, handle errors, return responses
- **Services:** All business logic + SQL queries (with prepared statements)
- **Middleware:** Authentication, authorization, error handling, maintenance mode
- **Views:** EJS templates with Tailwind CSS (via CDN for MVP) + Partials

**Key File:**
- `src/config/db.js` - MariaDB pool with prepared statements
- `src/config/constants.js` - Application-wide constants
- `src/config/utils.js` - Helper functions (dates, currency, VAT)
- `src/middleware/auth.js` - Auth & authorization middleware
- `src/middleware/maintenance.js` - Maintenance mode check
- `public/js/utils.js` - Client-side utilities

---

## 📋 Implementation Progress

### Phase 1: Foundation ✅ COMPLETE

- [x] Project folder structure (`src/`, `views/`, `public/`)
- [x] `package.json` with all dependencies (Express, MariaDB, EJS, Sharp, etc.)
- [x] `.env.example` & `.env.local.example` for configuration
- [x] `.gitignore` & `.dockerignore`
- [x] Database pool configuration (`src/config/db.js`)
- [x] Express app setup (`src/app.js` + middleware)
- [x] Server entry point (`src/server.js`)
- [x] Constants & utilities (`src/config/constants.js`, `src/config/utils.js`)
- [x] Middleware (auth, maintenance, error handling)
- [x] Error pages (404, 403, 500)

### Phase 2: Dashboard ✅ COMPLETE

- [x] ProposalService.js - Business logic layer (listProposals, getProposalById, createProposal, **calculateTotals**, duplicateProposal, deleteProposal)
- [x] DashboardController.js - HTTP handlers with validation
- [x] Dashboard routes - GET /dashboard, POST /proposal, POST /proposal/:id/duplicate, etc.
- [x] dashboard.ejs - Proposal list UI with filters, search, status badges
- [x] new-proposal.ejs - Creation form
- [x] Seed script - Test data generator (npm run seed)
- [x] App.js integration - Route registration + view helpers
- [x] **Testing guide** (16 test cases ready in docs/PHASE2_TESTING.md)
- [x] Completion summary (docs/PHASE2_COMPLETION.md)

**Status:** Ready for testing. Run: `npm run seed && npm run dev`

### Phase 3: Editor 📝 FUTURE

- [ ] EditorController - Load/save proposal editing
- [ ] editor.ejs - Full editor form (venues, services, items, pricing)
- [ ] public/js/editor.js - DOM interactions (add/remove without reload)
- [ ] API endpoints (`src/routes/api.js`) - /api/proposals/:id/calculate, etc.
- [ ] Real-time price calculations

### Phase 4: Client View & Chat 💬 FUTURE

- [ ] Magic link authentication (`/p/:hash`)
- [ ] ClientController - Client view permission checks
- [ ] proposal-view.ejs - Read-only view for clients
- [ ] ChatService - Message persistence
- [ ] public/js/chat.js - 30s polling + UI
- [ ] Email notifications (Nodemailer)

---

## � Documentation

### Quick Links
- **[docs/INDEX.md](docs/INDEX.md)** - Full documentation index (start here!)
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Complete developer guide
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Code patterns & commands
- **[docs/PHASE2_COMPLETION.md](docs/PHASE2_COMPLETION.md)** - What was built in Phase 2
- **[docs/PHASE2_TESTING.md](docs/PHASE2_TESTING.md)** - 16 test cases for Phase 2
- **[PROJECT.md](PROJECT.md)** - Business requirements + database schema
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - AI agent instructions

---

## 🚀 Quick Start After Phase 1 & 2 Complete

```bash
# 1. Setup
npm install
cp .env.example .env.local
# Edit .env.local with MariaDB credentials

# 2. Database
mysql -u root -p < database.sql

# 3. Seed test data
npm run seed

# 4. Start server
npm run dev

# 5. Visit dashboard
# http://localhost:3000/dashboard
# Login: test@example.com / password123
```

---

## 🧪 Testing Phase 2

See **[docs/PHASE2_TESTING.md](docs/PHASE2_TESTING.md)** for:
- Pre-flight checks
- 13 test cases (login, dashboard, filters, search, CRUD)
- API endpoint tests
- Database verification
- Troubleshooting guide

**Quick test:** After `npm run dev`, visit http://localhost:3000/dashboard

---

## 📝 Notes

- **Language:** Code in English, comments in Spanish
- **Database:** Native SQL only (no ORMs)
- **Images:** Always process with Sharp (resize to 1920px, convert to WebP)
- **Dates:** Use `dayjs` for formatting
- **IDs:** Use `uuid` for proposal hashes
- **Documentation:** Start with [docs/INDEX.md](docs/INDEX.md)

---

**Status:** Phase 1 ✅ | Phase 2 ✅ | Last Updated: February 2026

Visit [docs/INDEX.md](docs/INDEX.md) for complete documentation navigation.
