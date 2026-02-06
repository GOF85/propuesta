# ⚡ MICE CATERING - Route Quick Reference Card

## Routes by Category (Copy-Paste Ready)

### 🔐 Authentication Routes

```
GET  /login                      # Show login form (public)
POST /login                      # Submit login (creates session)
GET  /logout                     # Destroy session (auth required)
```

### 📊 Dashboard Routes

```
GET  /dashboard                  # List proposals (filters: status, search, page)
GET  /proposal/new               # Show new proposal form
POST /proposal                   # Create new proposal
POST /proposal/:id/duplicate     # Clone entire proposal (venues + services + items)
POST /proposal/:id/delete        # Delete proposal
POST /proposal/:id/status        # Update status (AJAX: draft→sent→accepted)
```

### ✏️ Editor Routes

```
GET  /proposal/:id/edit          # Open editor with all venues/services/items
POST /proposal/:id/update        # Save basic fields (client_name, event_date, pax)
POST /proposal/:id/publish       # Send to client (generate magic link + email)
POST /proposal/:id/archive       # Archive proposal
```

### 🎯 API Routes - Services

```
POST   /api/proposals/:id/services        # Add service (gastronomy, logistics, staff)
DELETE /api/proposals/:id/services/:svcId # Remove service

POST   /api/proposals/:id/options         # Add service option (menu variant)
DELETE /api/proposals/:id/options/:optId  # Remove option

GET    /api/proposals/:id/data            # Get full proposal JSON
```

### 🏢 API Routes - Venues

```
GET    /api/venues                        # List venues (public, with filters)
GET    /api/venues/:id                    # Get venue details (public)
POST   /api/admin/venues/scrape           # Run Puppeteer scraping (admin only)
POST   /api/admin/venues/manual           # Create venue manually
PUT    /api/admin/venues/:id              # Update venue (admin only)
DELETE /api/admin/venues/:id              # Delete venue (admin only)
POST   /api/proposals/:id/venues          # Add venue to proposal
DELETE /api/proposals/:id/venues/:venueId # Remove venue from proposal
```

### 💰 API Routes - Financial

```
POST   /api/proposals/:id/calculate       # Recalculate totals (VAT, discounts, margins)
GET    /api/proposals/:id/totals          # Get totals breakdown
POST   /api/proposals/:id/discount        # Apply manual discount %
DELETE /api/proposals/:id/discount        # Remove discount
GET    /api/proposals/:id/margin-analysis # Get profit analysis
GET    /api/proposals/:id/audit-log       # Get price change history
GET    /api/volume-discounts              # List volume discount tiers
POST   /api/volume-discounts              # Create tier (admin)
PUT    /api/volume-discounts/:tierId      # Update tier (admin)
```

### 📷 API Routes - Image Upload

```
POST   /api/admin/upload/image            # Single image (resize + webp)
POST   /api/admin/upload/logo             # Logo (+ color extraction)
POST   /api/admin/upload/batch            # Multiple images
DELETE /api/admin/image/:hash             # Delete image by hash
```

### 👥 Client Routes (Magic Link - PUBLIC)

```
GET  /p/:hash                    # View proposal (read-only, magic link)
GET  /p/:hash/messages           # Get messages (AJAX polling)
POST /p/:hash/messages           # Send message
POST /p/:hash/messages/mark-read # Mark messages as read
POST /p/:hash/download-pdf       # Download PDF
POST /p/:hash/accept             # Accept proposal
POST /p/:hash/reject             # Reject proposal (optional reason)
POST /p/:hash/modifications      # Request modifications
```

### 🔧 Admin Routes

```
GET  /admin                      # Admin dashboard
GET  /admin/venues               # Venue management panel
GET  /admin/dishes               # Dishes management
GET  /admin/services             # Services management
POST /admin/dishes/import        # Import dishes from CSV
GET  /admin/dishes/export        # Export dishes to CSV
POST /admin/dishes/:id/delete    # Delete dish
```

---

## Quick Test Commands

```bash
# 1. LOGIN (get session cookie)
curl -c cookies.txt -d "email=test@example.com&password=password123" \
  http://localhost:3000/login

# 2. LIST PROPOSALS (authenticated)
curl -b cookies.txt http://localhost:3000/dashboard

# 3. GET VENUES (public API)
curl http://localhost:3000/api/venues?search=madrid

# 4. GET VENUE BY ID (public)
curl http://localhost:3000/api/venues/1

# 5. ADD SERVICE TO PROPOSAL
curl -b cookies.txt -X POST http://localhost:3000/api/proposals/1/services \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Catering",
    "type": "gastronomy",
    "vat_rate": 21
  }'

# 6. CALCULATE TOTALS
curl -b cookies.txt -X POST http://localhost:3000/api/proposals/1/calculate \
  -H "Content-Type: application/json" \
  -d '{}'

# 7. APPLY DISCOUNT
curl -b cookies.txt -X POST http://localhost:3000/api/proposals/1/discount \
  -H "Content-Type: application/json" \
  -d '{
    "discount_percentage": 15,
    "reason": "VIP client"
  }'

# 8. VIEW PROPOSAL VIA MAGIC LINK (public)
curl http://localhost:3000/p/abc123def456xyz789...

# 9. CLIENT SENDS MESSAGE
curl -X POST http://localhost:3000/p/abc123def456xyz789.../messages \
  -H "Content-Type: application/json" \
  -d '{"message_body": "Can we add a cocktail hour?"}'

# 10. ACCEPT PROPOSAL
curl -X POST http://localhost:3000/p/abc123def456xyz789.../accept \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Validation Rules Quick Ref

```
Field Type          Validation
─────────────────────────────────────────────────────────
Email               .isEmail() + .normalizeEmail()
Integer ID          .isInt().toInt()
Decimal/Price       .isDecimal() or .isFloat()
Enum                .isIn(['val1', 'val2', 'val3'])
Text (any)          .trim() + .isLength({min, max})
Date                .isISO8601() (YYYY-MM-DD format)
URL                 .isURL()
Boolean             .isBoolean()
Length 32-64        .isLength({min:32, max:64})
```

### Status Values

```
Proposal Status:    'draft', 'sent', 'accepted', 'rejected', 'archived'
Service Type:       'gastronomy', 'logistics', 'staff', 'other'
Venue Capacities:   cocktail, banquet, theater (integers, ≥ 0)
```

---

## HTTP Status Codes Used

```
200 OK              ✅ Success (GET, POST, PUT, DELETE)
302 Found           ↩️  Redirect after POST (success)
400 Bad Request     ⚠️  Validation failed
403 Forbidden       🔒 No permission (user_id/role)
404 Not Found       ❌ Resource doesn't exist
500 Internal Error  💥 Server error (database, service)
```

---

## Response Patterns

### Successful JSON Response
```json
{
  "success": true,
  "message": "Propuesta creada",
  "data": { /* ... */ },
  "totals": { /* optional */ }
}
```

### Error JSON Response
```json
{
  "success": false,
  "error": "Database error",
  "message": "The proposal does not exist",
  "errors": [ /* validation errors */ ]
}
```

### Successful HTML Response
```
res.render('view-name', {
  user: req.session.user,
  proposals: [...],
  message: "Propuesta enviada",
  success_msg: ["..."]
})
```

---

## Request Body Examples

### Create Proposal
```json
{
  "client_name": "Google Inc",
  "event_date": "2026-03-15",
  "pax": 200
}
```

### Add Service
```json
{
  "title": "Catering Buffet",
  "type": "gastronomy",
  "vat_rate": 21
}
```

### Add Service Option
```json
{
  "service_id": 5,
  "name": "Menu A (30€ pp)",
  "price_pax": 30.00,
  "discount_pax": 0
}
```

### Add Venue
```json
{
  "venue_id": 12
}
```

### Apply Discount
```json
{
  "discount_percentage": 10,
  "reason": "Loyal customer"
}
```

### Create Venue (Manual)
```json
{
  "name": "Gran Hotel Madrid",
  "description": "Luxury hotel in city center",
  "capacity_cocktail": 500,
  "capacity_banquet": 300,
  "capacity_theater": 400,
  "address": "Paseo del Prado, Madrid",
  "external_url": "https://example.com"
}
```

### Send Message (Client)
```json
{
  "message_body": "Can we adjust the menu? We need 3 vegetarian options"
}
```

### Request Modifications
```json
{
  "modifications": "We would like to extend the cocktail hour from 1.5 to 2 hours and add a DJ"
}
```

---

## Debugging: Common Issues

### Issue: Route not found (404)
```
✓ Check route is registered in app.js in correct order
✓ Verify route path matches exactly (case-sensitive)
✓ Check params like :id are defined correctly
✓ Ensure route is in the right file (dashboard.js, api.js, etc)
```

### Issue: Permission denied (403)
```
✓ Check user.id matches proposal.user_id
✓ Verify user.role exists and has correct value
✓ Check authorizeRole('admin') middleware applied
✓ Ensure session is preserved (use -b cookies.txt in curl)
```

### Issue: Validation failed (400)
```
✓ Check request body matches schema
✓ Verify Content-Type: application/json header
✓ Inspect validation rules in route file
✓ Check error response: errors.array()
```

### Issue: AJAX not working
```
✓ Check Content-Type: application/json
✓ Verify Route returns JSON (not HTML)
✓ Check res.json({ success, ... }) format
✓ Inspect browser Network tab for actual response
```

### Issue: File upload failing
```
✓ Check file size < 50MB limit
✓ Verify Content-Type: multipart/form-data
✓ Form field name must be 'file'
✓ Check /public/uploads/ directory exists
✓ Verify write permissions on /public/uploads/
```

---

## Route Security Checklist

```
□ Public routes explicitly documented
□ Protected routes require authenticateUser
□ Admin routes require authorizeRole('admin')
□ Ownership verified (user_id === req.user.id)
□ All inputs validated (express-validator)
□ SQL injection prevented (prepared statements)
□ CSRF protection in place (session middleware)
□ Rate limiting for public endpoints (TODO)
□ Magic link hashes are random & long (32-64 chars)
□ Magic link TTL enforced (expires after X days)
□ Errors don't leak sensitive info (no stack traces to client)
```

---

## Performance Tips

```
□ Use pagination on list endpoints (limit: 10-50)
□ Cache venue list (/api/venues) if not frequently updated
□ Index database columns used in WHERE clauses
□ Use prepared statements (already in place)
□ Lazy-load related data (venues, services, items)
□ Consider Redis for session store in production
□ Use connection pooling (MariaDB pool in place)
□ Compress response bodies (gzip middleware)
□ CDN for static files (/public/)
```

---

## Environment Variables Required

```bash
DB_HOST=localhost
DB_USER=catering_user
DB_PASS=secure_password
DB_NAME=catering_proposals
SESSION_SECRET=your_session_secret_here
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password
NODE_ENV=development
PORT=3000
```

---

## File Organization Map

```
src/
├── routes/
│   ├── auth.js           ✅ /login, /logout, /
│   ├── dashboard.js      ✅ /dashboard, /proposal/*, /admin
│   ├── editor.js         ✅ /proposal/:id/edit, /update, /publish
│   ├── api.js            ✅ /api/proposals/*, /api/venues/*, /api/admin/*
│   ├── client.js         ✅ /p/:hash (magic link routes)
│   └── index.js          ✅ /health, root
│
├── controllers/
│   ├── dashboardController.js  ✅ Proposals list & CRUD
│   ├── editorController.js     ✅ Edit + services + items
│   ├── clientController.js     ✅ Magic link views + messages
│   └── adminController.js      ✅ Venues, dishes, images
│
├── services/
│   ├── ProposalService.js      ✅ SQL + calculations
│   ├── VenueService.js         ✅ Venues + Puppeteer scraping
│   ├── ChatService.js          ✅ Messages CRUD
│   ├── EmailService.js         ✅ Nodemailer wrapper
│   └── ImageService.js         ✅ Sharp processing
│
└── middleware/
    ├── auth.js          ✅ authenticateUser, authorizeRole, errorHandler
    └── maintenance.js   ✅ is_editing check (TODO)

views/
├── commercial/
│   ├── dashboard.ejs      ← GET /dashboard
│   ├── editor.ejs         ← GET /proposal/:id/edit
│   └── new-proposal.ejs   ← GET /proposal/new
│
├── client/
│   ├── proposal-view.ejs  ← GET /p/:hash
│   ├── maintenance.ejs    ← GET /p/:hash (if is_editing)
│   └── chat.ejs          ← Embedded in proposal-view
│
├── admin/
│   ├── venues-list.ejs
│   ├── dishes-list.ejs
│   └── services-list.ejs
│
├── auth/
│   └── login.ejs  (currently inline HTML in route)
│
└── partials/
    ├── header.ejs         ← All pages (navbar, user menu)
    ├── header-client.ejs  ← Client views (minimal)
    ├── footer.ejs         ← All pages
    └── flash-messages.ejs ← All pages (alerts)
```

---

## Next Routes to Implement

```
⭐⭐⭐ HIGH PRIORITY
  POST /register                 # User registration
  GET  /forgot-password          # Password reset form
  POST /reset-password/:token    # Reset via token
  POST /proposal/:id/send-email  # Manual email send

⭐⭐ MEDIUM PRIORITY
  GET  /api/analytics/dashboard  # Sales stats
  GET  /api/volume-discounts     # List & edit tiers (done)
  POST /p/:hash/signature        # E-signature capture
  PUT  /admin/settings           # App configuration

⭐ LOW PRIORITY
  GET  /admin/reports            # Advanced analytics
  POST /api/integrate/salesforce # CRM sync
  GET  /proposal/:id/versions    # Edit history
```

---

**Quick Start:** See FULL_ROUTING_MAP.md for complete reference  
**JSON Format:** See ROUTES_REGISTRY.json for programmatic use  
**Diagrams:** See ROUTING_DIAGRAM.txt for visual explanations  

*Generated: February 6, 2026 | Node.js v20+ | Express + MariaDB | Team: Guillermo*
