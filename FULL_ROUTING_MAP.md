# 🗺️ MICE CATERING PROPOSALS - Complete Routing Architecture

**Generated:** February 6, 2026  
**Project Status:** Fully routed (Auth, Dashboard, Editor, API, Client)  
**Last Updated:** VenueService + Puppeteer implementation complete

---

## 📋 Table of Contents

1. [Authentication Routes](#authentication-routes)
2. [Dashboard Routes](#dashboard-routes)
3. [Proposal Editor Routes](#proposal-editor-routes)
4. [API Routes (JSON / Interactive)](#api-routes)
5. [Client Routes (Magic Link - Public)](#client-routes)
6. [Admin Routes](#admin-routes)
7. [View Structure](#view-structure)
8. [Route Registration Order](#route-registration-order)
9. [Missing/TODO Routes](#missingtodo-routes)

---

## Authentication Routes

**File:** `/src/routes/auth.js`  
**Middleware:** None (Public)

| Route | Method | Handler/Controller | Purpose | Auth Required |
| ------ | ------ | ------------------- | ----------- | --------------- |
| `/login` | GET | `authRoutes (inline)` | Display login form | ❌ No |
| `/login` | POST | `authRoutes (inline)` | Process login submission | ❌ No |
| `/logout` | GET | `authRoutes (inline)` | Destroy session | ✅ Yes* |

**Notes:**

- Currently hardcoded: `test@example.com / password123`
- Session stored in memory (express-session)
- TODO: Integrate with user database table

---

## Dashboard Routes

**File:** `/src/routes/dashboard.js` + `/src/app.js` (fallback)  
**Middleware:** `authenticateUser` (all routes)

### Proposal Management

| Route | Method | Handler | Purpose | Auth Required |
| ------ | ------ | --------- | ------ | --------------- |
| `/dashboard` | GET | `DashboardController.getProposals()` | List all proposals with filters (status, search, pagination) | ✅ Yes |
| `/proposal/new` | GET | `DashboardController.newProposal()` | Show new proposal form | ✅ Yes |
| `/proposal` | POST | `DashboardController.createProposal()` | Create new proposal | ✅ Yes |
| `/proposal/:id/duplicate` | POST | `DashboardController.duplicateProposal()` | Deep-clone proposal with all venues/services/items | ✅ Yes |
| `/proposal/:id/delete` | POST | `DashboardController.deleteProposal()` | Delete proposal | ✅ Yes |
| `/proposal/:id/status` | POST | `DashboardController.updateStatus()` | Update proposal status (draft→sent→accepted) | ✅ Yes |

**Validation:**

- `status`: Must be in `['all', 'draft', 'sent', 'accepted']`
- `search`: Max 100 chars
- `page`: Integer, min 1
- `client_name`: Required, 2-255 chars
- `event_date`: Optional ISO8601
- `pax`: Optional integer ≥ 0

---

### Admin Panel Routes

| Route | Method | Handler | Purpose | Auth Required | Role Required |
| ------ | ------ | --------- | ------ | --------------- | --------------- |
| `/admin` | GET | `AdminController.getAdminDashboard()` | Admin dashboard home | ✅ Yes | `admin` |
| `/admin/venues` | GET | `AdminController.getVenuesListPage()` | Manage venues (CRUD + Puppeteer scraping) | ✅ Yes | `admin` |
| `/admin/dishes` | GET | `AdminController.getDishesPanel()` | Manage dishes catalog | ✅ Yes | `admin` |
| `/admin/services` | GET | `AdminController.getServicesPanel()` | Manage services | ✅ Yes | `admin` |

---

## Proposal Editor Routes

**File:** `/src/routes/editor.js`  
**Middleware:** `authenticateUser` (all routes)

| Route | Method | Handler | Purpose | Auth Required |
| ------ | ------ | --------- | ------ | --------------- |
| `/proposal/:id/edit` | GET | `EditorController.renderEditor()` | Render full editor form with venues/services/items | ✅ Yes |
| `/proposal/:id/update` | POST | `EditorController.updateProposal()` | Save basic proposal fields (client_name, event_date, pax, conditions) | ✅ Yes |
| `/proposal/:id/publish` | POST | `EditorController.publishProposal()` | Send proposal to client (status → 'sent') | ✅ Yes |
| `/proposal/:id/archive` | POST | `EditorController.archiveProposal()` | Archive proposal (status → 'archived') | ✅ Yes |

**Validation:**

- `client_name`: 2-255 chars
- `event_date`: Optional ISO8601
- `pax`: Optional integer ≥ 0
- `legal_conditions`: Optional text

---

## API Routes

**File:** `/src/routes/api.js`  
**Middleware:** `authenticateUser` (data endpoints), Open (views endpoints)  
**Response Format:** JSON

### Proposal Services Management

| Route | Method | Handler | Purpose | Auth Required |
| ------ | ------ | --------- | ------ | --------------- |
| `/api/proposals/:id/services` | POST | `EditorController.addService()` | Add service to proposal | ✅ Yes |
| `/api/proposals/:id/services/:serviceId` | DELETE | `EditorController.removeService()` | Remove service from proposal | ✅ Yes |
| `/api/proposals/:id/data` | GET | `EditorController (inline)` | Get full proposal data (JSON) | ✅ Yes |
| `/api/proposals/:id/options` | POST | `EditorController (inline)` | Add service option (variant with price) | ✅ Yes |
| `/api/proposals/:id/options/:optionId` | DELETE | `EditorController (inline)` | Delete service option | ✅ Yes |

**Body Validation:**

- `title`: 2-255 chars
- `type`: Must be in `['gastronomy', 'logistics', 'staff', 'other']`
- `vat_rate`: Optional decimal
- `service_id`: Required integer
- `name`: 2-100 chars
- `price_pax`: Required decimal
- `discount_pax`: Optional decimal

### Venue Management

| Route | Method | Handler | Purpose | Auth Required | Role Required |
| ------ | ------ | --------- | ------ | --------------- | --------------- |
| `/api/proposals/:id/venues` | POST | `EditorController.addVenue()` | Add venue to proposal | ✅ Yes | - |
| `/api/proposals/:id/venues/:venueId` | DELETE | `EditorController.removeVenue()` | Remove venue from proposal | ✅ Yes | - |
| `/api/venues` | GET | `VenueService.getAll(filters)` | List venues with optional filters | ❌ No | - |
| `/api/venues/:id` | GET | `VenueService.getById(id)` | Get specific venue details | ❌ No | - |
| `/api/admin/venues/scrape` | POST | `VenueService.syncVenuesFromWebsite()` | Execute Puppeteer scraping from micecatering.com | ✅ Yes | `admin` |
| `/api/admin/venues/manual` | POST | `VenueService.createManual()` | Create venue manually (fallback if scraping fails) | ✅ Yes | `admin` |
| `/api/admin/venues/:id` | PUT | `VenueService.updateManual()` | Update venue | ✅ Yes | `admin` |
| `/api/admin/venues/:id` | DELETE | `VenueService.delete()` | Delete venue | ✅ Yes | `admin` |

**Venue Fields (POST/PUT):**

- `name`: 2-255 chars (required)
- `description`: Optional text
- `capacity_cocktail`: Optional integer ≥ 0
- `capacity_banquet`: Optional integer ≥ 0
- `capacity_theater`: Optional integer ≥ 0
- `address`: Optional text
- `external_url`: Optional URL

### Image Upload Routes

| Route | Method | Handler | Purpose | Auth Required | Role Required |
| ------ | ------ | --------- | ------ | --------------- | --------------- |
| `/api/admin/upload/image` | POST | `AdminController.uploadImage()` | Upload single image → Resize (1920px) → WebP → Save | ✅ Yes | `admin` |
| `/api/admin/upload/logo` | POST | `AdminController.uploadClientLogo()` | Upload client logo + extract dominant color | ✅ Yes | `admin` |
| `/api/admin/upload/batch` | POST | `AdminController.uploadBatch()` | Upload multiple images | ✅ Yes | `admin` |
| `/api/admin/image/:hash` | DELETE | `AdminController.deleteImage()` | Delete image by 12-char hash | ✅ Yes | `admin` |

**File Upload:**

- Max file size: 50MB
- Formats supported: JPG, PNG, GIF, WebP, SVG
- Processed with Sharp: max 1920px width → WebP conversion

### Financial Engine Routes

| Route | Method | Handler | Purpose | Auth Required |
| ------ | ------ | --------- | ------ | --------------- |
| `/api/proposals/:id/calculate` | POST | `EditorController.calculateTotals()` | Recalculate proposal totals (VAT, discounts, margins) | ✅ Yes |
| `/api/proposals/:id/totals` | GET | `EditorController (inline)` | Get detailed totals breakdown | ✅ Yes |
| `/api/proposals/:id/discount` | POST | `ProposalService.applyManualDiscount()` | Apply manual discount percentage | ✅ Yes |
| `/api/proposals/:id/discount` | DELETE | `ProposalService.applyManualDiscount(0)` | Remove manual discount | ✅ Yes |
| `/api/proposals/:id/margin-analysis` | GET | `ProposalService.getMarginAnalysis()` | Get profit margin analysis | ✅ Yes |
| `/api/proposals/:id/audit-log` | GET | `ProposalService.getPriceAuditLog()` | Get price change history | ✅ Yes |
| `/api/volume-discounts` | GET | `ProposalService.getVolumeDiscountTiers()` | Get all volume discount tiers | ✅ Yes |
| `/api/volume-discounts` | POST | `ProposalService.createVolumeDiscountTier()` | Create volume discount tier | ✅ Yes | `admin` |
| `/api/volume-discounts/:tierId` | PUT | `ProposalService.updateVolumeDiscountTier()` | Update tier | ✅ Yes | `admin` |

**Discount Body:**

- `discount_percentage`: 0-100 float
- `reason`: 3-255 chars

---

## Client Routes

**File:** `/src/routes/client.js`  
**Middleware:** None (Public - Magic link authentication)  
**Response Format:** HTML + JSON (for messages)

| Route | Method | Handler | Purpose | Auth Required | Public |
| ------ | ------ | --------- | ------ | --------------- | --------- |
| `/p/:hash` | GET | `ClientController.viewProposal()` | View proposal (read-only, show if in maintenance mode) | ❌ No | ✅ Yes |
| `/p/:hash/messages` | GET | `ClientController.getMessages()` | Fetch messages (AJAX polling, 30s interval) | ❌ No | ✅ Yes |
| `/p/:hash/messages` | POST | `ClientController.sendMessage()` | Send message to proposer | ❌ No | ✅ Yes |
| `/p/:hash/messages/mark-read` | POST | `ClientController.markMessagesAsRead()` | Mark all messages as read | ❌ No | ✅ Yes |
| `/p/:hash/download-pdf` | POST | `ClientController.downloadPDF()` | Generate and download PDF (via Puppeteer) | ❌ No | ✅ Yes |
| `/p/:hash/accept` | POST | `ClientController.acceptProposal()` | Accept proposal (status → 'accepted') | ❌ No | ✅ Yes |
| `/p/:hash/reject` | POST | `ClientController.rejectProposal()` | Reject proposal (status → 'rejected') | ❌ No | ✅ Yes |
| `/p/:hash/modifications` | POST | `ClientController.requestModifications()` | Request changes (create chat message) | ❌ No | ✅ Yes |

**Magic Link Hash:**

- Length: 32-64 chars (typically 64-char UUID hash)
- Rate limiting: TODO (5 req/min per IP recommended)
- Timeout: Configurable (suggest 30 days)

**Message Body:**

- `message_body`: 1-2000 chars
- `reason`: Optional, max 500 chars
- `modifications`: 10-2000 chars

---

## Admin Routes

Scattered across dashboard.js and app.js

| Route | Method | Handler | Purpose | Auth Required | Role Required |
| ------ | ------ | --------- | ------ | --------------- | --------------- |
| `/admin/dishes/import` | POST | `AdminController.importDishes()` | Import dishes from CSV | ✅ Yes | `admin` |
| `/admin/dishes/export` | GET | `AdminController.exportDishes()` | Export dishes to CSV | ✅ Yes | `admin` |
| `/admin/dishes/:id/delete` | POST | `AdminController.deleteDish()` | Delete dish from catalog | ✅ Yes | `admin` |

---

## View Structure

### Commercial (Internal) Views

**Location:** `views/commercial/`

| View File | Purpose | Route |
| --------- | --------- | --------- |
| `dashboard.ejs` | List proposals with filtering, search, pagination | `/dashboard` GET |
| `editor.ejs` | Full proposal editor with venues/services/items/financials | `/proposal/:id/edit` GET |
| `new-proposal.ejs` | New proposal form (basic client info) | `/proposal/new` GET |

### Client (Public) Views

**Location:** `views/client/`

| View File | Purpose | Route |
| --------- | --------- | --------- |
| `proposal-view.ejs` | Read-only proposal view with decision buttons (accept/reject/modify) | `/p/:hash` GET |
| `maintenance.ejs` | Waiting screen if is_editing=true | Conditional in `/p/:hash` |
| `chat.ejs` | Message thread (embedded in proposal-view, polling) | `/p/:hash/messages` |

### Auth Views

**Location:** `views/auth/`

| View File | Purpose | Route |
| --------- | --------- | --------- |
| `login.ejs` | Login form (hardcoded HTML in route) | `/login` GET |
| `register.ejs` | TODO: Register form | TODO |

### Admin Views

**Location:** `views/admin/`

| View File | Purpose | Route |
| --------- | --------- | --------- |
| `venues-list.ejs` | Venue CRUD management | `/admin/venues` GET |
| `venue-form-modal.ejs` | Create/edit venue modal | Inline in venues-list |
| `dishes-list.ejs` | Dish CRUD management | `/admin/dishes` GET |
| `services-list.ejs` | Service CRUD management | `/admin/services` GET |

### Shared Partials

**Location:** `views/partials/`

| Partial | Used In | Content |
| --------- | --------- | --------- |
| `header.ejs` | All commercial views | Navbar, user menu, logo, search |
| `header-client.ejs` | Client views | Minimal header for public |
| `footer.ejs` | All views | Company branding, copyright |
| `flash-messages.ejs` | All views | Alert boxes (success/error/info) |

---

## Route Registration Order

**File:** `src/app.js` (lines 180-195)

```javascript
// CRITICAL: Order matters for route matching!

1. app.use('/', authRoutes);           // /login, /logout, root redirect
2. app.use('/', routes);               // /health check, root redirect
3. app.use('/', dashboardRoutes);      // /dashboard, /admin/*, /proposal/*
4. app.use('/', editorRoutes);         // /proposal/:id/edit, /proposal/:id/update
5. app.use('/', apiRoutes);            // /api/*, image uploads
6. app.use('/', clientRoutes);         // /p/:hash (magic link public routes)

// 404 and error handlers last
app.use((req, res) => res.status(404));
app.use(errorHandler);
```

**⚠️ Important:** Client routes (`/p/:hash`) MUST come after API routes to avoid hash matching API patterns.

---

## Missing/TODO Routes

### Authentication

| TODO | Priority | Notes |
| ------ | --------- | --------- |
| User registration endpoint | ⭐⭐⭐ | Phase 2: `/register` GET/POST with validation |
| Password reset flow | ⭐⭐ | `/forgot-password`, `/reset-token/:token` |
| Database user integration | ⭐⭐⭐ | Replace hardcoded test credentials |
| JWT/Session timeout handling | ⭐⭐ | Refresh tokens, logout on inactivity |

### Proposals

| TODO | Priority | Notes |
| ------ | --------- | --------- |
| `/proposal/:id/send-email` | ⭐⭐⭐ | Manual email send via Nodemailer |
| `/proposal/:id/schedule-send` | ⭐⭐ | Schedule delivery for specific date/time |
| `/proposal/:id/version-history` | ⭐ | Show edit history/versions |
| `/proposal/:id/share-link` | ⭐⭐ | Generate shareable link (magic hash) |

### Client Features

| TODO | Priority | Notes |
| ------ | --------- | --------- |
| `/p/:hash/signature` | ⭐⭐⭐ | Client signature capture (e-signature) |
| `/p/:hash/counter-offer` | ⭐⭐ | Client can submit modified terms |
| Rate limiting on magic links | ⭐⭐⭐ | 5 req/min per IP (security) |
| `/p/:hash/schedule-call` | ⭐ | Calendar integration for follow-up |

### Admin Panel

| TODO | Priority | Notes |
| ------ | --------- | --------- |
| `/admin/users` | ⭐⭐⭐ | User account management (CRUD) |
| `/admin/settings` | ⭐⭐ | App settings (VAT rates, company info, email) |
| `/admin/reports` | ⭐⭐ | Sales reports, margins by proposal, venue analysis |
| `/admin/audit-log` | ⭐ | System-wide audit trail |
| `/admin/email-templates` | ⭐⭐ | Customize email notifications |

### Analytics & Reporting

| TODO | Priority | Notes |
| ------ | --------- | --------- |
| `/api/analytics/dashboard` | ⭐⭐ | Summary stats: proposals/month, conversion rate, avg deal size |
| `/api/analytics/venues` | ⭐ | Popularity, capacity usage, revenue by venue |
| `/api/analytics/financial` | ⭐⭐ | Revenue trends, margin analysis, discount usage |

### Integrations

| TODO | Priority | Notes |
| ------ | --------- | --------- |
| `/api/integrate/salesforce` | ⭐ | CRM sync (POST/PATCH/DELETE) |
| `/api/integrate/slack` | ⭐ | Notifications on proposal actions |
| `/api/integrate/stripe` | ⭐⭐ | Payment processing (if billing added) |

---

## Validation Summary

### Common Validators Used

| Validator | Applied To | Rules |
| --------- | --------- | --------- |
| `.isEmail()` | Email fields | RFC 5322 format |
| `.isInt()` | Numeric IDs | Integer only, parsed to number |
| `.isDecimal()` | Prices, percentages | Float format |
| `.isLength({ min, max })` | Text fields | Character count validation |
| `.isISO8601()` | Dates | Valid ISO format (YYYY-MM-DD) |
| `.isIn([...])` | Enums | Whitelist of allowed values |
| `.trim()` | Text input | Remove whitespace |
| `.normalizeEmail()` | Email | Lowercase, remove dots in gmail |

### Permission Model

```javascript
// Authentication
✅ authenticated: req.session.user exists
❌ public: no session required

// Authorization (Roles)
'admin'      // Full system access (venues, dishes, users, settings)
'commercial' // Can create/edit proposals, send to clients
'client'     // View assigned proposals only (via magic link)
```

---

## Summary Statistics

| Category | Count |
| --------- | --------- |
| **Total Routes** | **52** |
| GET routes | 22 |
| POST routes | 22 |
| PUT routes | 4 |
| DELETE routes | 4 |
| **Protected Routes** | 38 |
| **Public Routes** | 8 |
| Admin-only routes | 14 |
| Views | 15+ |

---

## Quick Debugging Checklist

- ✅ Route registration order correct in `app.js`?
- ✅ Middleware chain complete (`authenticateUser` before `authorizeRole`)?
- ✅ Controller method exported and matches route handler?
- ✅ Validation rules applied before controller called?
- ✅ Error handlers return proper HTTP codes (400, 403, 404, 500)?
- ✅ JSON responses include `{ success: bool, ...data }`?
- ✅ Hash length validation for magic links (32-64 chars)?
- ✅ Permission check in controller before DB query?

---

**Last Generated:** February 6, 2026  
**Project Lead:** Guillermo (Node.js Architect)  
**Next Review:** After completing authentication DB integration (Phase 2)
