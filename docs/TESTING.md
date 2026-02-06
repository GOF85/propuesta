# 🧪 MICE CATERING PROPOSALS - TESTING GUIDE

## Tabla de Contenidos

1. [Test Suite Completa](#test-suite-completa)
2. [Casos de Test - Fase 2](#casos-de-test---fase-2-dashboard)
3. [Casos de Test - Fase 3](#casos-de-test---fase-3-editor)
4. [Casos de Test - Fase 4](#casos-de-test---fase-4-cliente--chat)
5. [Performance Testing](#performance-testing)
6. [Security Testing](#security-testing)

---

## 🎯 Test Suite Completa

Total de casos: **56 tests**
- Fase 2: 16 tests
- Fase 3: 20 tests
- Fase 4: 20 tests

### Ejecución

```bash
# Cargar datos de prueba
npm run seed

# Iniciar servidor
npm start

# En otra terminal, ejecutar tests (cuando esté implementado)
npm test
```

---

## 📋 Casos de Test - Fase 2 (Dashboard)

### 1. **Autenticación**

#### TC-2.1: Login Usuario Válido
- **Pasos:**
  1. Ir a `/auth/login`
  2. Ingresar: email=`test@micecatering.eu`, password=`password123`
  3. Hacer clic en "Entrar"
- **Resultado Esperado:**
  - Sesión iniciada ✅
  - Redirigido a `/dashboard`
  - Email visible en header

#### TC-2.2: Login Email Inválido
- **Pasos:**
  1. Ir a `/auth/login`
  2. Ingresar: email=`invalid@email.com`, password=`anything`
  3. Hacer clic en "Entrar"
- **Resultado Esperado:**
  - Error mostrado: "Email o contraseña incorrectos"
  - Redirección a `/auth/login`

#### TC-2.3: Login Contraseña Incorrecta
- **Pasos:**
  1. Ir a `/auth/login`
  2. Ingresar: email=`test@micecatering.eu`, password=`wrong`
  3. Hacer clic en "Entrar"
- **Resultado Esperado:**
  - Error mostrado
  - Formulario vacío (no expone datos)

#### TC-2.4: Logout
- **Pasos:**
  1. Estar logeado
  2. Hacer clic en "Salir" (top-right menu)
- **Resultado Esperado:**
  - Sesión terminada
  - Redirigido a `/auth/login`
  - Cookies borradas

### 2. **Listar Propuestas**

#### TC-2.5: Cargar Dashboard (Sin Propuestas)
- **Pasos:**
  1. Login con usuario nuevo
  2. Ir a `/dashboard`
- **Resultado Esperado:**
  - Mensaje: "No hay propuestas todavía"
  - Botón "Nueva Propuesta" visible
  - Filtros disponibles

#### TC-2.6: Cargar Dashboard (Con Propuestas)
- **Pasos:**
  1. Ejecutar `npm run seed` (carga datos de prueba)
  2. Login
  3. Ir a `/dashboard`
- **Resultado Esperado:**
  - 5+ propuestas visibles
  - Tabla con: ID, Cliente, Estado, Fecha, Acciones
  - Estados con badges de color

#### TC-2.7: Filtrar por Estado
- **Pasos:**
  1. En `/dashboard`, hacer clic en dropdown "Estado"
  2. Seleccionar "Borrador"
  3. Aplicar filtro
- **Resultado Esperado:**
  - Solo propuestas con estado "Borrador"
  - Filtro se mantiene en sesión
  - Contador actualizado

#### TC-2.8: Buscar por Cliente
- **Pasos:**
  1. En `/dashboard`, ingresar en buscador: "Juan Pérez"
  2. Presionar Enter o hacer clic en "Buscar"
- **Resultado Esperado:**
  - Solo propuestas del cliente Juan Pérez
  - Búsqueda case-insensitive
  - Contador actualizado

### 3. **Crear Propuesta**

#### TC-2.9: Crear Nueva Propuesta
- **Pasos:**
  1. En `/dashboard`, hacer clic en "Nueva Propuesta"
  2. Rellenar: Nombre Cliente, Fecha Evento, PAX
  3. Hacer clic en "Crear"
- **Resultado Esperado:**
  - Propuesta creada con estado "Borrador"
  - Redirigido a `/editor/:id`
  - Hash único generado (en DB)

#### TC-2.10: Validación de Campos Requeridos
- **Pasos:**
  1. Hacer clic en "Nueva Propuesta"
  2. Dejar campos vacíos
  3. Intentar guardar
- **Resultado Esperado:**
  - Errores de validación mostrados
  - Propuesta no creada
  - Mensajes: "Campo requerido"

### 4. **Editar Propuesta**

#### TC-2.11: Abrir Propuesta para Editar
- **Pasos:**
  1. En `/dashboard`, hacer clic en propuesta (ícono "Editar")
  2. O directo a `/editor/1`
- **Resultado Esperado:**
  - Editor se abre
  - Datos previos cargados
  - Formulario interactivo

#### TC-2.12: Cambiar Estado
- **Pasos:**
  1. En `/editor/:id`, cambiar estado a "Enviada"
  2. Guardar
- **Resultado Esperado:**
  - Estado actualizado en DB
  - Badge reflejado en dashboard
  - Notificación flash: "Cambios guardados"

### 5. **Eliminar Propuesta**

#### TC-2.13: Eliminar Propuesta
- **Pasos:**
  1. En `/dashboard`, hacer clic en icono "Papelera"
  2. Confirmar en diálogo
- **Resultado Esperado:**
  - Propuesta eliminada (soft delete o CASCADE)
  - Notificación: "Propuesta eliminada"
  - Fila desaparece de tabla

#### TC-2.14: Cancelar Eliminación
- **Pasos:**
  1. En `/dashboard`, hacer clic en "Papelera"
  2. Hacer clic en "Cancelar"
- **Resultado Esperado:**
  - Propuesta NO eliminada
  - Modal cerrado
  - Datos intactos

### 6. **Información de Usuario**

#### TC-2.15: Ver Perfil
- **Pasos:**
  1. Hacer clic en avatar (top-right)
  2. Seleccionar "Mi Perfil"
- **Resultado Esperado:**
  - Perfil del usuario visible
  - Email, nombre, teléfono
  - Botón "Editar Perfil"

#### TC-2.16: Editar Perfil
- **Pasos:**
  1. En perfil, hacer clic en "Editar"
  2. Cambiar: teléfono, nombre
  3. Guardar
- **Resultado Esperado:**
  - Cambios guardados en DB
  - Sesión actualizada
  - Notificación de éxito

---

## 📋 Casos de Test - Fase 3 (Editor)

### 1. **Gestión de Venues**

#### TC-3.1: Agregar Venue a Propuesta
- **Pasos:**
  1. En `/editor/:id`, sección "Venues"
  2. Hacer clic en "Agregar Venue"
  3. Seleccionar "Salón Barcelona" de dropdown
  4. Guardar
- **Resultado Esperado:**
  - Venue agregado a tabla
  - Checkboxes disponibles (selección)
  - Precio y capacidad visible

#### TC-3.2: Remover Venue
- **Pasos:**
  1. En propuesta con venues, hacer clic en icono "X"
  2. Confirmar
- **Resultado Esperado:**
  - Venue removido de tabla
  - Relaciones en DB eliminadas (CASCADE)
  - Total de propuesta recalculado

#### TC-3.3: Marcar Venue como Seleccionado
- **Pasos:**
  1. En editor, hacer clic en checkbox del venue
  2. Guardar
- **Resultado Esperado:**
  - Venue marcado en DB (is_selected = true)
  - Cliente verá solo venues seleccionados en magic link

### 2. **Gestión de Servicios**

#### TC-3.4: Agregar Servicio
- **Pasos:**
  1. En `/editor/:id`, sección "Servicios"
  2. Hacer clic en "Agregar Servicio"
  3. Ingresar: Título="Welcome Coffee", Hora=09:00
  4. Guardar
- **Resultado Esperado:**
  - Servicio agregado a tabla con orden
  - Puedo agregar opciones A/B
  - Timeline se ordena cronológicamente

#### TC-3.5: Servicio sin Opciones
- **Pasos:**
  1. Agregar servicio "Almuerzo de Trabajo"
  2. Dejar sin opciones alternativas (solo una opción)
- **Resultado Esperado:**
  - Servicio guardado
  - No hay radio buttons para cliente (opción única)

#### TC-3.6: Servicio con Opciones (Multichoice)
- **Pasos:**
  1. Agregar servicio con: is_multichoice = true
  2. Ingresar Opción A: "Menú Premium" (50€/pax)
  3. Ingresar Opción B: "Menú Estándar" (30€/pax)
  4. Guardar
- **Resultado Esperado:**
  - Ambas opciones guardadas
  - Cliente verá radio buttons para elegir
  - Precio se calcula según opción seleccionada

#### TC-3.7: Cambiar VAT Rate
- **Pasos:**
  1. En servicio gastronómico, cambiar VAT a 21%
  2. Guardar
- **Resultado Esperado:**
  - VAT actualizado
  - Precio bruto recalculado
  - Diferencia mostrada en resumen

### 3. **Gestión de Platos**

#### TC-3.8: Agregar Plato a Opción de Servicio
- **Pasos:**
  1. En servicio con opción, hacer clic en "Agregar Plato"
  2. Seleccionar "Ensalada César" del catálogo
  3. Guardar
- **Resultado Esperado:**
  - Plato copiado a proposal_items
  - Plato mostrado en lista con imagen
  - Alergenos visibles

#### TC-3.9: Editar Descripción de Plato
- **Pasos:**
  1. En propuesta, hace clic en plato
  2. Cambiar descripción a: "Con croutons caseros"
  3. Guardar
- **Resultado Esperado:**
  - Descripción actualizada SOLO en esta propuesta
  - Catálogo maestro NO afectado
  - Cambio visible en cliente view

#### TC-3.10: Remover Plato de Propuesta
- **Pasos:**
  1. En editor, hacer clic en icono "X" del plato
  2. Confirmar
- **Resultado Esperado:**
  - Plato removido de propuesta
  - Catálogo no afectado
  - Total recalculado

### 4. **Cálculo de Precios**

#### TC-3.11: Calcular Total sin Descuentos
- **Pasos:**
  1. Propuesta con:
     - 50 PAX
     - Servicio A: 40€/pax + VAT 21%
     - Servicio B: 30€/pax + VAT 10%
  2. Hacer clic en "Calcular Total"
- **Resultado Esperado:**
  ```
  Servicio A: 50 × 40 = 2000€ + 21% VAT = 2420€
  Servicio B: 50 × 30 = 1500€ + 10% VAT = 1650€
  Total Bruto: 4070€
  ```

#### TC-3.12: Descuento por PAX (Cantidad)
- **Pasos:**
  1. En servicio, ingresar descuento: -2€/pax para 50+ pax
  2. Calcular
- **Resultado Esperado:**
  ```
  Base: 50 × 40 = 2000€
  Descuento: 50 × 2 = -100€
  Subtotal: 1900€
  VAT 21%: +399€
  Total: 2299€
  ```

#### TC-3.13: Cambiar PAX (Recálculo Dinámico)
- **Pasos:**
  1. Cambiar PAX de 50 a 60 en propuesta
  2. Sistema recalcula automáticamente
- **Resultado Esperado:**
  - Totales actualizados en tiempo real
  - AJAX sin recargar página
  - JSON con nuevos valores retornado

#### TC-3.14: VAT Diferenciado por Servicio
- **Pasos:**
  1. Propuesta con servicios:
     - "Catering" → VAT 10%
     - "Bebidas" → VAT 21%
  2. Calcular totales
- **Resultado Esperado:**
  - Cada servicio tiene VAT distinto
  - Totales correctos con VAT aplicado por fila
  - Desglose visible en propuesta

### 5. **Gestión de Venues Adicionales (Scraping)**

#### TC-3.15: Scrape Venue desde URL Externa
- **Pasos:**
  1. En editor, hacer clic en "Importar Venue"
  2. Ingresar URL: https://micecatering.com/venues/salones
  3. Hacer clic en "Scrapear"
- **Resultado Esperado:**
  - Puppeteer carga página
  - Extrae: nombre, capacidad, descripción, imagen
  - Imagen descargada y optimizada (WebP, max 1920px)
  - Venue agregado al catálogo

#### TC-3.16: Scraping sin Imagen (Fallback)
- **Pasos:**
  1. Scrapear venue sin foto
  2. Guardar
- **Resultado Esperado:**
  - Venue se guarda igual
  - Campo imagen puede ser NULL
  - Placeholder mostrado en UI
  - No hay errores en logs

### 6. **Vistas Previas**

#### TC-3.17: Vista Previa de Propuesta
- **Pasos:**
  1. En editor, hacer clic en "Vista Previa"
- **Resultado Esperado:**
  - Modal muestra propuesta como cliente la vería
  - Estilos finales aplicados
  - No hay controles de edición

#### TC-3.18: Exportar a PDF (Placeholder)
- **Pasos:**
  1. En editor, hacer clic en "Descargar PDF"
- **Resultado Esperado:**
  - PDF se genera con Puppeteer
  - Descarga como `propuesta_001_Enero2026.pdf`
  - Formato profesional con logo, colores, branding

### 7. **Persistencia y Transacciones**

#### TC-3.19: Guardar Múltiples Cambios (Transacción)
- **Pasos:**
  1. En editor:
     - Agregar venue
     - Agregar servicio
     - Agregar platos
     - Cambiar PAX
  2. Hacer clic en "Guardar Todo"
- **Resultado Esperado:**
  - Transacción SQL: BEGIN → INSERT venue, service, items → UPDATE proposal → COMMIT
  - Si error → ROLLBACK (sin cambios parciales)
  - Notificación de éxito

#### TC-3.20: Validación de Integridad
- **Pasos:**
  1. Intentar guardar propuesta sin venues ni servicios
  2. Hacer clic en "Validar"
- **Resultado Esperado:**
  - Error: "Debe haber al menos 1 venue y 1 servicio"
  - Propuesta NO se guarda
  - Campos requeridos resaltados

---

## 📋 Casos de Test - Fase 4 (Cliente + Chat)

### 1. **Magic Link Access**

#### TC-4.1: Acceso Cliente sin Login
- **Pasos:**
  1. Comercial genera propuesta
  2. Envía a cliente: https://propuestas.micecatering.eu/p/abc123xyz...
  3. Cliente abre link (sin login)
- **Resultado Esperado:**
  - Propuesta se carga sin autenticación
  - Datos de cliente visibles
  - Interactividad limitada (solo lectura + chat)

#### TC-4.2: Hash Inválido
- **Pasos:**
  1. Ir a: https://propuestas.micecatering.eu/p/invalid-hash
- **Resultado Esperado:**
  - Error 404: "Propuesta no encontrada"
  - Sin exponer detalles del error
  - Redirección a página de error amigable

#### TC-4.3: Propuesta en Modo Edición
- **Pasos:**
  1. Comercial está editando (is_editing = true)
  2. Cliente abre magic link
- **Resultado Esperado:**
  - Pantalla de "Propuesta en Revisión"
  - Spinner de carga
  - Botón para refrescar
  - Email de notificación: "Te avisaremos cuando esté lista"

### 2. **Ver Propuesta (Cliente)**

#### TC-4.4: Cargar Propuesta Completa
- **Pasos:**
  1. Cliente abre magic link válido
  2. Propuesta con venues, servicios, platos
- **Resultado Esperado:**
  - Encabezado: Número propuesta, fecha evento
  - Sección: Información del evento
  - Sección: Venues disponibles
  - Tabla: Servicios con precios desglosados
  - Sidebar: Total, VAT, precio final
  - Botones de acción (Aceptar, Modificar, Rechazar)

#### TC-4.5: Información del Evento
- **Pasos:**
  1. En propuesta cliente, revisar tarjeta "Evento"
- **Resultado Esperado:**
  - Fecha evento visible
  - PAX (número de personas)
  - Condiciones legales
  - Información de contacto comercial (opcional)

#### TC-4.6: Desglose de Servicios
- **Pasos:**
  1. En propuesta cliente, revisar tabla de servicios
- **Resultado Esperado:**
  ```
  | Servicio | Precio/Pax | Cantidad | Subtotal | VAT | Total |
  | Welcome Coffee | 5€ | 50 | 250€ | +10% | 275€ |
  | Almuerzo | 40€ | 50 | 2000€ | +21% | 2420€ |
  ```

#### TC-4.7: Cálculo de Total Correcto
- **Pasos:**
  1. Sumar todos los servicios (con VAT)
  2. Verificar "Total" en sidebar
- **Resultado Esperado:**
  - Total = Σ(servicio con VAT)
  - Coincide con DB
  - Formato moneda correcto (2 decimales)

### 3. **Aceptar Propuesta**

#### TC-4.8: Aceptar Propuesta (Workflow)
- **Pasos:**
  1. Cliente hace clic en "Aceptar Propuesta"
  2. Modal de confirmación aparece
  3. Hacer clic en "Confirmar"
- **Resultado Esperado:**
  - API POST a /p/:hash/accept
  - Status propuesta → "accepted"
  - Email enviado al comercial: "Cliente aceptó"
  - Chat: Mensaje automático "✅ He aceptado la propuesta"
  - Cliente ve: "Propuesta aceptada" (mensaje verde)

#### TC-4.9: Email de Aceptación
- **Pasos:**
  1. Cliente acepta propuesta
  2. Revisar email del comercial
- **Resultado Esperado:**
  - Email recibido en: EMAIL_USER (de .env)
  - Asunto: "Cliente ACEPTÓ tu propuesta #001"
  - Body con: Cliente, fecha, enlace a dashboard
  - HTML formateado + plantilla

### 4. **Rechazar Propuesta**

#### TC-4.10: Rechazar con Motivo
- **Pasos:**
  1. Cliente hace clic en "Rechazar Propuesta"
  2. Modal: Ingresa motivo: "Presupuesto muy alto"
  3. Hacer clic en "Rechazar"
- **Resultado Esperado:**
  - Propuesta vuelve a "draft"
  - Motivo guardado en DB (en chat o campo custom)
  - Email al comercial con motivo
  - Cliente ve: "Propuesta rechazada" (mensaje rojo)

#### TC-4.11: Motivo Requerido
- **Pasos:**
  1. Hacer clic en "Rechazar"
  2. Dejar motivo vacío
  3. Intentar confirmar
- **Resultado Esperado:**
  - Error: "Por favor, indica el motivo del rechazo"
  - Propuesta NO se rechaza
  - Modal se mantiene abierto

### 5. **Solicitar Modificaciones**

#### TC-4.12: Solicitar Cambios
- **Pasos:**
  1. Cliente hace clic en "Solicitar Cambios"
  2. Ingresa: "Cambiar almuerzo a opción vegana"
  3. Hacer clic en "Enviar"
- **Resultado Esperado:**
  - Propuesta vuelve a "draft" (editable por comercial)
  - Chat: Mensaje del cliente visible
  - Email al comercial: "Cliente solicita modificaciones"
  - Cliente ve: "Cambios solicitados" (mensaje amarillo)

#### TC-4.13: Comentario de Modificación
- **Pasos:**
  1. Solicitar cambios con texto largo (500 caracteres)
  2. Verificar en cliente
- **Resultado Esperado:**
  - Comentario completo visible
  - Formato de párrafos preservado
  - Emoji soportados (😊, 👍, etc.)
  - Longitud validada (min 10, max 2000 caracteres)

### 6. **Sistema de Chat**

#### TC-4.14: Enviar Mensaje (Cliente)
- **Pasos:**
  1. Cliente en propuesta, sección "Chat"
  2. Escribir: "¿Puedo cambiar las bebidas?"
  3. Presionar Enter o hacer clic en "Enviar"
- **Resultado Esperado:**
  - Mensaje aparece en chat
  - Timestamp: "Hace unos segundos"
  - Usuario: "Cliente"
  - Mensaje grabado en DB

#### TC-4.15: Recibir Mensaje (Polling)
- **Pasos:**
  1. Comercial envía mensaje desde dashboard
  2. Esperar 30 segundos
  3. Revisar chat en cliente
- **Resultado Esperado:**
  - Mensaje aparece automáticamente (polling)
  - Timestamp actualizado
  - Usuario: "Comercial"
  - Sin necesidad de recargar

#### TC-4.16: Email Notificación de Mensaje
- **Pasos:**
  1. Comercial envía mensaje
  2. Cliente recibe email
- **Resultado Esperado:**
  - Email enviado a cliente (EMAIL de propuesta.user)
  3. Asunto: "Nuevo mensaje sobre tu propuesta"
  - Body: Preview del mensaje
  - Enlace a propuesta

#### TC-4.17: Historial de Chat
- **Pasos:**
  1. Propuesta con 20+ mensajes
  2. Abrir chat
- **Resultado Esperado:**
  - Últimos 50 mensajes visible
  - Scroll up carga más (si implementado)
  - Orden cronológico (nuevo abajo)
  - Sin latencia perceptible

#### TC-4.18: Validación de Mensajes
- **Pasos:**
  1. Intentar enviar mensaje vacío
  2. Intentar enviar texto de 10,000 caracteres
- **Resultado Esperado:**
  - Error 400: "Mensaje debe tener 1-2000 caracteres"
  - Mensaje NO se guarda
  - Campo resaltado en rojo

### 7. **Print & Descargas**

#### TC-4.19: Imprimir Propuesta
- **Pasos:**
  1. Cliente presiona Ctrl+P (o botón "Imprimir")
  2. Vista de print se abre
- **Resultado Esperado:**
  - Layout limpio sin botones, navbar
  - Estilos print-safe (no se ve fondo gris)
  - Colores branding preservados
  - PDF generado correctamente

#### TC-4.20: Descargar Propuesta (PDF)
- **Pasos:**
  1. Cliente hace clic en "Descargar PDF"
  2. Esperar generación con Puppeteer
- **Resultado Esperado:**
  - Descarga: `propuesta_NNNN_Cliente_Mes.pdf`
  - Contenido idéntico a propuesta HTML
  - Logo del cliente incrustado
  - Colores de branding aplicados

---

## ⚡ Performance Testing

### PT-1: Tiempo de Carga
```
GET /dashboard (con 100 propuestas)
Esperado: < 1s

GET /editor/:id (con 50 servicios)
Esperado: < 1s

GET /p/:hash (magic link)
Esperado: < 500ms
```

### PT-2: Cálculo de Totales
```
Propuesta con 100 servicios x 30 platos
Calcular totales: < 200ms
JSON retornado vía API
```

### PT-3: Concurrencia
```
100 usuarios simultáneos en /dashboard
Sin errores de conexión DB
Response time: < 2s
```

---

## 🔐 Security Testing

### ST-1: SQL Injection
```javascript
// Login form
email: admin' OR '1'='1
password: anything

Resultado: Error "Email o contraseña incorrectos"
(No expone estructura DB)
```

### ST-2: XSS Prevention
```javascript
// Chat
Mensaje: <script>alert('XSS')</script>

Resultado: Mensaje se guarda como texto plano
Renderizado como: &lt;script&gt;alert('XSS')&lt;/script&gt;
```

### ST-3: CSRF Protection
```
POST /proposals (sin token CSRF)
Resultado: Error 403 Forbidden
```

### ST-4: Session Hijacking
```
Cookie de sesión robada
Resultado: Token inválido, logout automático
```

### ST-5: Rate Limiting (Magic Link)
```
GET /p/:hash (5 veces en 1 minuto)
Resultado: 6ta petición → 429 Too Many Requests
```

### ST-6: Permission Check
```
Usuario A intenta acceder a propuesta de Usuario B
GET /editor/propuesta_de_B
Resultado: Error 403 Forbidden
```

---

## 📊 Test Execution Report Template

```markdown
# Test Execution Report - [Fecha]

## Summary
- Total Tests: 56
- Passed: ✅ 56
- Failed: ❌ 0
- Skipped: ⏭️ 0
- Pass Rate: 100%

## Phase 2 - Dashboard (16 tests)
- ✅ All authentication tests passed
- ✅ Dashboard loading verified
- ✅ CRUD operations working
- ✅ Filters and search functional

## Phase 3 - Editor (20 tests)
- ✅ Venue management complete
- ✅ Service configuration working
- ✅ Price calculations verified
- ✅ Scraping fallback tested

## Phase 4 - Client Portal (20 tests)
- ✅ Magic link access working
- ✅ Chat system polling verified
- ✅ Email notifications sent
- ✅ PDF generation functional

## Performance
- Dashboard load: 850ms ✅
- Editor calculate: 180ms ✅
- Magic link: 420ms ✅

## Security
- SQL Injection: ✅ Protected
- XSS: ✅ Protected
- CSRF: ✅ Protected
- Session: ✅ Secure

## Observations
- All systems operational
- No critical bugs found
- Ready for production deployment
```

---

## 🛠️ Ejecutar Tests

```bash
# Test de autenticación
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@micecatering.eu","password":"password123"}'

# Test de dashboard
curl -b cookies.txt http://localhost:3000/dashboard

# Test de email
node -e "
const EmailService = require('./src/services/EmailService');
EmailService.sendProposalToClient({
  to: 'test@email.com',
  clientName: 'Test Client',
  hash: 'test-hash-123'
}).then(() => console.log('✅ Email enviado'))
  .catch(err => console.log('❌', err.message));
"

# Test de magic link
curl http://localhost:3000/p/test-hash-123
```

---

**Última Actualización:** Febrero 2026  
**Versión:** 1.0.0
