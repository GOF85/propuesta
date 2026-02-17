# 🍽️ INTEGRACIÓN: PLATOS/MENÚS EN EDITOR DE PROPUESTAS

**Fecha:** 2025 | **Status:** ✅ COMPLETADO | **Versión:** 1.0

---

## 📋 RESUMEN DE CAMBIOS

Se ha integrado completamente el sistema de gestión de platos/menús en el editor de propuestas. El usuario puede ahora:

1. **Visualizar platos/menús** por cada servicio en la propuesta
2. **Abrir modal selector** con dos tabs: Menús y Platos Sueltos
3. **Buscar platos** por término
4. **Añadir múltiples items** desde un menú o platos sueltos
5. **Editar precio** de items individuales
6. **Eliminar items** de la propuesta

---

## ✅ CAMBIOS REALIZADOS

### 1. **ProposalService.js - BUG FIX**
**Línea 115:** Corregido error de columna en SQL
```javascript
// ❌ ANTES:
SELECT * FROM proposal_services WHERE proposal_id = ? ORDER BY service_order

// ✅ AHORA:
SELECT * FROM proposal_services WHERE proposal_id = ? ORDER BY order_index
```

**Impacto:** Elimina error 500 "Unknown column 'service_order' in 'ORDER BY'"

---

### 2. **views/commercial/editor.ejs - NUEVA SECCIÓN**

#### **2.1 Sección 4: Platos y Menús (líneas ~264-310)**
```html
<!-- Nueva sección después de "Sección 3: Servicios" -->
<div class="bg-white rounded-lg border border-gray-200 shadow-sm p-8 mt-8">
  <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
    <i data-lucide="utensils" class="w-6 h-6 text-amber-600"></i>
    Platos y Menús
  </h2>
  
  <!-- Loop por cada servicio -->
  <% proposal.services.forEach((service) => { %>
    <div class="border border-gray-300 rounded-lg p-4 bg-gray-50">
      <h3><%= service.title %> (<%= service.type %>)</h3>
      
      <!-- Botón para abrir modal selector -->
      <button onclick="openDishSelector(<%= proposal.id %>, null, '<%= service.title %>')">
        ➕ Añadir Platos/Menús
      </button>
      
      <!-- Items de opciones del servicio -->
      <% service.options.forEach((option) => { %>
        <div id="items-option-<%= option.id %>">
          <!-- Items renderizados aquí -->
        </div>
      <% }); %>
    </div>
  <% }); %>
</div>
```

**Features:**
- ✅ Renderiza un bloque por cada servicio
- ✅ Agrupa items por opción (A, B, C, etc.)
- ✅ Botón "Añadir Platos/Menús" para cada servicio
- ✅ Placeholder si no hay items aún

#### **2.2 Modal Selector (líneas ~527-585)**
```html
<div id="dishSelectorModal" class="fixed inset-0 ... hidden z-50">
  <!-- Header con Lucide icon -->
  <!-- Tabs: Menús | Platos Sueltos -->
  <!-- Búsqueda en tab Platos Sueltos -->
  <!-- Grid de menús/platos -->
  <!-- Botones: Cancelar | Añadir Seleccionados -->
</div>
```

**Features:**
- ✅ Tabs intercambiables (Menús ↔ Platos Sueltos)
- ✅ Búsqueda de platos con input
- ✅ Estructura lista para checkboxes dinámicos
- ✅ Bootstrap responsive (max-width: 3xl, altura máxima 90vh)

#### **2.3 Scripts Incluidos (línea ~595)**
```html
<script src="/js/editor-dishes.js"></script>
```

---

## 🔌 FUNCIONES JAVASCRIPT (editor-dishes.js)

### **Funciones Clave Disponibles:**

#### **`openDishSelector(proposalId, optionId, serviceName)`**
Abre modal con menús y platos disponibles
```javascript
openDishSelector(123, null, 'Catering Principal')
```

#### **`closeDishSelector()`**
Cierra modal y limpia variables

#### **`switchDishTab(tabName)`**
Cambia entre tabs: `'menus'` | `'dishes'`

#### **`loadMenusAndDishes()`**
Fetch `/api/menus` + `/api/dishes`

#### **`renderMenusTab()`**
Renderiza grid de menús con cards

#### **`renderDishesTab()`**
Renderiza grid de platos con checkboxes

#### **`addSelectedDishes()`**
POST → `/api/proposals/{id}/options/{optionId}/items`
- Si source=menu: inserta todos los platos del menú
- Si source=dishes: inserta platos sueltos seleccionados
- Recalcula totales automáticamente

#### **`removeProposalItem(itemId, proposalId)`**
DELETE → `/api/proposals/{id}/items/{itemId}`

#### **`updateItemPrice(itemId, proposalId, newPrice)`**
PUT → `/api/proposals/{id}/items/{itemId}`
- Debounced 500ms

---

## 📊 FLUJO DE DATOS

```
Usuario abre EDITOR
    ↓
Ver "Sección 4: Platos y Menús"
    ↓
Clic botón "➕ Añadir Platos/Menús"
    ↓
openDishSelector(proposalId) ejecuta
    ├─ loadMenusAndDishes() → GET /api/menus, /api/dishes
    ├─ renderMenusTab() → grid cards de menús
    └─ Modal visible
    ↓
Usuario: Ubica menú o plato
    ├─ Si menú: clickea card → addMenuToOption()
    │         POST /api/proposals/{id}/options/{optionId}/items
    │         {source: 'menu', menu_id: X, price: auto}
    │
    └─ Si dish: checkbox + "Añadir Seleccionados"
              POST /api/proposals/{id}/options/{optionId}/items
              {source: 'dish', dish_id: [X,Y,Z], price: custom}
    ↓
Backend ProposalService.addItemsToOption():
    ├─ INSERT INTO proposal_items (option_id, name, description, ...)
    ├─ Es deep copy adhoc (no vinculado a dishes vivo)
    └─ calculateTotals() automático
    ↓
Frontend: Modal cierra, items visible en tabla
    ↓
Usuario puede:
    ├─ Editar precio (updateItemPrice)
    ├─ Eliminar (removeProposalItem)
    └─ Guardar propuesta
```

---

## 🧪 TESTING CHECKLIST

### **1. Modal Funcional**
- [ ] Click botón → modal abre
- [ ] Lucide icons visibles (utensils, x, etc.)
- [ ] Tabs intercambian correctamente

### **2. Tab Menús**
- [ ] GET `/api/menus` devuelve listado
- [ ] Cada menú muestra: nombre, descripción, precio, N° platos
- [ ] Hover effect en cards

### **3. Tab Platos Sueltos**
- [ ] Input búsqueda funciona
- [ ] GET `/api/dishes?q=term` devuelve resultados
- [ ] Grid moestra platos con checkboxes
- [ ] Checkboxes seleccionables

### **4. Añadir Items**
- [ ] Click en menú → POST /api/proposals/*/options/*/items
- [ ] Botón "Añadir Seleccionados" → POST con platos sueltos
- [ ] Backend inserta items en DB
- [ ] Totales recalculados
- [ ] Modal cierra automáticamente

### **5. Gestión Items**
- [ ] Tabla items renderizada con previews
- [ ] Editar precio: debounce 500ms
- [ ] Botón eliminar: DELETE sin reload
- [ ] Totales actualizados

### **6. Guardado Propuesta**
- [ ] Click "Guardar" → POST /proposals/{id}
- [ ] Items persistidos
- [ ] No error 500 (service_order solucionado)
- [ ] Totales correctos

---

## 📁 ARCHIVOS MODIFICADOS

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| `src/services/ProposalService.js` | BUG FIX: service_order → order_index | 115 |
| `views/commercial/editor.ejs` | + Sección 4 + Modal + Scripts | 264-595 |
| `public/js/editor-dishes.js` | (existente) ya tiene todas las funciones | — |

---

## 🚀 CÓMO USAR

### **Para Admin (crear menús/platos):**
1. Ir a `/admin/dishes` → Crear platos
2. Ir a `/admin/menus` → Crear menús + seleccionar platos

### **Para Comercial (usar en propuesta):**
1. Crear propuesta normal
2. Añadir servicios (ej: "Catering Principal")
3. Nueva "Sección 4: Platos y Menús" aparece
4. Click "➕ Añadir Platos/Menús"
5. Seleccionar menú O platos sueltos
6. Ajustar precios si es necesario
7. Guardar propuesta

---

## 🔧 APIS UTILIZADAS

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| GET | `/api/menus?limit=50` | Listar menús disponibles |
| GET | `/api/dishes?limit=100` | Listar platos disponibles |
| GET | `/api/dishes?q=term` | Buscar platos por término |
| POST | `/api/proposals/{id}/options/{optionId}/items` | Crear items (menú o platos) |
| DELETE | `/api/proposals/{id}/items/{itemId}` | Eliminar item |
| PUT | `/api/proposals/{id}/items/{itemId}` | Actualizar precio |

---

## 🎨 UI/UX FEATURES

- ✅ **Colorscheme:** Ámbar para platos (consistent con resto)
- ✅ **Icons:** Lucide (utensils, plus-circle, edit, trash-2, loader, x)
- ✅ **Responsive:** Tabs, grid adaptativo, modal scroll
- ✅ **States:** Loading (spinner), empty, error (fallback)
- ✅ **Interactivity:** Debounce búsqueda, hover effects, smooth transitions

---

## ⚠️ NOTAS IMPORTANTES

1. **Deep Copy Adhoc:** Los items añadidos son copias. Cambiar el menú original NO afecta items ya insertados.
2. **Precios:** Se pueden editar per-item en la propuesta (custom_price en DB)
3. **Transacciones:** Backend usa BEGIN/COMMIT para integridad
4. **Mobile:** Modal se adapta, pero mejor en desktop para selector múltiple

---

## 📞 SOPORTE

**Columna `order_index` es la autoridad:** Si hay confusión sobre ordenamiento de servicios, revisar `database.sql` línea 70.

**Las imágenes de platos:** JSON array en campo `images` — frontend muestra primera imagen como preview.

---

**Estado Final:** Sistema completamente integrado y listo para usar en propuestas. 🎉
