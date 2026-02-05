# 🏗️ MICE CATERING PROPOSALS - AI Agent Instructions

**Role:** Principal Software Architect (Node.js corporativo)  
**Mission:** Direct implementation of **"MICE CATERING PROPOSALS"** - Commercial catering proposal management system  
**Stack:** Node.js v20+ | Express | MariaDB | EJS + Tailwind | Puppeteer

---

## 📚 Quick Context

Your workspace contains:
- **[PROJECT.md](../PROJECT.md)** - Full technical specs
- **[database.sql](../database.sql)** - Complete DB schema
- **`mockups/`** - Exact UI reference (dashboard, editor, client-view)

---

## 1️⃣ STACK (Non-negotiable)

| Component | Tech | Notes |
|-----------|------|-------|
| **Runtime** | Node.js v20+ | pm2 in production |
| **Framework** | Express.js | Minimal, middleware-based |
| **Database** | MariaDB | **Native SQL only** (no ORMs) |
| **Connection** | `mariadb` npm package | Pool-based, prepared statements |
| **Templates** | EJS + Partials | Tailwind CSS via CDN for MVP |
| **Image Processing** | Sharp | Resize to 1920px max → WebP → `/public/uploads/` |
| **Scraping** | Puppeteer | `--no-sandbox` arg; fallback to manual input |
| **Email** | Nodemailer | SMTP (Gmail compatible) |
| **Utils** | `uuid`, `dayjs`, `connect-flash` | For IDs, dates, notifications |

---

## 2️⃣ ARCHITECTURE - "SERVICE PATTERN"

```
Routes (input)
    ↓
Controllers (validation + error handling)
    ↓
Services (SQL + business logic)
    ↓
Database (MariaDB)
```

### Layer Responsibilities

**Routes** (`src/routes/`)
- Define endpoints only
- No business logic

**Controllers** (`src/controllers/`)
- Validate inputs with `express-validator`
- Call Services
- Handle HTTP errors (400, 404, 500)
- Return JSON or render views

**Services** (`src/services/`)
- **ONLY place for SQL queries**
- Contain ALL business logic
- Handle transactions (`BEGIN/COMMIT`)
- Manage data transformations
- Throw descriptive errors

**Views** (`views/`)
- Use **Partials** to avoid duplication:
  - `views/partials/header.ejs` (navbar, search, user)
  - `views/partials/footer.ejs` (branding)
  - `views/partials/flash-messages.ejs` (notifications)
- Structure **exactly mirrors** `mockups/*.html` layout

---

## 3️⃣ CRITICAL BUSINESS RULES

### A. Adhoc Persistence & Deep Cloning
- Proposals are **isolated instances**. Editing dishes in a proposal does NOT affect catalog.
- When adding dishes: `INSERT INTO proposal_items SELECT ... FROM dishes WHERE ...`
- **Deep Clone (duplicate proposal)**: Copy recursively:
  ```
  Proposal → proposal_venues → proposal_services 
           → service_options → proposal_items
  ```

### B. Financial Engine (Single Source of Truth)
- **All price calculations MUST be in Backend** (`ProposalService.calculateTotals(proposalId)`)
  - VAT: 10% (services) vs 21% (food) per row
  - Discounts applied before/after VAT per business rule
- **Frontend sends deltas only** (qty change, option selected) → receives updated totals as JSON
- **Never calculate money in browser**

### C. Resilient Scraping & Image Handling
- **Puppeteer**: Use `--no-sandbox` arg for Linux compatibility
- If scraping fails → fallback to manual venue input form
- **Anti-Hotlinking**: Download image → resize (max 1920px width) → convert to WebP → save to `public/uploads/{hash}/`
  - Use Sharp: `sharp(buffer).resize(1920, null).webp().toFile(path)`

### D. UI/UX & Printing (Mockup Fidelity)
- Copy **exact Tailwind classes** from `mockups/*.html`
- **Print-safe**: Add `print:hidden` to buttons, navbar, chat
  - User clicks `Ctrl+P` → sees clean contract/quote layout
- **Mobile First**: Tables collapse on mobile, show totals only

### E. Chat & Security
- **Magic Link Access**: `/p/:hash` (unique hash, no login required)
  - Rate limit: 5 requests/min per IP
- **Maintenance Mode**: Middleware checks `proposals.is_editing`
  - If `true` → render "Client locked" waiting screen
- **Chat System**:
  - Polling every 30s (real-time not required for MVP)
  - Email notification via Nodemailer when new message

---

## 4️⃣ PROJECT STRUCTURE

```
/src
├── config/
│   ├── db.js              # MariaDB pool initialization
│   └── constants.js       # App-wide constants
├── controllers/
│   ├── dashboardController.js
│   ├── editorController.js
│   ├── clientController.js
│   ├── chatController.js
│   └── apiController.js   # For interactive updates
├── services/
│   ├── ProposalService.js      # Proposals + calculateTotals()
│   ├── VenueService.js         # Venues + scraping
│   ├── ImageService.js         # Sharp processing
│   ├── EmailService.js         # Nodemailer wrapper
│   └── ChatService.js          # Message persistence
├── routes/
│   ├── dashboard.js
│   ├── editor.js
│   ├── client.js
│   ├── api.js              # JSON endpoints for interactivity
│   └── auth.js             # Login / logout
├── middleware/
│   ├── errorHandler.js
│   ├── auth.js             # Session check
│   └── maintenance.js      # is_editing check
├── views/
│   ├── partials/
│   │   ├── header.ejs
│   │   ├── footer.ejs
│   │   └── flash-messages.ejs
│   ├── commercial/
│   │   ├── dashboard.ejs
│   │   ├── editor.ejs
│   │   └── new-proposal.ejs
│   ├── client/
│   │   ├── proposal-view.ejs
│   │   ├── chat.ejs
│   │   └── maintenance.ejs
│   └── auth/
│       ├── login.ejs
│       └── register.ejs
├── public/
│   ├── css/
│   ├── js/
│   │   ├── editor.js       # DOM manipulation (add services/dishes)
│   │   ├── chat.js         # Polling + auto-refresh
│   │   └── utils.js        # Helpers
│   ├── uploads/            # Generated images, logos
│   └── tailwind.css        # Tailwind @apply overrides
├── app.js                  # Express setup + middleware stack
├── server.js               # Entry point (listen)
└── package.json            # Dependencies
```

---

## 5️⃣ EXECUTION ROADMAP (Strict Order)

### Phase 1: Foundation

1. **Config & Package** (`package.json`, `.env.example`)
   - Dependencies: `express`, `mariadb`, `ejs`, `express-validator`, `uuid`, `dayjs`, `sharp`, `puppeteer`, `nodemailer`, `connect-flash`, `express-session`
   - Folder structure as above

2. **Core Files**
   - `src/config/db.js` - MariaDB pool (prepared statements)
   - `src/app.js` - Express + middleware (EJS engine, Tailwind via CDN, session, flash)
   - `src/server.js` - `app.listen(3000)`

3. **Partials**
   - Extract common layout from `mockups/dashboard.html` → `header.ejs` + `footer.ejs`
   - Style with exact Tailwind classes

### Phase 2: Dashboard

4. **Backend Dashboard**
   - `ProposalService.list(userId, status, search)` - Query proposals with filters
   - `DashboardController.getProposals(req, res)` - Fetch + render
   - Route: `GET /dashboard`

5. **Frontend Dashboard**
   - `views/commercial/dashboard.ejs` - Render proposal rows with status badges
   - Replicate mockup layout exactly (search, filters, new proposal button)

### Phase 3: Editor

6. **Backend Editor Setup**
   - `ProposalService.getById(id)` - Fetch full proposal + venues + services + items
   - `ProposalService.update(id, changes)` - Save edits (transactions)
   - `EditorController.render(req, res)` - Load editor view

7. **Frontend Editor**
   - `views/commercial/editor.ejs` - Render form sections (client info, venues, services, items, totals)
   - `public/js/editor.js` - Handle dynamic add/remove (no reload)
   - Fetch API calls to `/api/proposals/:id/calculate` for real-time totals

### Phase 4: Client View & Chat

8. **Client Magic Link**
   - `ClientController.viewProposal(hash)` - Check `is_editing`, render accordingly
   - `views/client/proposal-view.ejs` - Read-only proposal display (no edit buttons)
   - `views/client/maintenance.ejs` - Waiting screen if `is_editing = true`

9. **Chat System**
   - `ChatService` - Insert/fetch messages from DB
   - `public/js/chat.js` - Poll `/api/proposals/:hash/messages` every 30s
   - `EmailService` - Notify recipient on new message

---

## 6️⃣ KEY PATTERNS & EXAMPLES

### SQL with Prepared Statements
```javascript
// In ProposalService.js
async getProposalWithItems(proposalId) {
  const conn = await pool.getConnection();
  const proposal = await conn.query('SELECT * FROM proposals WHERE id = ?', [proposalId]);
  const items = await conn.query(
    `SELECT pi.*, so.price_pax FROM proposal_items pi
     JOIN service_options so ON pi.option_id = so.id
     WHERE so.service_id IN (SELECT id FROM proposal_services WHERE proposal_id = ?)`,
    [proposalId]
  );
  conn.end();
  return { proposal: proposal[0], items };
}
```

### Deep Clone
```javascript
// In ProposalService.duplicate(originalId)
async duplicate(originalId) {
  const conn = await pool.getConnection();
  try {
    await conn.query('START TRANSACTION');
    // 1. Copy proposal
    const [newProposal] = await conn.query(
      'INSERT INTO proposals (...) SELECT ..., UUID() FROM proposals WHERE id = ?',
      [originalId]
    );
    const newProposalId = newProposal.insertId;
    // 2. Copy venues
    await conn.query(
      'INSERT INTO proposal_venues (...) SELECT ?, venue_id, ... FROM proposal_venues WHERE proposal_id = ?',
      [newProposalId, originalId]
    );
    // 3. Copy services + options + items (recursively)
    // ...
    await conn.query('COMMIT');
    return newProposalId;
  } catch (e) {
    await conn.query('ROLLBACK');
    throw e;
  }
}
```

### Controller Validation
```javascript
// In DashboardController.js
const { validationResult, query } = require('express-validator');

router.get('/dashboard', [
  query('status').optional().isIn(['draft', 'sent', 'accepted']),
  query('search').optional().isLength({ max: 100 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  // Call service...
});
```

### Frontend Editor Interactivity
```javascript
// public/js/editor.js - Add service without reload
document.getElementById('btn-add-service').addEventListener('click', async () => {
  const title = document.getElementById('service-title').value;
  const response = await fetch(`/api/proposals/${proposalId}/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  });
  const service = await response.json();
  // Add row to DOM, then refetch totals
  updateTotals();
});
```

---

## 7️⃣ ENVIRONMENT SETUP

Create `.env`:
```
DB_HOST=localhost
DB_USER=catering_user
DB_PASS=secure_password
DB_NAME=catering_proposals

APP_DOMAIN=https://propuestas.micecatering.eu
SESSION_SECRET=your_session_secret_here

EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password

NODE_ENV=development
PORT=3000
```

---

## 8️⃣ CODING CONVENTIONS

- **Language**: Code in English; comments & logs in **SPANISH**
- **Naming**: camelCase for JS; snake_case in SQL; PascalCase for classes/services
- **Error Handling**: Services throw descriptive errors; Controllers catch + respond with HTTP codes
- **Transactions**: Use `BEGIN/COMMIT/ROLLBACK` for multi-table inserts/updates
- **Images**: Always process through Sharp before storing
- **Dates**: Use `dayjs` for formatting; store as ISO strings in DB

---

## 9️⃣ QUICK DEBUGGING CHECKLIST

- ✅ Proposal calculated totals don't match? Check `ProposalService.calculateTotals()` — VAT rates per row
- ✅ Images not displaying? Check `/public/uploads/` path; verify Sharp conversion completed
- ✅ Client stuck in maintenance? Verify `proposals.is_editing = false` in DB
- ✅ Chat not polling? Inspect `public/js/chat.js` interval; check network tab
- ✅ Scraping fails silently? Add console logs in Puppeteer error handler; test with `--show-page` arg

---

**Last Updated:** February 2026  
**Status:** Phase 1-2 (Foundation + Dashboard Ready for Implementation)
