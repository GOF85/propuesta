# 🧪 PHASE 3: EDITOR - TESTING GUIDE

**Date:** Today  
**Phase:** Phase 3 (Editor Implementation)  
**Scope:** Editor backend + frontend integration

---

## 🎯 TESTING OVERVIEW

Phase 3 implements the **Proposal Editor** - a full-featured interface for editing proposals with:

**Total Test Cases:** 20 (organized by feature)
---

## 📋 PRE-TEST CHECKLIST

Before running tests:

```bash
# 1. Start database
# mysql -u root -p < database.sql

# 2. Install dependencies (if not already)
# npm install

# 3. Seed test data
npm run seed

# 4. Start server
npm start
# Should see: "✅ Server running on http://localhost:3000"

# 5. Login with test user
# Email: test@example.com
# Password: password123
```

---

## 🧪 TEST CASES BY FEATURE

### A. EDITOR VIEW LOADING (3 test cases)

#### T1: Load Editor View

**Objective:** Verify editor page loads with all proposal data

**Steps:**

1. Login with test user
2. Go to Dashboard
3. Click "Edit" on any proposal
4. Verify redirect to `/proposal/:id/edit`

**Expected Results:**

- ✅ Editor view renders
- ✅ Form fields populated with proposal data
- ✅ Venues table shows existing venues
- ✅ Services table shows existing services
- ✅ Financial sidebar shows correct totals
- ✅ Status badge displays current status

**Command:**

```bash
curl http://localhost:3000/proposal/1/edit \
  -H "Cookie: connect.sid=<your_session_id>"
```

---

#### T2: Verify Permission Check

**Objective:** User cannot edit proposals from other users

**Steps:**

1. Login as different user (if available)
2. Try to access `/proposal/1/edit` directly (where 1 is another user's proposal)

**Expected Results:**

- ✅ 403 Forbidden response
- ✅ Error message: "No permitido" or similar

---

#### T3: Load Non-Existent Proposal

**Objective:** Graceful error handling for missing proposals

**Steps:**

1. Login with test user
2. Navigate to `/proposal/99999/edit`

**Expected Results:**

- ✅ 404 error page
- ✅ Message: "Propuesta no encontrada"

---

### B. BASIC INFORMATION EDITING (4 test cases)

#### T4: Edit Client Name

**Objective:** Save changes to proposal basic info

**Steps:**

1. Load editor
2. Change "Cliente" field: `Test Client → Updated Client`
3. Click "💾 Guardar Cambios"

**Expected Results:**

- ✅ Success notification appears (top-right)
- ✅ Button shows "✓ Guardado"
- ✅ Changes persist (reload page and verify)
- ✅ Database updated

**Verify:**

```sql
SELECT client_name FROM proposals WHERE id = 1;
-- Should show: "Updated Client"
```

---

#### T5: Edit PAX and Auto-Calculate Totals

**Objective:** Changing PAX automatically recalculates totals

**Steps:**

1. Load editor
2. Change PAX: `50 → 100`
3. Wait 1 second (auto-calculate triggered)

**Expected Results:**

- ✅ Financial sidebar updates automatically
- ✅ Total shows new calculation: base × 100 pax
- ✅ No manual button click needed

---

#### T6: Edit Event Date

**Objective:** Save event date changes

**Steps:**

1. Load editor
2. Change Event Date to future date
3. Click Save
4. Reload page

**Expected Results:**

- ✅ Changes saved
- ✅ Date persists after reload
- ✅ Format displayed correctly (es-ES locale)

---

#### T7: Edit Legal Conditions

**Objective:** Save multi-line text field

**Steps:**

1. Load editor
2. Click Legal Conditions field
3. Enter: `"Pago 50% al confirmar, 50% una semana antes"`
4. Click Save

**Expected Results:**

- ✅ Text saved with line breaks
- ✅ Text persists after reload
- ✅ No truncation or encoding issues

---

### C. VENUE MANAGEMENT (4 test cases)

#### T8: Add Venue

**Objective:** Add venue to proposal from dropdown

**Steps:**

1. Load editor
2. Click Venues section
3. Select venue from dropdown (e.g., "Palacio Real")
4. Click "➕ Agregar"
5. Wait for response

**Expected Results:**

- ✅ Success notification: "✓ Venue agregado"
- ✅ New row appears in venues table
- ✅ Venue name displays correctly
- ✅ Database shows new proposal_venue record

**Verify:**

```sql
SELECT * FROM proposal_venues WHERE proposal_id = 1;
-- Should show new row
```

---

#### T9: Add Multiple Venues

**Objective:** Proposal can have multiple venues

**Steps:**

1. Load editor
2. Add Venue #1 (e.g., "Palacio Real")
3. Add Venue #2 (e.g., "Ritz Madrid")
4. Add Venue #3 (e.g., "Club Villa")

**Expected Results:**

- ✅ All three rows appear
- ✅ No duplicates
- ✅ Each row has independent delete button

---

#### T10: Remove Venue

**Objective:** Delete venue from proposal

**Steps:**

1. Load editor with existing venue
2. Click "🗑️ Eliminar" button on venue row
3. Confirm deletion dialog

**Expected Results:**

- ✅ Confirmation dialog appears
- ✅ If confirmed: Row disappears from table
- ✅ Database record deleted
- ✅ If cancelled: Row persists

---

#### T11: Verify Venue List Loads

**Objective:** Venue dropdown shows all available venues

**Steps:**

1. Load editor
2. Click venue dropdown in Venues section

**Expected Results:**

- ✅ Dropdown shows 5+ venues (from mockup data)
- ✅ Each venue name displays
- ✅ Venues are sortable/searchable (if implemented)

---

### D. SERVICE MANAGEMENT (4 test cases)

#### T12: Add Service

**Objective:** Add service (hito) to proposal

**Steps:**

1. Load editor
2. Scroll to Services section
3. Enter title: `"Cóctel de Bienvenida"`
4. Select type: `Gastronomía`
5. Click "➕ Agregar"

**Expected Results:**

- ✅ Success notification
- ✅ New row appears in services table
- ✅ Shows title and type
- ✅ Delete button available
- ✅ Database record created

---

#### T13: Add Service with Different Types

**Objective:** Services support multiple types

**Steps:**

1. Add Service #1 - type: "Gastronomía" - title: "Welcome Coffee"
2. Add Service #2 - type: "Logística" - title: "Transporte de Staff"
3. Add Service #3 - type: "Personal" - title: "Meseros"

**Expected Results:**

- ✅ All three services appear
- ✅ Type badges show correct color-coding
- ✅ Each maintains its type independently

---

#### T14: Remove Service

**Objective:** Delete service and recalculate totals

**Steps:**

1. Load editor with existing services
2. Click "🗑️ Eliminar" on service
3. Confirm deletion

**Expected Results:**

- ✅ Confirmation dialog appears
- ✅ If confirmed: Row removed
- ✅ Financial totals recalculate
- ✅ Database record deleted

---

#### T15: Add Service with Empty Title

**Objective:** Form validation prevents invalid input

**Steps:**

1. Leave title field empty
2. Click "➕ Agregar"

**Expected Results:**

- ✅ Alert or error message appears
- ✅ Service NOT added
- ✅ Database unchanged

---

### E. FINANCIAL ENGINE (3 test cases)

#### T16: Automatic Total Calculation

**Objective:** Financial sidebar updates automatically

**Setup:**

- Create proposal with 50 PAX
- Add service "Almuerzo" at €30/pax (€1,500 base)
- Add service "Postre" at €10/pax (€500 base)
- Expected: €2,000 + IVA(10%) = €2,200

**Steps:**

1. Load editor
2. Wait 2 seconds (auto-calculate on load)
3. Verify sidebar totals

**Expected Results:**

- ✅ Base total: €2,000.00
- ✅ IVA (10%): €200.00
- ✅ Total final: €2,200.00
- ✅ Currency formatted correctly

---

#### T17: Recalculate on PAX Change

**Objective:** Totals update when PAX changes

**Setup:** Same as T16 (€2,200 with 50 PAX)

**Steps:**

1. Change PAX from 50 to 100
2. Wait 1 second (auto-trigger)

**Expected Results:**

- ✅ Base: €4,000.00 (€2,000 × 100 PAX)
- ✅ IVA: €400.00
- ✅ Total: €4,400.00
- ✅ Update happens without page reload

---

#### T18: VAT Calculation Accuracy

**Objective:** VAT rates applied correctly (10% vs 21%)

**Setup:** Create proposal with:

- Gastronomía: €1,000 @ 10% VAT = €1,100
- Logística: €500 @ 21% VAT = €605
- Expected total: €1,705

**Steps:**

1. Load editor
2. Add services with different VAT rates
3. Verify totals

**Expected Results:**

- ✅ Gastronomía VAT: 10%
- ✅ Logística VAT: 21%
- ✅ Total calculation includes both rates
- ✅ No rounding errors (2-decimal precision)

---

### F. FORM STATE MANAGEMENT (3 test cases)

#### T19: Unsaved Changes Warning

**Objective:** User warned before leaving with unsaved changes

**Steps:**

1. Load editor
2. Change any field (e.g., client name)
3. Click back button or close tab

**Expected Results:**

- ✅ Browser warning dialog appears
- ✅ Message: "¿Seguro? Hay cambios sin guardar."
- ✅ User can choose to stay or leave

---

#### T20: Save Button State

**Objective:** Save button responds to changes

**Steps:**

1. Load editor (no changes)
2. Observe save button state
3. Change any field
4. Observe button again

**Expected Results:**

- ✅ Initially: Button disabled with "✓ Guardado" text
- ✅ After change: Button enabled with "💾 Guardar Cambios" text
- ✅ After save: Button disabled again with "✓ Guardado"

---

## 🔍 ADVANCED TEST SCENARIOS

### Scenario A: Complex Editing Flow

**Objective:** Full real-world workflow

**Steps:**

1. Create new proposal (Phase 2 dashboard)
2. Load editor
3. Edit client info
4. Add 2 venues
5. Add 3 services
6. Change PAX → verify totals update
7. Save all changes
8. Reload page
9. Verify all changes persisted
10. Add 1 more service
11. Remove 1 venue
12. Save again
13. Verify final state

**Expected Results:**

- ✅ All changes persisted across reloads
- ✅ No data loss
- ✅ Totals always accurate
- ✅ No unexpected errors

---

### Scenario B: Error Recovery

**Objective:** Application handles network errors gracefully

**Steps:**

1. Stop database server
2. Try to add service
3. Observe error handling
4. Restart database
5. Retry operation

**Expected Results:**

- ✅ Error notification appears
- ✅ Friendly error message shown
- ✅ Page doesn't crash
- ✅ Can retry successfully after restart

---

### Scenario C: Permission Verification

**Objective:** Security - users can only edit their proposals

**Setup:** Multiple users in database

**Steps:**

1. Login as User A
2. Get a proposal ID from User B (from database)
3. Try to access `/proposal/:id/edit` where ID belongs to User B

**Expected Results:**

- ✅ 403 Forbidden error
- ✅ Cannot view or edit User B's proposal
- ✅ Security maintained

---

## 📊 TEST EXECUTION REPORT TEMPLATE

```
═══════════════════════════════════════════════════════════
PHASE 3 EDITOR - TEST EXECUTION REPORT
═══════════════════════════════════════════════════════════

Date: ___________
Tester: ___________
Status: [ ] PASS  [ ] FAIL

FEATURE TESTING RESULTS:
─────────────────────────────────────────────────────────
A. Editor View Loading:
  T1: Load Editor View          [ ] PASS [ ] FAIL [ ] SKIP
  T2: Verify Permission Check   [ ] PASS [ ] FAIL [ ] SKIP
  T3: Load Non-Existent         [ ] PASS [ ] FAIL [ ] SKIP

B. Basic Information Editing:
  T4: Edit Client Name          [ ] PASS [ ] FAIL [ ] SKIP
  T5: Edit PAX Auto-Calculate   [ ] PASS [ ] FAIL [ ] SKIP
  T6: Edit Event Date           [ ] PASS [ ] FAIL [ ] SKIP
  T7: Edit Legal Conditions     [ ] PASS [ ] FAIL [ ] SKIP

C. Venue Management:
  T8: Add Venue                 [ ] PASS [ ] FAIL [ ] SKIP
  T9: Add Multiple Venues       [ ] PASS [ ] FAIL [ ] SKIP
  T10: Remove Venue             [ ] PASS [ ] FAIL [ ] SKIP
  T11: Verify Venue List        [ ] PASS [ ] FAIL [ ] SKIP

D. Service Management:
  T12: Add Service              [ ] PASS [ ] FAIL [ ] SKIP
  T13: Add Multiple Services    [ ] PASS [ ] FAIL [ ] SKIP
  T14: Remove Service           [ ] PASS [ ] FAIL [ ] SKIP
  T15: Validation (Empty Title) [ ] PASS [ ] FAIL [ ] SKIP

E. Financial Engine:
  T16: Automatic Calculation    [ ] PASS [ ] FAIL [ ] SKIP
  T17: Recalculate on PAX       [ ] PASS [ ] FAIL [ ] SKIP
  T18: VAT Accuracy             [ ] PASS [ ] FAIL [ ] SKIP

F. Form State Management:
  T19: Unsaved Changes Warning  [ ] PASS [ ] FAIL [ ] SKIP
  T20: Save Button State        [ ] PASS [ ] FAIL [ ] SKIP

ADVANCED SCENARIOS:
  Scenario A: Complex Flow      [ ] PASS [ ] FAIL [ ] SKIP
  Scenario B: Error Recovery    [ ] PASS [ ] FAIL [ ] SKIP
  Scenario C: Permission Verify [ ] PASS [ ] FAIL [ ] SKIP

─────────────────────────────────────────────────────────
SUMMARY:
  Total Tests: 23
  Passed: ___
  Failed: ___
  Skipped: ___

ISSUES FOUND:
(List any bugs, errors, or issues)
1. ___________
2. ___________
3. ___________

NOTES:
___________

═══════════════════════════════════════════════════════════
```

---

## 🐛 DEBUGGING TIPS

### Issue: "Changes not saving"

**Possible Causes:**

- Session expired → Re-login
- Permission denied → Check user_id matches
- Network error → Check browser console (F12)
- Database disconnected → Check DB service

**Solution:**

```bash
# Check database connection
mysql -u catering_user -p catering_proposals
SELECT COUNT(*) FROM proposals;
```

---

### Issue: "Totals not calculating"

**Possible Causes:**

- ProposalService.calculateTotals() failing
- PAX field empty
- No services added

**Debug:**

```javascript
// In browser console (F12)
// Check if calculateTotals is being called
await fetch('/api/proposals/1/calculate', {method: 'POST'})
  .then(r => r.json())
  .then(d => console.log(d))
```

---

### Issue: "Add service gives error"

**Possible Causes:**

- Empty title
- Invalid type
- CSRF token missing
- Database error

**Solution:**

```bash
# Check browser console errors
# Check Network tab to see API response
# Verify service_type select has valid value
```

---

## ✅ TEST COMPLETION CRITERIA

Phase 3 testing is complete when:

- ✅ All 20 test cases pass
- ✅ No blocking bugs
- ✅ All data persists correctly
- ✅ Totals calculate accurately
- ✅ No permission issues
- ✅ Error handling works
- ✅ Performance acceptable (<1s response times)

---

**Next:** After all tests pass → Phase 4 Client Views  
**Estimated:** 1-2 days of testing

*Generated: Phase 3 Testing Guide*
