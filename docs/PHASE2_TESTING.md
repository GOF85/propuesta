# 🧪 PHASE 2 DASHBOARD - TESTING GUIDE

## ✅ Pre-Flight Checks

Before running tests, ensure:


1. **Environment Setup**

  ```bash
  # Copy environment file
  cp .env.example .env.local
   
  # Edit .env.local with your MariaDB credentials
  nano .env.local
  ```


2. **Database Ready**

  ```bash
  # Import schema
  mysql -u root -p < database.sql
   
  # Verify tables exist
  mysql -u catering_user -p catering_proposals -e "SHOW TABLES;"
  ```


3. **Dependencies Installed**

  ```bash
  npm install
  ```

---

## 🚀 Running Tests

### Step 1: Seed Test Data
```bash
npm run seed
```

**Expected Output:**
```
🌱 Iniciando seed de datos de prueba...

👤 Insertando usuario de prueba...
✅ Usuario creado: test@example.com

📋 Insertando propuestas de prueba...
  ✅ Amazon Web Services (draft)
  ✅ Google Spain (sent)
  ✅ Microsoft Iberia (accepted)
  ✅ Telefónica S.A. (draft)

✨ Seed completado exitosamente!

📊 Datos insertados:
   - Usuario: test-user-001 (test@example.com)
   - Propuestas: 4

🚀 Accede a: http://localhost:3000/dashboard
   Usuario: test@example.com
   Contraseña: password123
```

### Step 2: Start Development Server
```bash
npm run dev
```

**Expected Output:**
```
🚀 Servidor iniciado en puerto 3000
✅ Base de datos conectada (pool: 5 conexiones)
📂 Modo: development
📝 Plantillas: EJS compiladas
🎨 Tailwind CSS: CDN

Presiona Ctrl+C para detener el servidor
```

### Step 3: Test Dashboard Access

#### Test 3A: Login Page
- **URL:** http://localhost:3000/
- **Expected:** Login form visible
- **Verify:** Header says "Iniciar Sesión", footer with branding
- **Status:** ✅ or ❌

#### Test 3B: Login with Test User
- **Action:** Enter credentials:
  - Email: `test@example.com`
  - Password: `password123`
- **Expected:** Redirect to `/dashboard`
- **Verify:** Session cookie set (httpOnly)
- **Status:** ✅ or ❌

#### Test 3C: Dashboard Main View
- **URL:** http://localhost:3000/dashboard
- **Expected Elements:**
  - ✅ Header with "Propuestas" title
  - ✅ "Nueva Propuesta" button (top right)
  - ✅ Filter tabs: Todas, Borradores, Enviadas, Aceptadas
  - ✅ Search box
  - ✅ Table with 4 proposals
  - ✅ Stats cards showing: count by status + total revenue
  - ✅ Footer visible


**Table Content Check:**

| Client | Event | Date | Pax | Venue | Total | Status | Actions |
|--------|-------|------|-----|-------|-------|--------|---------|
| Amazon Web Services | Tech Summit 2026 | 15/03/2026 | 250 | Sin venue | 15.000,50 € | 📌 Borrador | ✏️ 📋 💬 🗑️ |
| Google Spain | Annual Gala | 10/04/2026 | 180 | Sin venue | 12.500,75 € | 📤 Enviada | ✏️ 📋 💬 🗑️ |
| Microsoft Iberia | Team Building | 28/02/2026 | 120 | Sin venue | 8.750,00 € | ✅ Aceptada | ✏️ 📋 💬 🗑️ |
| Telefónica | Executive Meeting | 20/05/2026 | 95 | Sin venue | 6.200,00 € | 📌 Borrador | ✏️ 📋 💬 🗑️ |

**Status:** ✅ or ❌

#### Test 3D: Filter by Status
- **Action:** Click "Borradores" tab
- **Expected:** Only 2 proposals shown (Amazon + Telefónica)
- **URL:** http://localhost:3000/dashboard?status=draft
- **Status:** ✅ or ❌

#### Test 3E: Search Functionality
- **Action:** Type "google" in search box, press Enter
- **Expected:** Only Google Spain proposal visible
- **URL:** http://localhost:3000/dashboard?search=google
- **Status:** ✅ or ❌

#### Test 3F: Action Buttons (Hover)
- **Action:** Hover over a proposal row
- **Expected:** 
  - ✏️ Edit button (navigates to editor)
  - 📋 Duplicate button
  - 💬 Chat button
  - 🗑️ Delete button
- **Status:** ✅ or ❌

#### Test 3G: New Proposal Form
- **Action:** Click "Nueva Propuesta" button
- **URL:** http://localhost:3000/proposal/new
- **Expected Elements:**
  - ✅ Form with fields: Client Name, Event Name, Date, Pax
  - ✅ "Crear Propuesta" button
  - ✅ "Cancelar" button
  - ✅ Info box explaining next steps
- **Status:** ✅ or ❌

#### Test 3H: Create New Proposal
- **Action:** Fill form:
  - Client Name: "Test Client Company"
  - Event Name: "Team Lunch"
  - Date: 2026-06-15
  - Pax: 50
- **Click:** "Crear Propuesta" button
- **Expected:** 
  - ✅ Flash message: "Propuesta creada exitosamente"
  - ✅ Redirect to dashboard
  - ✅ New proposal appears in list (draft status)
- **Status:** ✅ or ❌

#### Test 3I: Duplicate Proposal
- **Action:** Hover over a proposal row, click "📋 Duplicate"
- **Expected:**
  - ✅ Flash message: "Propuesta duplicada"
  - ✅ New proposal appears in list with same data but new ID
  - ✅ Status is "draft"
- **Verify DB:** 

  ```bash
  mysql -u catering_user -p catering_proposals -e "SELECT id, client_name, status FROM proposals ORDER BY created_at DESC LIMIT 2;"
  ```
- **Status:** ✅ or ❌

#### Test 3J: Delete Proposal
- **Action:** Hover, click "🗑️ Delete"
- **Expected:** Confirmation message
- **Verify:** Proposal removed from list
- **DB Check:** 

  ```bash
  mysql -u catering_user -p catering_proposals -e "SELECT COUNT(*) FROM proposals WHERE status = 'draft';"
  ```
- **Status:** ✅ or ❌

#### Test 3K: Pagination (If >10 proposals)
- **Action:** Create 10+ proposals, check if pagination appears
- **Expected:** "Siguiente" button when proposals > 10
- **Status:** ✅ or ❌ (Optional)

#### Test 3L: Print View
- **Action:** Press `Ctrl+P` on dashboard
- **Expected:**
  - ✅ Buttons hidden (print:hidden)
  - ✅ Header/navbar hidden
  - ✅ Table visible and clean
  - ✅ Background removed
- **Status:** ✅ or ❌

---

## 🔍 API Endpoint Tests (Using curl)

### Test API-1: Get Dashboard Data
```bash
curl -H "Cookie: sessionid=YOUR_SESSION" \
  http://localhost:3000/dashboard?status=draft
```

**Expected:** 200 OK + HTML response with draft proposals

### Test API-2: Create Proposal
```bash
curl -X POST http://localhost:3000/proposal \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionid=YOUR_SESSION" \
  -d '{
    "client_name": "API Test Client",
    "event_name": "API Test Event",
    "event_date": "2026-07-01",
    "pax": 100
  }'
```

**Expected:** 201 Created + redirect to dashboard

### Test API-3: Update Status (AJAX)
```bash
curl -X POST http://localhost:3000/proposal/PROPOSAL_ID/status \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionid=YOUR_SESSION" \
  -d '{"status": "sent"}'
```

**Expected:** 200 OK + JSON: `{"success": true, "status": "sent"}`

---

## 📊 Database Verification

### Check Users

```sql
SELECT * FROM users;
-- Should show: test-user-001 | test@example.com | commercial
```

### Check Proposals

```sql
SELECT 
  id, 
  client_name, 
  status, 
  pax, 
  total_estimated, 
  created_at 
FROM proposals 
ORDER BY created_at DESC;
```

**Expected:** 4+ proposals with correct status distribution

### Check Stats

```sql
-- Count by status
SELECT status, COUNT(*) as count FROM proposals GROUP BY status;

-- Total confirmed revenue (accepted only)
SELECT SUM(total_estimated) FROM proposals WHERE status = 'accepted';
```

---

## 🐛 Troubleshooting

### Issue: "Database connection failed"
```bash
# Verify MariaDB running
mysql -u root -p -e "SELECT VERSION();"

# Check credentials in .env.local
cat .env.local | grep DB_
```

### Issue: "Cannot find module 'mariadb'"
```bash
npm install mariadb
```

### Issue: "EJS template not found"
```bash
# Verify file exists
ls -la views/commercial/dashboard.ejs
ls -la views/partials/header.ejs
```

### Issue: "Session/Cookie not set"
- Check browser DevTools → Application → Cookies
- Verify `sessionid` cookie present with httpOnly flag
- Check `.env.local` has `SESSION_SECRET` set

### Issue: "Flash messages not appearing"
- Verify `connect-flash` middleware in app.js
- Check `res.locals.messages` in controller
- Verify partial: `views/partials/flash-messages.ejs`

### Issue: "Styling broken (no Tailwind)"
- Verify `<script src="https://cdn.tailwindcss.com"></script>` in header.ejs
- Check browser DevTools → Network → tailwindcss CDN loaded
- Manually add inline styles if CDN fails

---

## ✅ Test Completion Checklist

- [ ] ✅ Seed data inserted successfully
- [ ] ✅ Dev server starts without errors
- [ ] ✅ Login page accessible
- [ ] ✅ Login with test credentials works
- [ ] ✅ Dashboard displays 4 proposals
- [ ] ✅ Filter by status works
- [ ] ✅ Search box works
- [ ] ✅ New Proposal form accessible
- [ ] ✅ Create new proposal works
- [ ] ✅ Duplicate proposal works
- [ ] ✅ Delete proposal works
- [ ] ✅ Print view clean
- [ ] ✅ All styling correct (Tailwind)
- [ ] ✅ Database data verified
- [ ] ✅ Sessions/cookies working
- [ ] ✅ Error handling working

---

## 🎯 Success Criteria

**Phase 2 Dashboard is COMPLETE when:**
- ✅ All 16 tests pass
- ✅ Dashboard renders 4 proposals from seed data
- ✅ All CRUD operations work (Create, Read, Update, Delete)
- ✅ Filters and search functional
- ✅ Print view clean
- ✅ No console errors
- ✅ Database integrity verified
- ✅ Performance acceptable (<500ms load time)

---

## 📝 Notes

- Tests assume `.env.local` properly configured
- Database must be pre-seeded with schema from `database.sql`
- Session timeout is 24 hours (from Phase 1 middleware)
- All timestamps use UTC in database, displayed in ES locale in UI
- Currency formatted as "1.234,56 €" per Spanish locale

---

**Test Date:** ___________  
**Tester:** ___________  
**Result:** ✅ PASS / ❌ FAIL  
**Issues Found:** ___________  
