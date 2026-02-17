# 🏢 VenueService + Puppeteer Scraping - Guía de Implementación

**Estado:** ✅ COMPLETADO  
**Fecha:** 6 de febrero de 2026  
**Stack:** Node.js | Puppeteer | Sharp (ImageService) | MariaDB

---

## 📋 Resumen Ejecutivo

Se ha implementado un **sistema completo de gestión de venues** con:

✅ **Puppeteer Scraping** - Extrae venues automáticamente de micecatering.com  
✅ **Anti-Hotlinking** - Descarga imágenes externas y procesa con Sharp  
✅ **Formulario Manual Fallback** - Interfaz para crear venues manualmente si scraping falla  
✅ **API RESTful** - Endpoints para CRUD + scraping  
✅ **Interfaz Admin** - Panel visual en `/admin/venues` con gestión completa  

---

## 🏗️ Arquitectura

### VenueService.js - Componentes Principales

```
VenueService
├── scrapeVenues()              # Puppeteer: Extrae de URL
├── processScrapedVenues()      # ImageService: Procesa imágenes
├── downloadAndOptimizeImage()  # Anti-hotlinking: Descarga + Sharp
├── insertOrUpdateVenue()       # BD: Persist con prepared statements
├── syncVenuesFromWebsite()     # Scraping + Insert (MAIN)
├── getAll(filters)             # List venues
├── getById(id)                 # Get venue específico
├── createManual(data)          # Formulario fallback
├── updateManual(id, data)      # Editar manual
└── delete(id)                  # Eliminar
```

### Rutas API

```
GET  /api/venues                 # List todos
GET  /api/venues/:id             # Get específico
POST /api/admin/venues/scrape    # 🚀 Iniciar scraping
POST /api/admin/venues/manual    # ➕ Crear manual
PUT  /api/admin/venues/:id       # ✏️ Actualizar
DEL  /api/admin/venues/:id       # 🗑️ Eliminar
```

### Vistas

```
views/admin/venues-list.ejs         # Panel principal (lista + scraping)
views/admin/venue-form-modal.ejs    # Modal reutilizable (create/edit)
```

---

## 🚀 Uso - Ejemplos de Código

### 1️⃣ Scraping Automático (Admin)

```javascript
// POST /api/admin/venues/scrape
// En el browser: botón "Scrapear micecatering.com"

const VenueService = require('./services/VenueService');

const result = await VenueService.syncVenuesFromWebsite();
// Retorna:
// {
//   success: true,
//   count: 12,
//   venues: [
//     { name, description, capacity_*, features, images: [...paths] },
//     ...
//   ],
//   message: "✅ 12 venues importados correctamente"
// }
```

**Qué pasa internamente:**
1. Puppeteer navega a `https://www.micecatering.com/venues`
2. Extrae nombre, descripción, capacidades, características, imágenes
3. Para cada imagen: descarга (GET request) → valida MIME → procesa Sharp → guarda en `/public/uploads/{hash}/image.webp`
4. INSERT en tabla `venues` con prepared statements
5. Retorna array de venues creados

### 2️⃣ Crear Venue Manual (Admin - Fallback)

```javascript
// POST /api/admin/venues/manual
const VenueService = require('./services/VenueService');

const venueData = {
  name: "Gran Salón Madrid",
  description: "Espacio moderno con vistas al atardecer",
  capacity_cocktail: 500,
  capacity_banquet: 300,
  capacity_theater: 1000,
  features: ["Wifi", "Parking", "Catering", "Jardín"],
  address: "Paseo de la Castellana 20, Madrid",
  external_url: "https://www.ejemplo.com"
};

const id = await VenueService.createManual(venueData);
console.log(`Venue creado: ID ${id}`);
```

### 3️⃣ Obtener Venues con Filtros

```javascript
const VenueService = require('./services/VenueService');

// Venuedata con filtros
const venues = await VenueService.getAll({
  search: "salón",           // Busca en name + description
  minCapacity: 100           // Capacidad mínima
});

// Retorna array con JSON fields parseados:
// [
//   {
//     id, name, description,
//     capacity_cocktail, capacity_banquet, capacity_theater,
//     features: [...],        // Array parseado
//     images: [...],          // Array parseado  
//     address, external_url, map_iframe, created_at
//   }
// ]
```

### 4️⃣ Frontend - Llamar API

```javascript
// En views/admin/venues-list.ejs

// Scraping
async function startScraping() {
  const response = await fetch('/api/admin/venues/scrape', {
    method: 'POST'
  });
  const result = await response.json();
  
  if (result.success) {
    alert(`✅ ${result.count} venues importados`);
    location.reload();
  }
}

// Crear manual
function openVenueForm(mode = 'new', venueId = null) {
  // Modal se abre en views/admin/venue-form-modal.ejs
  document.getElementById('venue-form-modal').classList.remove('hidden');
}

// Formulario fallback
async function submitVenueForm(event) {
  event.preventDefault();
  const formData = new FormData(document.getElementById('venue-form'));
  const data = Object.fromEntries(formData);
  
  const response = await fetch('/api/admin/venues/manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  const result = await response.json();
  if (result.success) location.reload();
}
```

---

## 📸 Procesamiento de Imágenes - Anti-Hotlinking

### Flujo Completo

```
URL externa (http/https)
    ↓
downloadImageBuffer()            ← GET request con timeout
    ↓
Validar content-type = image/*
    ↓
ImageService.processImage()      ← Sharp processing
    ├─ Resize max 1920px (si es mayor)
    ├─ Convertir a WebP (quality: 80)
    └─ Guardar en /public/uploads/{hash}/
    ↓
Retorna: /uploads/{hash}/image.webp
```

### Ejemplo Manual

```javascript
const ImageService = require('./services/ImageService');

// Descargar desde URL externa
const imageUrl = 'https://www.micecatering.com/images/venue1.jpg';
const imageBuffer = await VenueService.downloadImageBuffer(imageUrl);

// Procesat
const result = await VenueService.downloadAndOptimizeImage(imageUrl, 'Mi Venue');
// result = {
//   path: '/uploads/abc123def/venue1-1707204000000.webp',
//   width: 1920,
//   height: 1280,
//   sizeKB: 85.4,
//   ...
// }

// En BD
await conn.query(
  'UPDATE venues SET images = ? WHERE id = 1',
  [JSON.stringify([result.path])]
);
```

**Ventajas Anti-Hotlinking:**
- ✅ Imágenes locales (no depend de URL externa)
- ✅ Compresión WebP (reducción 70-80%)
- ✅ Resize automático (economiza ancho)
- ✅ Protección contra cambios en sitio original

---

## 🔧 Configuración

### 1. Verificar Puppeteer Instalado

```bash
npm list puppeteer
# puppeteer@24.37.1

# Si falta:
npm install puppeteer@24.37.1
```

### 2. Verificar Sharp Instalado

```bash
npm list sharp
# sharp@0.33.0
```

### 3. Variables de Entorno (.env)

```env
# Opcional: Para Google Maps embed (venue maps)
GOOGLE_MAPS_API_KEY=your_api_key_here

# Ya está configurado en:
NODE_ENV=development
DB_HOST=localhost
DB_USER=catering_user
DB_PASS=secure_password
DB_NAME=catering_proposals
```

---

## 📊 Base de Datos

### Tabla `venues`

```sql
CREATE TABLE venues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    capacity_cocktail INT,
    capacity_banquet INT,
    capacity_theater INT,
    features JSON,              -- ["Wifi", "Parking", ...]
    address VARCHAR(255),
    map_iframe TEXT,           -- Google Maps/OSM embed (optional)
    external_url VARCHAR(255), -- Link al sitio original
    images JSON,               -- ["/uploads/hash/img.webp", ...]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Relación con Propuestas

```sql
CREATE TABLE proposal_venues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proposal_id INT,
    venue_id INT,             -- ← Foreign key a venues
    is_selected BOOLEAN DEFAULT FALSE,
    custom_override_json JSON,
    FOREIGN KEY (proposal_id) REFERENCES proposals(id),
    FOREIGN KEY (venue_id) REFERENCES venues(id)
);
```

---

## 🎯 Panel Admin - Interfaz

### Acceso

```
URL: http://localhost:3000/admin/venues

Requisitos:
- Logueado (req.session.user)
- Rol: admin (req.session.user.role === 'admin')
- Middleware: authenticateUser + authorizeRole('admin')
```

### Funcionalidades en Panel

| Feature | Botón | Acción |
|---------|-------|--------|
| 🚀 Scraping | "Scrapear micecatering.com" | POST /api/admin/venues/scrape |
| ➕ Manual | "Crear Venue Manual" | Abre modal de formulario |
| 📁 CSV | "Importar CSV" | POST /api/admin/venues/import |
| ✏️ Editar | Ícono lápiz por venue | PUT /api/admin/venues/:id |
| 🗑️ Eliminar | Ícono papelera | DELETE /api/admin/venues/:id |
| 🔗 Ver Original | Ícono link | Abre external_url en pestaña nueva |

### Formulario de Fallback

Modal (`views/admin/venue-form-modal.ejs`) con:
- Nombre (requerido)
- Descripción
- Capacidades (Cóctel, Banquete, Teatro)
- Dirección
- Características (tags)
- URL externa

---

## 🐛 Troubleshooting

### ❌ Scraping falla silenciosamente

**Síntoma:** GET /api/admin/venues/scrape retorna `success: false`

**Causas posibles:**
1. Selectores HTML incorrectos (página cambió estructura)
2. Timeout de Puppeteer (aumentar a 45s)
3. Puppeteer no instala correctamente en Linux

**Solución:**
```javascript
// 1. Revisar selectores en scrapeVenues()
console.log('Selectores incorrectos. Actualizar en:.query() evaluadas');

// 2. Aumentar timeout
this.scraperTimeout = 45000; // De 30s a 45s

// 3. Para Linux, usar --no-sandbox (ya implementado):
browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
```

### ❌ Imágenes no se descargan

**Síntoma:** `contentType no es imagen` o `HTTP 403`

**Causas:**
1. URL requiere User-Agent custom
2. Anti-hotlinking en servidor original

**Solución (ya implementada):**
```javascript
const request = protocol.get(url, { 
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  timeout: 10000
}, ...);
```

### ❌ Formulario no envía datos

**Síntoma:** Modal abierto pero botón "Guardar" no funciona

**Causas:**
1. JavaScript no cargó correctamente
2. Validación form-level fallando

**Solución:**
```javascript
// En console:
console.log(document.getElementById('venue-form')); // Debe existir
console.log(currentFeatures); // Features array debe estar inicializado

// Abrir modal manualmente:
openVenueForm('new');
```

---

## 📈 Performance

### Benchmarks Esperados

| Operación | Tiempo | Notas |
|-----------|--------|-------|
| Scraping simple | 15-30s | Depende de velocidad red |
| Descargar 10 imágenes | 20-40s | Con procesamiento Sharp |
| Compress 1 imagen → WebP | 0.5-1s | Sharp es muy rápido |
| INSERT 12 venues en BD | <100ms | Batch queries |

### Optimizaciones Futuras

- [ ] Caché de venues (Redis)
- [ ] Batch image processing paralelo
- [ ] Puppeteer pool (múltiples instancias)
- [ ] WebP generation async (background job)
- [ ] CDN para imágenes (vs /public/uploads/)

---

## 🔒 Seguridad

✅ **Prepared Statements** - Protección SQL Injection  
✅ **MIME Type Validation** - No ejecutar archivos maliciosos  
✅ **User-Agent Spoofing** - Evitar bloqueos anti-bot simples  
✅ **Timeout Protection** - No cuelgues si servidor externo lento  
✅ **Role-based Access** - Solo admin puede scrapear  
✅ **Error Handling** - No expone rutas internas  

---

## 📚 Archivos Modificados/Creados

```
✅ src/services/VenueService.js           # NEW - Lógica completa (395 líneas)
✅ src/routes/api.js                      # UPDATED - Agregadas rutas venues
✅ views/admin/venues-list.ejs            # NEW - Panel principal
✅ views/admin/venue-form-modal.ejs       # NEW - Formulario modal reutilizable
✅ src/controllers/adminController.js     # UPDATED - getVenuesListPage()
✅ src/routes/dashboard.js                # UPDATED - Agregadas rutas admin
```

---

## ✨ Estado de Implementación

- ✅ VenueService completo con Puppeteer
- ✅ Descarga y optimización de imágenes (Anti-hotlinking)
- ✅ Formulario manual (Fallback)
- ✅ API completa (GET/POST/PUT/DELETE)
- ✅ Interfaz Admin
- ✅ Rutas protegidas (solo admin)
- ✅ Error handling robusto
- ⏳ Tests automatizados (Phase 4)
- ⏳ Caché Redis (Future)

---

## 🎓 Próximos Pasos

1. **Testear Panel Admin**  
   ```bash
   npm run dev
   # Login como admin
   # Visitar: http://localhost:3000/admin/venues
   ```

2. **Ejecutar Scraping**
   - Botón: "Scrapear micecatering.com"
   - Esperar 30-45s
   - Verificar BD: `SELECT COUNT(*) FROM venues;`

3. **Fallback Manual**
   - Si scraping falla, click: "Crear Venue Manual"
   - Completar formulario
   - Guardar

4. **Usar en Propuestas**
   - Editor de propuestas
   - Agregar venue: Auto-completa desde tabla `venues`
   - Seleccionar capacidad según evento

---

**Implementado por:** GitHub Copilot  
**Arquitectura:** Service Pattern + RESTful API  
**Stack Confirmado:** Node.js v20+ | Puppeteer | Sharp | MariaDB
