# 🔧 Instrucciones para arreglar el error 500 en el editor

## Problema
El error 500 ocurría cuando se intentaba acceder a propuestas inexistentes (ej: /proposal/504/edit)

## Solución Aplicada
Se modificaron 2 archivos:

### 1. src/services/ProposalService.js
**Cambios en `getProposalById()` método:**
- Ahora devuelve `null` en lugar de lanzar error cuando no encuentra propuesta
- Separó las queries SQL para evitar problemas con GROUP_CONCAT
- Agregó manejo seguro de errores en cálculo de totales
- Obtiene servicios y opciones en queries separadas

### 2. src/controllers/editorController.js  
**Cambios en `renderEditor()` método:**
- Verifica si proposal es null y renderiza error 404 apropiadamente
- Agregó try/catch para cargar venues sin romper si hay error
- Agregó el objeto `user` en todas las respuestas de error
- Mejor logging de errores

## Como Desplegar

### Opción 1: Via Git (Recomendado)
```bash
ssh root@188.95.113.225
cd /var/www/vhosts/micecatering.eu/propuesta.micecatering.eu
git pull origin main
pm2 restart propuesta-app
```

### Opción 2: Via SFTP
Usa tu cliente SFTP preferido (FileZilla, Cyberduck, etc):
- Host: `188.95.113.225`
- User: `root`  
- Sube estos archivos:
  - `src/services/ProposalService.js`
  - `src/controllers/editorController.js`
  - `scripts/create-test-proposals. js`

Luego reinicia:
```bash
ssh root@188.95.113.225
cd /var/www/vhosts/micecatering.eu/propuesta.micecatering.eu 
pm2 restart propuesta-app
```

### Opción 3: Via SCP Manual
```bash
scp src/services/ProposalService.js root@188.95.113.225:/var/www/vhosts/micecatering.eu/propuesta.micecatering.eu/src/services/

scp src/controllers/editorController.js root@188.95.113.225:/var/www/vhosts/micecatering.eu/propuesta.micecatering.eu/src/controllers/

scp scripts/create-test-proposals.js root@188.95.113.225:/var/www/vhosts/micecatering.eu/propuesta.micecatering.eu/scripts/
```

## Crear Propuestas de Prueba

Una vez desplegado, crea propuestas de prueba:

```bash
ssh root@188.95.113.225
cd /var/www/vhosts/micecatering.eu/propuesta.micecatering.eu
node scripts/create-test-proposals.js
```

Esto creará 3 propuestas:
- Conferencia Tecnológica 2026 (draft, 150 pax)
- Cena de Gala Corporativa (sent, 80 pax)  
- Presentación de Producto (draft, 200 pax)

## Verificar Funcionamiento

1. Accede a: https://propuesta.micecatering.eu/dashboard
2. Deberías ver las 3 propuestas creadas
3. Haz clic en "Editar" en cualquiera de ellas
4. Ahora debería cargar correctamente sin error 500

## Antes vs Después

**ANTES (Error 500):**
- Acceder a propuesta inexistente → Error 500
- GROUP_CONCAT fallaba con datos especiales
- No se manejaban errores de venues

**DESPUÉS (Funcionando):**
- Acceder a propuesta inexistente → Error 404 (correcto)
- Queries separadas sin problemas de parsing
- Carga gracefully sin venues si hay error
- Mensajes de error claros

## Archivos Modificados
- ✅ src/services/ProposalService.js (57 líneas)
- ✅ src/controllers/editorController.js (52 líneas)
- ✅ scripts/create-test-proposals.js (NUEVO - 74 líneas)

## Commit
```
git log -1 --oneline
ff6e8bc 🔧 Fix proposal editor error 500
```

---

**Última actualización:** 6 de febrero de 2026  
**Estado:** Listo para desplegar
