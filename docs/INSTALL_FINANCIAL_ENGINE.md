# 🚀 Motor Financiero - Instalación Rápida

## ⚡ Setup en 3 Pasos

### 1️⃣ Ejecutar Migración SQL

```bash
cd /path/to/propuesta
mysql -u root -p catering_proposals < migrations/001_financial_engine.sql
```

**Lo que hace:**
- ✅ Añade campos de coste y márgenes a `dishes` y `service_options`
- ✅ Crea tabla `price_audit_log` para auditoría
- ✅ Crea tabla `volume_discount_tiers` con configuración por defecto
- ✅ Añade campos calculados a `proposals` (total_base, total_vat, etc.)
- ✅ Crea vistas SQL para análisis rápido

### 2️⃣ Verificar Instalación

```bash
mysql -u root -p catering_proposals -e "
SELECT COUNT(*) as tiers FROM volume_discount_tiers;
DESCRIBE price_audit_log;
SHOW COLUMNS FROM proposals LIKE 'total_%';
"
```

**Salida esperada:**
- 4 tiers de descuento por volumen
- Tabla `price_audit_log` con 10 columnas
- 6 campos `total_*` en proposals

### 3️⃣ Ejecutar Tests

```bash
node scripts/test-financial-engine.js
```

**Verifica:**
- ✅ Cálculo de IVA dual (10% servicios, 21% alimentos)
- ✅ Descuentos por volumen automáticos
- ✅ Descuentos manuales
- ✅ Cálculo de márgenes
- ✅ Auditoría de cambios
- ✅ Persistencia en BD

---

## 🔧 Configuración Opcional

### Actualizar Costes en Datos Existentes

Si ya tienes datos en producción, actualiza los costes:

```sql
-- Asignar coste del 60% del precio en platos
UPDATE dishes 
SET cost_price = base_price * 0.60, 
    margin_percentage = 40.00 
WHERE cost_price = 0;

-- Asignar coste del 70% en opciones de servicio
UPDATE service_options 
SET cost_price = price_pax * 0.70, 
    margin_percentage = 30.00 
WHERE cost_price = 0;
```

### Recalcular Propuestas Existentes

```javascript
// scripts/recalculate-all.js
const ProposalService = require('./src/services/ProposalService');
const { pool } = require('./src/config/db');

async function recalculateAll() {
  const proposals = await pool.query('SELECT id FROM proposals');
  
  for (const p of proposals) {
    await ProposalService.calculateTotals(p.id, { persist: true });
    console.log(`✅ Propuesta ${p.id} recalculada`);
  }
  
  console.log(`\n🎯 ${proposals.length} propuestas actualizadas`);
  process.exit(0);
}

recalculateAll();
```

```bash
node scripts/recalculate-all.js
```

---

## 📊 Configuración de Descuentos por Volumen

### Valores por Defecto (Ya instalados)

| PAX Mínimo | PAX Máximo | Descuento | Estado |
|------------|------------|-----------|--------|
| 50 | 99 | 2% | ✅ Activo |
| 100 | 199 | 5% | ✅ Activo |
| 200 | 499 | 8% | ✅ Activo |
| 500 | ∞ | 12% | ✅ Activo |

### Personalizar Tiers

```sql
-- Desactivar tier
UPDATE volume_discount_tiers 
SET is_active = FALSE 
WHERE min_pax = 50;

-- Modificar porcentaje
UPDATE volume_discount_tiers 
SET discount_percentage = 10.00 
WHERE min_pax = 100;

-- Añadir nuevo tier
INSERT INTO volume_discount_tiers 
  (min_pax, max_pax, discount_percentage, description)
VALUES 
  (1000, NULL, 15.00, 'Eventos mega - 15%');
```

---

## 🌐 Usar el Motor desde Frontend

### Obtener Totales

```javascript
// En editor.js
async function recalculateTotals() {
  const response = await fetch(`/api/proposals/${proposalId}/calculate`, {
    method: 'POST'
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Actualizar UI
    document.getElementById('total-base').textContent = data.formatted.total_base;
    document.getElementById('total-vat').textContent = data.formatted.total_vat;
    document.getElementById('total-final').textContent = data.formatted.total_final;
    document.getElementById('margin').textContent = data.formatted.total_margin;
  }
}

// Llamar después de añadir/eliminar servicios o items
addServiceButton.addEventListener('click', async () => {
  await addService();
  await recalculateTotals();
});
```

### Aplicar Descuento Manual

```javascript
async function applyDiscount() {
  const percentage = document.getElementById('discount-percentage').value;
  const reason = document.getElementById('discount-reason').value;
  
  const response = await fetch(`/api/proposals/${proposalId}/discount`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      discount_percentage: parseFloat(percentage),
      reason: reason
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    alert('Descuento aplicado: ' + data.formatted.total_final);
    location.reload();
  }
}
```

### Ver Análisis de Márgenes

```javascript
async function showMarginAnalysis() {
  const response = await fetch(`/api/proposals/${proposalId}/margin-analysis`);
  const data = await response.json();
  
  if (data.success) {
    const { summary, services } = data.analysis;
    
    console.log('Margen Total:', summary.margin_percentage + '%');
    
    services.forEach(service => {
      console.log(`${service.title}: ${service.margin_percentage}%`);
    });
  }
}
```

---

## 🔍 Troubleshooting

### Error: "Table price_audit_log doesn't exist"

```bash
# Verificar que ejecutaste la migración
mysql -u root -p catering_proposals -e "SHOW TABLES LIKE 'price%';"

# Si no existe, ejecutar migración
mysql -u root -p catering_proposals < migrations/001_financial_engine.sql
```

### Error: "Column total_base not found"

```bash
# Verificar campos en proposals
mysql -u root -p catering_proposals -e "DESCRIBE proposals;"

# Si faltan, la migración no se completó correctamente
# Revisar permisos de usuario MySQL
```

### Descuentos por Volumen No Se Aplican

```sql
-- Verificar tiers activos
SELECT * FROM volume_discount_tiers WHERE is_active = TRUE;

-- Verificar PAX de propuesta
SELECT id, pax FROM proposals WHERE id = YOUR_PROPOSAL_ID;

-- Forzar recálculo
UPDATE proposals SET pax = pax WHERE id = YOUR_PROPOSAL_ID;
```

```javascript
// Forzar recálculo desde código
await ProposalService.calculateTotals(proposalId, { persist: true });
```

### Márgenes Aparecen en 0%

```sql
-- Verificar que opciones tienen cost_price definido
SELECT id, name, price_pax, cost_price 
FROM service_options 
WHERE cost_price = 0 OR cost_price IS NULL;

-- Asignar coste por defecto (70% del precio)
UPDATE service_options 
SET cost_price = price_pax * 0.70 
WHERE cost_price = 0 OR cost_price IS NULL;
```

---

## 📚 Recursos

- **Documentación Completa**: [docs/FINANCIAL_ENGINE.md](./docs/FINANCIAL_ENGINE.md)
- **API Reference**: Ver endpoints en `src/routes/api.js`
- **Tests**: `scripts/test-financial-engine.js`
- **Migración SQL**: `migrations/001_financial_engine.sql`

---

## ✅ Checklist de Instalación

- [ ] Migración SQL ejecutada
- [ ] Tablas creadas (price_audit_log, volume_discount_tiers)
- [ ] Campos añadidos a proposals
- [ ] Tests ejecutados exitosamente
- [ ] Descuentos por volumen funcionando
- [ ] Costes asignados a platos/opciones existentes (opcional)
- [ ] Propuestas existentes recalculadas (opcional)
- [ ] Frontend actualizado para mostrar nuevos datos

---

**🎯 Si todos los tests pasan: ¡Motor Financiero Instalado Correctamente!**
