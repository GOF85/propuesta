# 💰 MOTOR FINANCIERO COMPLETO - Documentación Técnica

## 📋 Descripción General

Sistema completo de cálculo financiero para propuestas de catering MICE con:
- **IVA Dual**: 10% servicios, 21% alimentos
- **Descuentos por Volumen**: Automáticos según PAX
- **Márgenes**: Cálculo de rentabilidad por propuesta y servicio
- **Auditoría**: Registro completo de cambios de precio

---

## 🏗️ Arquitectura

### Base de Datos

#### Nuevas Tablas

**`price_audit_log`** - Registro de cambios de precio
```sql
- id: INT PRIMARY KEY
- proposal_id: INT FK
- user_id: INT FK
- change_type: ENUM('price_update', 'discount_update', 'vat_update', ...)
- entity_type: ENUM('proposal', 'service', 'option', 'item')
- entity_id: INT
- old_value: DECIMAL(10,2)
- new_value: DECIMAL(10,2)
- description: TEXT
- metadata: JSON
- created_at: TIMESTAMP
```

**`volume_discount_tiers`** - Configuración de descuentos por volumen
```sql
- id: INT PRIMARY KEY
- min_pax: INT
- max_pax: INT (nullable)
- discount_percentage: DECIMAL(5,2)
- description: VARCHAR(255)
- is_active: BOOLEAN
```

#### Campos Añadidos a `proposals`
```sql
- discount_percentage: DECIMAL(5,2)  -- Descuento manual %
- discount_reason: VARCHAR(255)      -- Razón del descuento
- volume_discount_applied: BOOLEAN   -- ¿Descuento auto aplicado?
- total_base: DECIMAL(10,2)          -- Total sin IVA
- total_vat: DECIMAL(10,2)           -- Total IVA
- total_final: DECIMAL(10,2)         -- Total con IVA
- total_cost: DECIMAL(10,2)          -- Coste total
- total_margin: DECIMAL(10,2)        -- Margen (€)
- margin_percentage: DECIMAL(5,2)    -- Margen %
- last_calculated_at: TIMESTAMP      -- Última actualización
```

#### Campos Añadidos a `service_options`
```sql
- cost_price: DECIMAL(10,2)          -- Coste de la opción
- margin_percentage: DECIMAL(5,2)    -- Margen esperado
```

#### Campos Añadidos a `dishes`
```sql
- cost_price: DECIMAL(10,2)          -- Coste unitario
- margin_percentage: DECIMAL(5,2)    -- Margen esperado
```

---

## 🔧 API del Servicio

### ProposalService

#### `calculateTotals(proposalId, options)`

**Método principal del motor financiero.**

**Parámetros:**
- `proposalId` (number): ID de la propuesta
- `options` (object):
  - `persist` (boolean, default: true): Guardar totales en BD
  - `auditUserId` (number, opcional): ID del usuario para auditoría

**Retorna:** Objeto con estructura completa de totales
```javascript
{
  total_base: 1000.00,                    // Base imponible original
  total_discount: 50.00,                  // Descuentos aplicados
  total_base_after_discount: 950.00,      // Base tras descuentos
  total_vat_services: 95.00,              // IVA 10% (servicios)
  total_vat_food: 199.50,                 // IVA 21% (alimentos)
  total_vat: 294.50,                      // IVA total
  total_final: 1244.50,                   // Total con IVA
  total_cost: 600.00,                     // Coste total
  total_margin: 350.00,                   // Margen en euros
  margin_percentage: 36.84,               // Margen porcentual
  volume_discount_percentage: 5.00,       // Descuento por volumen aplicado
  volume_discount_applied: true,          // Si hay descuento automático
  manual_discount_percentage: 0,          // Descuento manual
  breakdown: [...]                        // Detalle por ítem
}
```

**Lógica de Cálculo:**

1. **Por cada ítem:**
   - Precio neto = `price_pax - discount_pax`
   - Subtotal = `precio_neto * pax`
   - Determinar IVA según `service_type`:
     - `logistics`, `staff`, `other` → 10%
     - `gastronomy` → 21%
   - Calcular IVA del ítem

2. **Descuentos:**
   - Buscar tier de descuento por volumen según PAX
   - Si existe y no hay descuento manual → aplicar automático
   - Si hay descuento manual → toma prioridad
   - Aplicar descuento sobre `total_base`

3. **IVA Final:**
   - Recalcular IVA sobre base con descuento aplicado
   - Mantener proporción entre IVA servicios/alimentos

4. **Márgenes:**
   - Margen = `base_after_discount - total_cost`
   - Margen % = `(margen / base_after_discount) * 100`

5. **Persistencia:**
   - Si `persist = true`: guardar en campos de `proposals`
   - Si `auditUserId`: registrar en `price_audit_log`

---

#### `applyManualDiscount(proposalId, userId, discountPercentage, reason)`

Aplica un descuento manual a una propuesta.

**Parámetros:**
- `proposalId` (number)
- `userId` (number): Usuario que aplica descuento
- `discountPercentage` (number): 0-100
- `reason` (string): Justificación

**Retorna:** Objeto de totales recalculados

**Nota:** El descuento manual sobreescribe cualquier descuento por volumen.

---

#### `getMarginAnalysis(proposalId)`

Análisis detallado de márgenes por servicio.

**Retorna:**
```javascript
{
  totals: {...},              // Totales globales
  services: [                 // Breakdown por servicio
    {
      id: 1,
      title: "Welcome Coffee",
      type: "gastronomy",
      vat_rate: 21.00,
      revenue: 500.00,
      cost: 300.00,
      margin: 200.00,
      margin_percentage: 40.00
    },
    ...
  ],
  summary: {
    total_revenue: 1244.50,
    total_cost: 600.00,
    total_margin: 644.50,
    margin_percentage: 51.77,
    vat_breakdown: {
      services_10: 95.00,
      food_21: 199.50,
      total: 294.50
    }
  }
}
```

---

#### `getPriceAuditLog(proposalId)`

Historial completo de cambios de precio.

**Retorna:** Array de registros de auditoría ordenados por fecha.

---

#### `getVolumeDiscountTiers()`

Configuración de descuentos por volumen activa.

---

#### `updateVolumeDiscountTier(tierId, data)` y `createVolumeDiscountTier(data)`

Gestión de configuración de descuentos (solo admin).

---

## 🌐 Endpoints API

### Cálculos y Totales

#### `GET /api/proposals/:id/totals`
Obtener totales detallados (sin persistir).

**Respuesta:**
```json
{
  "success": true,
  "totals": { /* objeto totales */ }
}
```

#### `POST /api/proposals/:id/calculate`
Recalcular y persistir totales.

**Respuesta:**
```json
{
  "success": true,
  "totals": { /* objeto totales */ },
  "formatted": {
    "total_base": "1.000,00 €",
    "total_vat": "210,00 €",
    "total_final": "1.210,00 €",
    "total_margin": "400,00 €",
    "margin_percentage": "40,00%"
  }
}
```

---

### Descuentos

#### `POST /api/proposals/:id/discount`
Aplicar descuento manual.

**Body:**
```json
{
  "discount_percentage": 10,
  "reason": "Cliente corporativo - descuento negociado"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Descuento aplicado correctamente",
  "totals": { /* totales actualizados */ }
}
```

#### `DELETE /api/proposals/:id/discount`
Eliminar descuento manual.

---

### Análisis

#### `GET /api/proposals/:id/margin-analysis`
Análisis de márgenes detallado.

**Respuesta:**
```json
{
  "success": true,
  "analysis": {
    "totals": { /* totales */ },
    "services": [ /* breakdown por servicio */ ],
    "summary": { /* resumen ejecutivo */ }
  }
}
```

#### `GET /api/proposals/:id/audit-log`
Historial de cambios de precio.

**Respuesta:**
```json
{
  "success": true,
  "audit_log": [
    {
      "id": 123,
      "proposal_id": 1,
      "user_name": "Juan Comercial",
      "change_type": "discount_update",
      "entity_type": "proposal",
      "old_value": 0,
      "new_value": 10,
      "description": "Descuento manual aplicado: Cliente VIP",
      "created_at": "2026-02-06T10:30:00Z"
    }
  ]
}
```

---

### Configuración de Descuentos por Volumen

#### `GET /api/volume-discounts`
Obtener todos los tiers de descuento.

#### `POST /api/volume-discounts` (Admin only)
Crear nuevo tier.

**Body:**
```json
{
  "min_pax": 100,
  "max_pax": 199,
  "discount_percentage": 5,
  "description": "Descuento 5% para 100-199 pax"
}
```

#### `PUT /api/volume-discounts/:tierId` (Admin only)
Actualizar tier existente.

---

## 📊 Configuración por Defecto

### Tiers de Descuento por Volumen

| PAX | Descuento | Descripción |
|-----|-----------|-------------|
| 50-99 | 2% | Grupos pequeños |
| 100-199 | 5% | Grupos medianos |
| 200-499 | 8% | Grupos grandes |
| 500+ | 12% | Eventos masivos |

### Tasas de IVA

- **Servicios (logística, staff, otros)**: 10%
- **Alimentos (gastronomía)**: 21%

*Configurado en: `/src/config/constants.js` → `VAT_RATES`*

---

## 🔍 Casos de Uso

### Caso 1: Cálculo Automático en Listado

```javascript
// En listProposals - solo obtener total_final
const totals = await calculateTotals(proposalId, { persist: false });
proposal.total = totals.total_final;
```

### Caso 2: Edición de Propuesta - Totales Completos

```javascript
// En getProposalById - persistir y mostrar todo
const totals = await calculateTotals(proposalId, { 
  persist: true, 
  auditUserId: req.user.id 
});
proposal.totals = totals;
```

### Caso 3: Aplicar Descuento Manual

```javascript
// Usuario aplica descuento del 15%
const totals = await applyManualDiscount(
  proposalId,
  userId,
  15,
  'Cliente corporativo recurrente - contrato anual'
);

// El sistema:
// 1. Guarda descuento en proposals.discount_percentage
// 2. Recalcula totales
// 3. Persiste en campos total_*
// 4. Registra en price_audit_log
```

### Caso 4: Análisis de Rentabilidad

```javascript
// Ver márgenes antes de enviar propuesta
const analysis = await getMarginAnalysis(proposalId);

if (analysis.summary.margin_percentage < 20) {
  console.log('⚠️ Margen bajo - revisar costes');
}
```

---

## 🚀 Instalación y Migración

### 1. Ejecutar Migración SQL

```bash
mysql -u root -p catering_proposals < migrations/001_financial_engine.sql
```

### 2. Verificar Campos

```sql
DESCRIBE proposals;
DESCRIBE service_options;
DESCRIBE dishes;
DESCRIBE price_audit_log;
DESCRIBE volume_discount_tiers;
```

### 3. Datos de Prueba (Opcional)

```sql
-- Actualizar coste en platos existentes
UPDATE dishes SET cost_price = base_price * 0.6, margin_percentage = 40.00;

-- Actualizar coste en opciones existentes
UPDATE service_options SET cost_price = price_pax * 0.7, margin_percentage = 30.00;
```

### 4. Recalcular Propuestas Existentes

```javascript
// Script de mantenimiento
const ProposalService = require('./src/services/ProposalService');

async function recalculateAll() {
  const proposals = await pool.query('SELECT id FROM proposals');
  
  for (const p of proposals) {
    await ProposalService.calculateTotals(p.id, { persist: true });
    console.log(`✅ Propuesta ${p.id} recalculada`);
  }
}

recalculateAll();
```

---

## ⚠️ Consideraciones Importantes

### Rendimiento

- **Cálculos en Listados**: Usar `persist: false` para evitar escrituras
- **Cache**: Los totales se guardan en `proposals` → lectura directa sin recalcular
- **Recálculo Automático**: Solo cuando cambian items/servicios/opciones

### Transacciones

- `applyManualDiscount`: Usa transacciones para garantizar consistencia
- `calculateTotals`: Si `persist: true`, usa transacción implícita

### Auditoría

- Solo se audita si `auditUserId` está presente
- Cambios automáticos (ej: volumen) NO se auditan excepto si usuario forza recálculo
- Historial completo disponible en `v_recent_price_changes` (vista SQL)

### Seguridad

- Descuentos manuales: Solo propietario de propuesta
- Configuración de tiers: Solo `admin`
- Márgenes: Visibles solo para comerciales/admin (no cliente)

---

## 📝 Testing

### Test Unitario - Cálculo IVA Dual

```javascript
const proposal = {
  id: 1,
  pax: 100,
  items: [
    { type: 'gastronomy', price_pax: 50, vat: 21 },  // Esperado: 5000 + 1050 IVA
    { type: 'logistics', price_pax: 10, vat: 10 }    // Esperado: 1000 + 100 IVA
  ]
};

const totals = await calculateTotals(1);
assert.equal(totals.total_vat_food, 1050.00);
assert.equal(totals.total_vat_services, 100.00);
assert.equal(totals.total_final, 7150.00);
```

### Test Integración - Descuento por Volumen

```javascript
// Setup: Propuesta con 150 PAX (debería aplicar 5% según tier)
const proposal = await createTestProposal({ pax: 150 });
await addTestItems(proposal.id, 2000); // 2000€ base

const totals = await calculateTotals(proposal.id);

assert.equal(totals.volume_discount_applied, true);
assert.equal(totals.volume_discount_percentage, 5.00);
assert.equal(totals.total_discount, 100.00);  // 5% de 2000
```

---

## 📚 Referencias

- **Schema Completo**: [database.sql](../database.sql)
- **Migración**: [migrations/001_financial_engine.sql](../migrations/001_financial_engine.sql)
- **Servicio**: [src/services/ProposalService.js](../src/services/ProposalService.js)
- **API Routes**: [src/routes/api.js](../src/routes/api.js)
- **Constantes**: [src/config/constants.js](../src/config/constants.js)

---

**Última Actualización**: 6 de febrero de 2026  
**Versión**: 1.0.0  
**Estado**: ✅ Producción
