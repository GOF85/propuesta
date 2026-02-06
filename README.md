# MICE CATERING PROPOSALS

```text
```text
1. Install dependencies
2. Configure .env
3. Import database.sql
4. Run seed script
5. Start server
6. Open [http://localhost:3000](http://localhost:3000)
```

```text
- [PROJECT.md](PROJECT.md)
- [database.sql](database.sql)
- [docs/](docs/)
- [mockups/](mockups/)
* [PROJECT.md](PROJECT.md)
* [database.sql](database.sql)
* [docs/](docs/)
* [mockups/](mockups/)
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

## 📋 Implementation Progress

### Phase 1: Foundation ✅ COMPLETE

- [x] Server entry point (`src/server.js`)
- [x] Middleware (auth, maintenance, error handling)
- [x] Error pages (404, 403, 500)

### Phase 2: Dashboard ✅ COMPLETE

- [x] App.js integration - Route registration + view helpers
- [x] Completion summary (docs/PHASE2_COMPLETION.md)

**Status:** Ready for testing. Run: `npm run seed && npm run dev`

- [ ] EditorController - Load/save proposal editing
- [ ] editor.ejs - Full editor form (venues, services, items, pricing)
- [ ] public/js/editor.js - DOM interactions (add/remove without reload)
- [ ] API endpoints (`src/routes/api.js`) - /api/proposals/:id/calculate, etc.
- [ ] Real-time price calculations

### Phase 4: Client View & Chat 💬 FUTURE

- [ ] ClientController - Client view permission checks
- [ ] proposal-view.ejs - Read-only view for clients
- [ ] ChatService - Message persistence
- [ ] public/js/chat.js - 30s polling + UI
- [ ] Email notifications (Nodemailer)

### Quick Links

- **[docs/INDEX.md](docs/INDEX.md)** - Full documentation index (start here!)
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Complete developer guide
- **[docs/PHASE2_COMPLETION.md](docs/PHASE2_COMPLETION.md)** - What was built in Phase 2
- **[docs/PHASE2_TESTING.md](docs/PHASE2_TESTING.md)** - 16 test cases for Phase 2
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - AI agent instructions

# 1. Setup

# 5. Visit dashboard

# <http://localhost:3000/dashboard>

# Login: <test@example.com> / password123

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
