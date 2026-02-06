📍 MICE CATERING - CONFIGURACIÓN SIN CONTRASEÑA ✅
================================================

## ✅ Acceso Configurado

Todas las contraseñas están guardadas de forma segura y las funciones SSH/CLI funcionan SIN pedir contraseña.

### Credenciales Almacenadas

```
VPS (SSH):
  Usuario: root
  Host: 188.95.113.225
  Contraseña: Guardada en expect script

MariaDB:
  Usuario: catering_user
  Contraseña: ARpjZ@3nwse90*zq
  Base de Datos: catering_proposals
  Host: localhost
```

### Funciones Disponibles

Usa directamente en terminal desde CUALQUIER UBICACIÓN:

```bash
mice_ssh              # Conectar al servidor VPS (shell interactivo)
mice_status           # Ver estado PM2 del proceso
mice_logs [N]         # Ver últimos N logs (default: 50)
mice_restart          # Reiniciar aplicación
mice_npm [args]       # Ejecutar npm (ej: mice_npm install)
mice_seed             # Ejecutar seed de datos de prueba
mice_port [N]         # Verificar si puerto N está en escucha (default: 3000)
mice_db               # Verificar conexión MariaDB
```

### Ejemplos de Uso

```bash
# Ver si el app está corriendo
mice_status

# Ver últimos 100 logs
mice_logs 100

# Reinstalar dependencies
mice_npm install

# Sembrar datos de prueba
mice_seed

# Conectar al servidor directamente
mice_ssh
```

## 📂 Archivos de Configuración

| Archivo | Ubicación | Propósito |
|---------|-----------|-----------|
| ssh-mice.exp | `/Users/guillermo/mc/propuesta/scripts/` | Script Expect para SSH sin contraseña |
| .mice_helpers.sh | `~/.mice_helpers.sh` | Funciones bash/zsh helper |
| .zshrc | `~/.zshrc` | Shell config (fuente de helpers) |

## 🚀 Estado Actual del Servidor

```
✅ VPS Conexión: OK
✅ MariaDB: Online
✅ Node.js App: Running (PID: 1693260, puerto 3000)
✅ PM2: Daemon running
✅ Database: catering_proposals (11 tablas)
✅ Test User: test@example.com
✅ Test Data: 4 propuestas seeded
```

## 🔧 Diagnosticar Problemas

Si algo no funciona:

```bash
# Ver logs completos
mice_logs 200

# Revisar puerto
mice_port 3000

# Verificar MariaDB
mice_db

# Conectar directamente para troubleshooting
mice_ssh
```

---

**Última Actualización:** 6 Febrero 2026
**Status:** Totalmente configurado - Sin contraseñas necesarias ✅
