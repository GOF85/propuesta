# 🧪 Venues Management - Testing Guide

**Date:** February 6, 2026  
**Version:** 1.0  
**Target:** All three features (Manual, CSV, List)

---

## 📋 Pre-Testing Setup

### 1. Verify Database

```bash
# Connect to MariaDB
mysql -u root -p

# Check venues table exists
USE catering_proposals;
DESCRIBE venues;

# Should show columns:
# - id (int, primary key)
# - name (varchar)
# - description (text)
# - address (varchar)
# - capacity_cocktail, capacity_banquet, capacity_theater (int)
# - features (json or text)
# - external_url (varchar)
# - created_at (timestamp)
```

### 2. Start Server

```bash
cd /Users/guillermo/mc/propuesta
npm start
```

**Expected Output:**
```
✅ MariaDB connected (pool ready)
🚀 Server running on http://localhost:3000
📁 Session store ready
```

### 3. Login as Admin

```
URL: http://localhost:3000/login
Email: admin@micecatering.eu
Password: admin123
```

Then navigate to: `/admin/venues`

---

## ✅ Test 1: Manual Venue Creation

### Steps

1. **Click "✏️ Crear Manualmente" card**
   - Expected: Tab switches to form section
   - Verify: Form is visible with all fields

2. **Fill form fields**
   ```
   Nombre: Test Venue 01
   Dirección: Calle Test 123, Madrid
   Descripción: Test venue for validation
   Capacidades:
     - Cóctel: 100
     - Banquete: 80
     - Teatro: 120
   Características: WiFi, Parking, AC
   URL Externa: https://testvenue.com
   ```

3. **Click "✅ Guardar Venue"**
   - Expected: Form submits without error
   - Check Console (F12): No errors in network tab
   - Monitor Network tab:
     - POST `/api/admin/venues/manual` 
     - Status: 200 
     - Response: `{"success": true, "venue_id": "uuid..."}`

4. **Verify Success**
   - Alert appears: "✅ Venue 'Test Venue 01' created"
   - Page reloads automatically
   - New venue appears in list

5. **Check Database**
   ```sql
   SELECT * FROM venues WHERE name = 'Test Venue 01';
   ```
   Should return one row with all entered data.

---

## ✅ Test 2: CSV Template Download

### Steps

1. **Click "📥 Importar CSV" card**
   - Expected: Tab switches to CSV import section
   - Verify: "📄 Descargar Template" button visible

2. **Click "📄 Descargar Template"**
   - Browser: File download popup appears
   - File name: `venues-template.csv`
   - File size: ~500 bytes

3. **Open Downloaded File**
   - Tool: Excel, Google Sheets, or text editor
   - Expected content:
   ```csv
   name,description,address,capacity_cocktail,capacity_banquet,capacity_theater,features,external_url
   Hotel Palace,Elegant hall with park view,Gran Vía 25 Madrid,200,150,300,Wifi;Parking,https://hotelpalace.es
   Salón Ballroom,Modern space for events,Plaza Mayor 10 Madrid,300,250,400,AC;WiFi,https://ballroom.es
   Centro Congresos,Large congress center,Paseo Castellana 50 Madrid,500,400,600,WiFi;Parking,https://congresos.es
   ```

4. **Verify Data Integrity**
   - Check: All 8 columns present
   - Check: 3 example venues included
   - Check: No special characters breaking CSV

---

## ✅ Test 3: CSV Import (Drag & Drop)

### Steps

1. **Prepare Test CSV**
   - Copy template
   - Edit example rows with new data:
   ```csv
   name,description,address,capacity_cocktail,capacity_banquet,capacity_theater,features,external_url
   Test Hotel A,Test description A,Madrid Test 1,150,120,180,WiFi;Parking,https://test-a.com
   Test Venue B,Test description B,Barcelona Test 2,200,160,250,AC;WiFi,https://test-b.com
   Test Center C,Test description C,Valencia Test 3,300,250,400,Parking;WiFi,https://test-c.com
   ```
   - Save as `test-import.csv`

2. **Drag & Drop File**
   - Click "📥 Importar CSV" card
   - Look for upload area
   - Drag `test-import.csv` onto the area
   - Expected: File accepted (visual feedback: "✅ File ready to upload")

3. **Upload Starts Automatically**
   - Expected: Progress bar appears (0% → 100%)
   - Speed: Should complete in 1-3 seconds
   - Console: No errors

4. **Monitor Network Tab** (F12 → Network)
   - POST endpoint: Likely `/admin/venues/import`
   - Status: 200
   - Response includes statistics:
   ```json
   {
     "success": true,
     "imported": 3,
     "updated": 0,
     "total": 3,
     "message": "✅ 3 venues importados"
   }
   ```

5. **Verify Results Display**
   - Statistics cards appear:
     - "Nuevos: 3" (green)
     - "Actualizados: 0" (blue)
     - "Total: 3" (amber)
   - Message: "✅ 3 venues importados"

6. **Click "Recargar" or wait for auto-reload**
   - Page refreshes
   - New venues appear in "Gestionar" list

7. **Verify Database**
   ```sql
   SELECT COUNT(*) FROM venues WHERE name LIKE 'Test%';
   ```
   Should return at least 3.

---

## ✅ Test 4: CSV Import (Click to Browse)

### Steps

1. **In CSV Import tab**
   - Click upload area (if no drag-drop available)
   - File browser opens
   - Select `test-import.csv`

2. **Upload Process**
   - Same as Test 3 (progress bar, results display)
   - Should complete successfully

---

## ✅ Test 5: Venues List Display

### Steps

1. **Click "⚙️ Gestionar" card**
   - Expected: Switches to venues list tab
   - Tab shows all venues in grid

2. **Visual Verification**
   - Grid layout shows multiple venue cards
   - Desktop: 3 columns
   - Tablet: 2 columns
   - Mobile: 1 column full-width

3. **Each Venue Card Shows:**
   - ✅ Name (bold, large)
   - ✅ Address (smaller text)
   - ✅ Capacities with emojis:
     - 🍸 Cóctel: [number]
     - 🍽️ Banquete: [number]
     - 🎭 Teatro: [number]
   - ✅ Delete button (red, trash icon)

4. **Empty State** (if no venues)
   - Message: "No hay venues aún. ¿Quieres crear uno?"
   - Links to manual form

---

## ✅ Test 6: Delete Venue

### Steps

1. **In Venues List**
   - Find a test venue (e.g., "Test Venue 01")
   - Click "🗑️ Eliminar" button

2. **Confirmation Dialog**
   - Browser asks: "¿Estás seguro de eliminar Test Venue 01?"
   - Click "OK" to confirm
   - Or "Cancel" to abort

3. **After Deletion**
   - Venue card disappears
   - Page may reload automatically
   - Status badge updates (fewer total)

4. **Verify Database**
   ```sql
   SELECT * FROM venues WHERE id = 'uuid-here';
   ```
   Should return empty (venue deleted).

---

## ✅ Test 7: Form Validation

### Steps - Required Field Check

1. **Manual Form - Leave Name Empty**
   - Click all other fields (address, description, etc.)
   - Don't fill "Nombre"
   - Click "✅ Guardar"
   - Expected: Error message:
     ```
     ❌ El campo 'Nombre' es requerido
     ```
   - Form doesn't submit

2. **Manual Form - Invalid URL**
   - Fill: `https://` (incomplete)
   - Or: `just-text` (not a URL)
   - Click Save
   - Expected: Validation error in console or alert

### Steps - CSV Validation

1. **Upload Invalid CSV**
   - Missing required column (e.g., no "name" column)
   - File: `invalid.csv`
   - Upload
   - Expected: Error message showing which columns are missing

2. **Upload Oversized File**
   - File > 50MB
   - Upload
   - Expected: Error: "File too large. Max 50MB allowed."

---

## ✅ Test 8: Responsive Design

### Mobile Testing (< 768px)

1. **Use Chrome DevTools**
   - F12 → Toggle device toolbar
   - Select "iPhone 12" (390px width)

2. **Manual Form**
   - All fields stack vertically
   - Input fields full width
   - Buttons readable (no overflow)

3. **CSV Import**
   - Upload area visible
   - No horizontal scroll
   - Stats cards stack vertically

4. **Venues List**
   - Grid: 1 column (full width)
   - Cards readable at small size
   - Venue name, address, capacities all visible

### Tablet Testing (768px - 1024px)

1. **DevTools → iPad (768px)**
   - Manual form: 2 columns for capacities
   - CSV stats: 2 rows instead of 3 cols
   - Venues grid: 2 columns

### Desktop Testing (1200px+)

1. **Full browser window**
   - Manual form: Clean layout
   - Venues grid: 3 columns
   - Everything properly spaced

---

## ✅ Test 9: Session & Auth

### Steps

1. **Check Admin Access**
   - Navigate: `http://localhost:3000/admin/venues`
   - Without login: Should redirect to `/login`
   - After login as admin: Should show venues page

2. **Commercial User Access**
   - Login as commercial user (different role)
   - Try to access `/admin/venues`
   - Expected: 403 Forbidden error

3. **Session Timeout**
   - Login
   - Open browser DevTools → Application → Cookies
   - Delete session cookie
   - Refresh page
   - Expected: Redirect to login

---

## ✅ Test 10: Error Scenarios

### Database Connection Lost

1. **Stop MariaDB**
   ```bash
   # macOS
   brew services stop mariadb
   # or
   mysql.server stop
   ```

2. **Try Manual Create**
   - Fill form
   - Click Save
   - Expected: Error message (database error)
   - Check server console: Error logged with details

3. **Restart MariaDB**
   ```bash
   # macOS
   brew services start mariadb
   # or
   mysql.server start
   ```

### Invalid File Upload

1. **Upload Non-CSV**
   - Try: `.xlsx`, `.txt`, `.jpg`, `.pdf`
   - Expected: Error message: "Only CSV files allowed"

2. **Upload Corrupted CSV**
   - Create text file: `broken.csv`
   - Content: Random text (not CSV format)
   - Upload
   - Expected: Parsing error with details (missing columns, etc.)

---

## 📊 Testing Checklist

| Test | Pass | Notes |
|------|------|-------|
| Manual venue creation | ☐ | Form submits, venue created |
| Form validation (required) | ☐ | Shows error for empty name |
| CSV template download | ☐ | File has 3 examples |
| CSV drag & drop | ☐ | Accepts file, shows progress |
| CSV browse upload | ☐ | File dialog opens |
| CSV import statistics | ☐ | Shows new/updated/total |
| Venues list display | ☐ | Grid shows all venues |
| Delete venue | ☐ | Confirmation dialog works |
| Mobile responsive | ☐ | 1 column on mobile |
| Tablet responsive | ☐ | 2 columns on tablet |
| Auth check (admin only) | ☐ | Non-admin get 403 |
| Database error handling | ☐ | Shows error message |
| Invalid file rejection | ☐ | CSV validation works |
| Form submission timing | ☐ | No race conditions |
| Success notifications | ☐ | Messages appear/disappear |

---

## 🐛 Debugging Tips

### Console Errors

```javascript
// In browser console (F12 → Console)
// Check for JavaScript errors:
// 1. Undefined functions
// 2. Fetch errors
// 3. Missing elements
```

### Network Issues

```bash
# Check server logs
# Look for POST errors to endpoints:
# /api/admin/venues/manual
# /admin/venues/import
```

### Database Issues

```sql
-- In MySQL
SELECT * FROM venues;
-- Verify table structure
DESCRIBE venues;
-- Check for data corruption
SELECT DISTINCT name FROM venues;
```

---

## 📸 Screenshots for Documentation

After testing, capture:
1. ✏️ Manual form filled out
2. 📥 CSV template opened in Excel
3. 📤 Drag-drop area with file
4. 📊 Import statistics displayed
5. 📍 Venues list grid view
6. 📱 Mobile responsive view

---

## ✅ Sign-Off

When all tests pass:

```
✅ Manual venue creation: WORKING
✅ CSV template download: WORKING
✅ CSV import (drag-drop): WORKING
✅ CSV import (browse): WORKING
✅ Venues list display: WORKING
✅ Delete functionality: WORKING
✅ Form validation: WORKING
✅ Responsive design: WORKING
✅ Auth enforcement: WORKING
✅ Error handling: WORKING

🎉 ALL TESTS PASSED - READY FOR PRODUCTION
```

---

**Created:** February 6, 2026  
**Updated:** [as needed]  
**QA Sign-Off:** ☐ Pending

