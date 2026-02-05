# 🚀 DEVELOPMENT GUIDE - MICE CATERING PROPOSALS

## Local Setup (macOS/Linux)

### Prerequisites
- Node.js v20+
- MariaDB 10.5+ o MySQL 8.0+
- npm o yarn

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create MariaDB Database
```bash
# Accede a MariaDB
mysql -u root -p

# Crea usuario y BD
CREATE USER 'catering_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON catering_proposals.* TO 'catering_user'@'localhost';
FLUSH PRIVILEGES;

# Importa schema
mysql -u catering_user -p catering_proposals < database.sql
```

### Step 3: Configure Environment
```bash
# Copia y personaliza .env
cp .env.example .env

# Variables críticas:
# - DB_HOST, DB_USER, DB_PASS, DB_NAME (tu MariaDB local)
# - APP_DOMAIN (http://localhost:3000 en dev)
# - SESSION_SECRET (cualquier string seguro)
# - EMAIL_USER, EMAIL_PASS (Gmail - solo en producción)
```

### Step 4: Start Dev Server
```bash
npm run dev
```

Visita: `http://localhost:3000`

---

## Project Architecture

```
Service Pattern:

Route (endpoint definition)
  ↓
Controller (validate request, call service, format response)
  ↓
Service (all business logic + SQL queries)
  ↓
Database (MariaDB - native SQL with prepared statements)
```

**Key Rules:**
- ✅ **Controllers:** Validate input, catch errors, return responses
- ✅ **Services:** ONLY place for SQL + business logic
- ✅ **Routes:** Define endpoints, no logic
- ✅ **Views:** EJS templates with Tailwind CSS (CDN)

---

## Phase 1-2: What's Already Done ✅

- [x] `package.json` with all dependencies
- [x] `src/config/db.js` - MariaDB pool (prepared statements)
- [x] `src/app.js` - Express setup + middleware + EJS
- [x] `src/server.js` - Entry point
- [x] `src/config/constants.js` - App constants
- [x] `src/config/utils.js` - Helper functions
- [x] `src/middleware/auth.js` - Authentication & authorization
- [x] `src/middleware/maintenance.js` - Maintenance mode check
- [x] `views/partials/` - Reusable components (header, footer, flash)
- [x] `views/errors/` - Error pages (404, 500, 403)
- [x] `views/client/maintenance.ejs` - Waiting screen
- [x] `public/js/utils.js` - Client-side helpers
- [x] `public/css/tailwind.css` - Custom styles

---

## Phase 3: Next Steps (Dashboard)

### 1. Create ProposalService
**File:** `src/services/ProposalService.js`

```javascript
class ProposalService {
  async listProposals(userId, filters = {}) {
    // Query with status, search filters
  }
  
  async getProposalById(id) {
    // Full proposal + venues + services + items
  }
  
  async createProposal(data) {
    // INSERT + generate unique hash
  }
  
  async calculateTotals(id) {
    // CRITICAL: All pricing logic here
    // VAT: 10% (services) vs 21% (food)
  }
}
```

### 2. Create DashboardController
**File:** `src/controllers/dashboardController.js`

```javascript
class DashboardController {
  async getProposals(req, res) {
    const proposals = await ProposalService.listProposals(req.session.user.id, req.query);
    res.render('commercial/dashboard', { proposals });
  }
}
```

### 3. Create Routes
**File:** `src/routes/dashboard.js`

```javascript
router.get('/dashboard', authenticateUser, DashboardController.getProposals);
```

### 4. Integrate in app.js
```javascript
const dashboardRoutes = require('./routes/dashboard');
app.use('/', dashboardRoutes);
```

### 5. Create Dashboard View
**File:** `views/commercial/dashboard.ejs`

Use exact Tailwind classes from `mockups/dashboard.html`:
- Search bar, filters, proposal table
- Status badges (draft, sent, accepted)
- Action buttons (edit, duplicate, chat, delete)

---

## Important Patterns

### Prepared Statements (SQL Security)
```javascript
const [result] = await pool.query(
  'SELECT * FROM proposals WHERE id = ? AND user_id = ?',
  [proposalId, userId]  // Values, NOT interpolated
);
```

### Try-Finally Connection Management
```javascript
const conn = await pool.getConnection();
try {
  const data = await conn.query('...');
  return data;
} finally {
  conn.end();
}
```

### Service Error Handling
```javascript
// Services throw descriptive errors
throw new Error('Propuesta no encontrada');

// Controllers catch and format
catch (err) {
  req.flash('error', err.message);
  res.status(404).render('errors/404');
}
```

### Flash Messages in Views
```ejs
<%- include('partials/flash-messages') %>

<!-- In Controller:
req.flash('success', 'Propuesta guardada');
res.redirect('/dashboard');
-->
```

---

## Database Schema Overview

```sql
proposals
  ├── id, unique_hash, client_name, event_date, pax
  ├── status (draft|sent|accepted)
  ├── is_editing (maintenance mode)
  └── FOREIGN KEY user_id → users

proposal_venues
  ├── proposal_id → proposals
  ├── venue_id → venues (catalog)
  └── is_selected

proposal_services
  ├── proposal_id → proposals
  ├── title, type, vat_rate (10 or 21)
  └── service_options

service_options
  ├── service_id → proposal_services
  ├── name, price_pax, discount_pax
  └── proposal_items

proposal_items (deep copy of dishes)
  ├── option_id → service_options
  ├── name, allergens, badges, image_url
  └── (isolated from catalog)

messages (chat)
  ├── proposal_id → proposals
  ├── sender_role (commercial|client)
  └── message_body, is_read, created_at
```

---

## Debugging Commands

```bash
# Test health endpoint
curl http://localhost:3000/health

# Check DB connection
# (Will see "Conexión a MariaDB exitosa" in logs)

# View MariaDB tables
mysql -u catering_user -p catering_proposals
SHOW TABLES;
DESC proposals;

# Test Service
node -e "
  require('dotenv').config();
  const { pool } = require('./src/config/db');
  pool.query('SELECT 1').then(r => console.log(r)).catch(e => console.error(e));
"
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| "ECONNREFUSED" on startup | MariaDB not running. Start: `brew services start mariadb` or Docker |
| "ER_NO_DB_ERROR" | Database not imported. Run `mysql ... < database.sql` |
| "EJS syntax error" | Check `<%` vs `<%=` (output vs non-output tags) |
| Images not displaying | Check `/public/uploads` path permissions |
| Session lost on reload | Check `SESSION_SECRET` in `.env` |

---

## VS Code Extensions (Recommended)

- **MySQL** (by cweijan)
- **EJS Language Support** (by DigitalBrainstem)
- **Thunder Client** (API testing)
- **Tailwind CSS IntelliSense** (class autocompletion)

---

## Performance Tips

- Use **prepared statements** (already set up)
- Implement **pagination** for large result sets
- Use **database indexes** on frequently queried fields
- Cache **static files** (images, CSS, JS)
- Use **connection pooling** (already configured)

---

## Production Checklist

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Use PM2 for process management: `npm run prod`
- [ ] Set secure `SESSION_SECRET` (random 32+ chars)
- [ ] Configure HTTPS (Nginx reverse proxy)
- [ ] Set up email service (Nodemailer + Gmail App Password)
- [ ] Enable database backups
- [ ] Monitor logs with PM2
- [ ] Use environment-specific `.env` files

---

**Happy Coding! 🚀**

For questions, check `PROJECT.md` and `.github/copilot-instructions.md`
