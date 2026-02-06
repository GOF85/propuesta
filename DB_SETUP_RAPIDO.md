# ⚡ CONFIGURACIÓN RÁPIDA - Base de Datos

## 🎯 Objetivo

Configurar MariaDB/MySQL y cargar datos dummy en **2 minutos**.

---

## 📋 Pasos Rápidos

### 1. Crear Base de Datos

```bash
mysql -u root -p
```

Luego ejecuta:

```sql
CREATE DATABASE catering_proposals CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'catering_user'@'localhost' IDENTIFIED BY 'password123';
GRANT ALL PRIVILEGES ON catering_proposals.* TO 'catering_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Importar Schema

```bash
mysql -u catering_user -p catering_proposals < database.sql
# Password: password123
```

### 3. Configurar .env.local

```bash
cat > .env.local << 'EOF'
DB_HOST=localhost
DB_PORT=3306
DB_USER=catering_user
DB_PASS=password123
DB_NAME=catering_proposals

NODE_ENV=development
PORT=3000
SESSION_SECRET=mi-super-secreto-temporal-123
APP_DOMAIN=http://localhost:3000

EMAIL_USER=test@gmail.com
EMAIL_PASS=fake-password
EOF
```

### 4. Cargar Datos Dummy

```bash
npm run seed
```

Esto crea:
- ✅ 3 usuarios (comerciales + admin)
- ✅ 3 venues (Barcelona, Madrid, Valencia)
- ✅ 11 platos (entrantes, principales, postres)
- ✅ 4 propuestas completas (Amazon, Google, Microsoft, Telefónica)
- ✅ 2 mensajes de chat

### 5. Iniciar Aplicación

```bash
npm run dev
```

---

## 🔑 Credenciales de Acceso

### Base de Datos
```
Host:     localhost
User:     catering_user
Password: password123
Database: catering_proposals
```

### Aplicación Web

**Comercial 1:**
```
Email:    juan@micecatering.eu
Password: password123
```

**Comercial 2:**
```
Email:    maria@micecatering.eu
Password: password123
```

**Admin:**
```
Email:    admin@micecatering.eu
Password: admin123
```

---

## 🧪 Verificar Instalación

```bash
# Ver usuarios creados
mysql -u catering_user -p catering_proposals -e "SELECT name, email, role FROM users;"

# Ver propuestas creadas
mysql -u catering_user -p catering_proposals -e "SELECT client_name, status, pax FROM proposals;"

# Ver platos disponibles
mysql -u catering_user -p catering_proposals -e "SELECT name, category, base_price FROM dishes;"
```

---

## 🎯 Qué Esperar

Después de seed, verás en la base de datos:

```
users:              3 rows
venues:             3 rows
dishes:             11 rows
proposals:          4 rows
proposal_venues:    5 rows
proposal_services:  7 rows
service_options:    10 rows
proposal_items:     30+ rows
messages:           2 rows
```

---

## ❌ Troubleshooting

### Error: "Access denied for user"
```bash
# Recrear usuario
mysql -u root -p
DROP USER IF EXISTS 'catering_user'@'localhost';
CREATE USER 'catering_user'@'localhost' IDENTIFIED BY 'password123';
GRANT ALL PRIVILEGES ON catering_proposals.* TO 'catering_user'@'localhost';
FLUSH PRIVILEGES;
```

### Error: "Database already exists"
```bash
# Eliminar y recrear
mysql -u root -p -e "DROP DATABASE IF EXISTS catering_proposals;"
mysql -u root -p -e "CREATE DATABASE catering_proposals CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u catering_user -p catering_proposals < database.sql
```

### Error: "pool timeout"
```bash
# Verificar que MySQL está corriendo
sudo systemctl status mariadb  # Linux
brew services list | grep mariadb  # macOS

# Reiniciar si está parado
sudo systemctl start mariadb  # Linux
brew services start mariadb  # macOS
```

### Error: "bcryptjs not found"
```bash
npm install bcryptjs --save
```

---

## 🚀 Todo en 1 Comando

```bash
# Setup completo (ejecutar desde raíz del proyecto)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS catering_proposals CHARACTER SET utf8mb4;" && \
mysql -u root -p -e "CREATE USER IF NOT EXISTS 'catering_user'@'localhost' IDENTIFIED BY 'password123';" && \
mysql -u root -p -e "GRANT ALL PRIVILEGES ON catering_proposals.* TO 'catering_user'@'localhost'; FLUSH PRIVILEGES;" && \
mysql -u catering_user -ppassword123 catering_proposals < database.sql && \
npm install && \
npm run seed && \
echo "✅ Setup completo! Ejecuta: npm run dev"
```

---

## 📊 Resumen Visual

```
┌─────────────────────────────────────────┐
│  SETUP COMPLETO EN 2 MINUTOS            │
├─────────────────────────────────────────┤
│  1. CREATE DATABASE  .................. ✅│
│  2. CREATE USER  ...................... ✅│
│  3. IMPORT SCHEMA  .................... ✅│
│  4. CONFIGURE .env  ................... ✅│
│  5. npm run seed  ..................... ✅│
│  6. npm run dev  ...................... ✅│
└─────────────────────────────────────────┘

Accede a: http://localhost:3000
Login:    juan@micecatering.eu
Password: password123
```

---

**Tiempo Total:** ~2 minutos  
**Status:** ✅ Ready to use!
