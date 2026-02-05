# 🎯 NEXT STEPS - Phase 2: Dashboard Implementation

**Status:** Phase 1 Foundation ✅ COMPLETE  
**Current Date:** February 5, 2026  
**Estimated Duration:** 3-4 days

---

## 📋 Overview

Phase 1 provided a solid foundation. Now we implement the **Dashboard** - the first user-facing feature where commercial team members can:
- See all their proposals
- Filter by status (draft, sent, accepted)
- Search by client/venue
- Perform actions (edit, duplicate, delete, chat)

---

## 🔨 Implementation Order

### Step 1: Create ProposalService (Backend Logic)
**File:** `src/services/ProposalService.js`  
**Time:** ~1 hour

```javascript
class ProposalService {
  // Core methods needed:
  async listProposals(userId, filters = {}) {
    // Query with WHERE filters
    // Return: Array of proposals with venue names, totals
  }
  
  async getProposalById(id, userId) {
    // Fetch full proposal (venues, services, items)
  }
  
  async createProposal(userId, data) {
    // INSERT new proposal + generate unique_hash
  }
  
  async calculateTotals(proposalId) {
    // CRITICAL: Calculate price + VAT
    // VAT: 10% (services) vs 21% (food)
  }
}
module.exports = new ProposalService();
```

**SQL Queries Needed:**
```sql
-- List proposals with filters
SELECT p.*, COUNT(pv.id) as venue_count
FROM proposals p
LEFT JOIN proposal_venues pv ON p.id = pv.proposal_id
WHERE p.user_id = ? AND p.status = ?
GROUP BY p.id
ORDER BY p.created_at DESC
LIMIT ? OFFSET ?;

-- Get proposal with all relationships
SELECT p.*, 
       GROUP_CONCAT(DISTINCT v.name) as venue_names,
       COUNT(ps.id) as service_count
FROM proposals p
LEFT JOIN proposal_venues pv ON p.id = pv.proposal_id
LEFT JOIN venues v ON pv.venue_id = v.id
LEFT JOIN proposal_services ps ON p.id = ps.proposal_id
WHERE p.id = ?
GROUP BY p.id;
```

---

### Step 2: Create DashboardController (HTTP Handler)
**File:** `src/controllers/dashboardController.js`  
**Time:** ~30 minutes

```javascript
const { validationResult, query } = require('express-validator');
const ProposalService = require('../services/ProposalService');

class DashboardController {
  async getProposals(req, res, next) {
    try {
      // Validate query params
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      // Extract filters
      const { status, search, page = 1 } = req.query;
      const userId = req.session.user.id;
      
      // Fetch data
      const proposals = await ProposalService.listProposals(userId, {
        status: status || 'all',
        search,
        page
      });
      
      // Render
      res.render('commercial/dashboard', {
        proposals,
        currentFilter: status || 'all',
        searchTerm: search || ''
      });
    } catch (err) {
      next(err); // Goes to global error handler
    }
  }
}

module.exports = new DashboardController();
```

---

### Step 3: Create Route
**File:** `src/routes/dashboard.js`  
**Time:** ~15 minutes

```javascript
const express = require('express');
const { query } = require('express-validator');
const { authenticateUser } = require('../middleware/auth');
const DashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.get('/dashboard',
  authenticateUser,
  [
    query('status').optional().isIn(['draft', 'sent', 'accepted', 'all']),
    query('search').optional().trim().isLength({ max: 100 }),
    query('page').optional().isInt({ min: 1 })
  ],
  DashboardController.getProposals
);

module.exports = router;
```

**In `src/routes/index.js`:**
```javascript
const dashboardRoutes = require('./dashboard');
router.use('/', dashboardRoutes);
```

---

### Step 4: Create Dashboard View
**File:** `views/commercial/dashboard.ejs`  
**Time:** ~1.5 hours

**Template structure** (copy Tailwind classes from `mockups/dashboard.html`):

```ejs
<%- include('../partials/header') %>

<main class="max-w-7xl mx-auto px-6 py-8">
  <%- include('../partials/flash-messages') %>
  
  <!-- Header -->
  <div class="flex justify-between items-end mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Mis Propuestas</h1>
    <a href="/proposal/new" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium">
      + Nueva Propuesta
    </a>
  </div>
  
  <!-- Filters -->
  <form method="GET" class="flex gap-2 mb-6 border-b border-gray-200 pb-4">
    <a href="?status=all" class="px-4 py-2 <%= currentFilter === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500' %>">
      Todas
    </a>
    <a href="?status=draft" class="px-4 py-2 <%= currentFilter === 'draft' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500' %>">
      Borradores
    </a>
    <a href="?status=sent" class="px-4 py-2 <%= currentFilter === 'sent' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500' %>">
      Enviadas
    </a>
    <a href="?status=accepted" class="px-4 py-2 <%= currentFilter === 'accepted' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500' %>">
      Aceptadas
    </a>
    
    <input type="text" name="search" value="<%= searchTerm %>" placeholder="Buscar..." class="ml-auto pl-4 pr-4 py-2 border rounded-lg">
    <button type="submit" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">Buscar</button>
  </form>
  
  <!-- Table -->
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <table class="w-full">
      <thead class="bg-gray-50 border-b border-gray-200">
        <tr>
          <th class="p-4 text-left text-xs font-semibold text-gray-500">Cliente / Evento</th>
          <th class="p-4 text-left text-xs font-semibold text-gray-500">Fecha</th>
          <th class="p-4 text-left text-xs font-semibold text-gray-500">Venue</th>
          <th class="p-4 text-right text-xs font-semibold text-gray-500">Total</th>
          <th class="p-4 text-center text-xs font-semibold text-gray-500">Estado</th>
          <th class="p-4 text-right text-xs font-semibold text-gray-500">Acciones</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <% proposals.forEach(p => { %>
        <tr class="hover:bg-gray-50">
          <td class="p-4">
            <div class="font-bold text-gray-900"><%= p.client_name %></div>
            <div class="text-gray-500 text-sm"><%= p.event_name %></div>
          </td>
          <td class="p-4 text-gray-600"><%= formatDate(p.event_date) %></td>
          <td class="p-4 text-gray-600"><%= p.venue_names || 'Sin definir' %></td>
          <td class="p-4 text-right font-medium"><%= formatCurrency(p.total) %></td>
          <td class="p-4 text-center">
            <span class="badge badge-<%= p.status %>"><%= statusLabel(p.status) %></span>
          </td>
          <td class="p-4 text-right">
            <div class="flex justify-end gap-2">
              <a href="/proposal/<%= p.id %>/edit" class="text-gray-400 hover:text-blue-600">✏️</a>
              <a href="/proposal/<%= p.id %>/duplicate" class="text-gray-400 hover:text-green-600">📋</a>
              <a href="/proposal/<%= p.id %>/chat" class="text-gray-400 hover:text-purple-600">💬</a>
              <a href="/proposal/<%= p.id %>/delete" onclick="return confirm('¿Eliminar propuesta?')" class="text-gray-400 hover:text-red-600">🗑️</a>
            </div>
          </td>
        </tr>
        <% }) %>
      </tbody>
    </table>
    
    <% if (proposals.length === 0) { %>
    <div class="p-8 text-center text-gray-500">
      <p>No hay propuestas. <a href="/proposal/new" class="text-blue-600">Crear una nueva</a></p>
    </div>
    <% } %>
  </div>
</main>

<%- include('../partials/footer') %>
```

---

### Step 5: Integrate in App
**File:** `src/app.js`

```javascript
const dashboardRoutes = require('./routes/dashboard');
app.use('/', dashboardRoutes);
```

---

### Step 6: Add Formatting Utilities to Views
**In `src/app.js` middleware section:**

```javascript
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  // ... existing code ...
  
  // Add view helpers
  res.locals.formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };
  
  res.locals.formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  res.locals.statusLabel = (status) => {
    const labels = {
      'draft': 'Borrador',
      'sent': 'Enviada',
      'accepted': 'Aceptada'
    };
    return labels[status] || status;
  };
  
  next();
});
```

---

## ✅ Checklist

Before starting Phase 2, verify Phase 1:
- [ ] `npm install` completed
- [ ] `.env` configured with MariaDB credentials
- [ ] Database imported: `mysql ... < database.sql`
- [ ] Health check passes: `curl http://localhost:3000/health`
- [ ] `bash HEALTH_CHECK.sh` shows all green

Phase 2 Implementation:
- [ ] ProposalService created with all methods
- [ ] DashboardController created
- [ ] Dashboard route created
- [ ] Dashboard view created (EJS template)
- [ ] Routes integrated in app.js
- [ ] View helpers added to middleware
- [ ] Tested: Can list mock proposals
- [ ] Tested: Filters work (status, search)
- [ ] Tested: Status badges display correctly
- [ ] Tested: Currency formatting works
- [ ] Tested: Action buttons are clickable

---

## 🧪 Testing Phase 2

### Manual Testing
```bash
# 1. Start server
npm run dev

# 2. Insert test data (use MySQL)
INSERT INTO users (name, email, password_hash, role) 
VALUES ('Juan Test', 'juan@test.com', 'hash', 'commercial');

INSERT INTO proposals (user_id, unique_hash, client_name, event_date, pax, status)
VALUES (1, UUID(), 'Test Client', '2026-06-15', 100, 'draft');

# 3. Visit
http://localhost:3000/dashboard

# 4. Should see:
- Table with proposals
- Filters working
- Status badges
- Action buttons
```

### Unit Testing (Optional for Phase 2)
You can add `jest` + `supertest` later, but Phase 2 doesn't require it.

---

## 📊 Expected Files After Phase 2

```
src/
├── services/
│   └── ProposalService.js      ← NEW
├── controllers/
│   └── dashboardController.js  ← NEW
└── routes/
    ├── index.js                (updated)
    └── dashboard.js            ← NEW

views/commercial/
└── dashboard.ejs               ← NEW
```

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Run `npm install` again |
| 404 on /dashboard | Check route registration in app.js |
| Empty table | Insert test data in MySQL |
| Styling looks wrong | Check Tailwind CDN link in header.ejs |
| Filters not working | Check query parameter validation |

---

## 📚 Reference Files

- **SQL Schema:** [database.sql](./database.sql)
- **UI Mockup:** [mockups/dashboard.html](./mockups/dashboard.html)
- **Code Patterns:** [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- **Constants:** [src/config/constants.js](./src/config/constants.js)

---

## 🎯 After Phase 2

Once Dashboard is complete:
- Phase 3: Editor (edit/create proposals)
- Phase 4: Client View + Chat

---

**Good luck! 🚀 Contact if you hit any blockers.**
