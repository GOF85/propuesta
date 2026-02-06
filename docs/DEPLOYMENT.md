# 🚀 MICE CATERING PROPOSALS - DEPLOYMENT GUIDE

## Tabla de Contenidos

1. [Verificación Pre-Despliegue](#verificación-pre-despliegue)
2. [Instalación de Dependencias](#instalación-de-dependencias)
3. [Configuración de Entorno](#configuración-de-entorno)
4. [Configuración de Base de Datos](#configuración-de-base-de-datos)
5. [Configuración de Nginx](#configuración-de-nginx)
6. [Configuración de PM2](#configuración-de-pm2)
7. [Email (Gmail SMTP)](#email-gmail-smtp)
8. [SSL/HTTPS](#sslhttps)
9. [Testing Pre-Producción](#testing-pre-producción)
10. [Monitoreo](#monitoreo)

---

## 🔍 Verificación Pre-Despliegue

Antes de desplegar, ejecuta el script de verificación:

```bash
chmod +x scripts/verify-complete.sh
./scripts/verify-complete.sh
```

Debe mostrar:
```
✅ VERIFICADAS: 48
❌ FALLIDAS: 0

🎉 ¡PROYECTO COMPLETO Y LISTO PARA PRODUCCIÓN!
```

---

## 📦 Instalación de Dependencias

### 1. Node.js v20 o Superior

```bash
# Verificar versión
node --version  # Debe ser v20.x o superior

# En macOS
brew install node@20

# En Linux (Ubuntu)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. MariaDB v10.5+

```bash
# En macOS
brew install mariadb

# En Linux (Ubuntu)
sudo apt-get install -y mariadb-server

# Iniciar servicio
sudo systemctl start mariadb
sudo systemctl enable mariadb
```

### 3. Nginx

```bash
# En macOS
brew install nginx

# En Linux (Ubuntu)
sudo apt-get install -y nginx
```

### 4. Dependencias NPM

```bash
cd /path/to/propuesta
npm install
```

Verifica el archivo `package.json`:

```json
{
  "name": "mice-catering-proposals",
  "version": "1.0.0",
  "description": "Commercial catering proposal management system",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "seed": "node scripts/seed-test-data.js",
    "verify": "bash scripts/verify-complete.sh",
    "test": "echo 'Run test suite'; exit 0"
  },
  "dependencies": {
    "express": "^4.18.2",
    "express-validator": "^7.0.0",
    "express-session": "^1.17.3",
    "connect-flash": "^0.1.1",
    "ejs": "^3.1.8",
    "mariadb": "^3.2.7",
    "dayjs": "^1.11.10",
    "uuid": "^9.0.0",
    "nodemailer": "^6.9.7",
    "puppeteer": "^21.6.1",
    "sharp": "^0.33.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

---

## 🔐 Configuración de Entorno

### 1. Crear `.env`

```bash
cp .env.example .env
nano .env  # Editar con tus valores
```

### 2. Valores de `.env`

```env
# ════════════════════════════════════════════════════════════════
# DATABASE
# ════════════════════════════════════════════════════════════════

DB_HOST=localhost
DB_PORT=3306
DB_USER=catering_user
DB_PASS=super_secure_password_here
DB_NAME=catering_proposals

# ════════════════════════════════════════════════════════════════
# APPLICATION
# ════════════════════════════════════════════════════════════════

NODE_ENV=production
PORT=3000
APP_DOMAIN=https://propuestas.micecatering.eu
SESSION_SECRET=generate_with_uuid_v4_here

# ════════════════════════════════════════════════════════════════
# EMAIL (GMAIL SMTP)
# ════════════════════════════════════════════════════════════════

EMAIL_USER=catering@micecatering.eu
EMAIL_PASS=your_gmail_app_password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# ════════════════════════════════════════════════════════════════
# PUPPETEER (Scraping)
# ════════════════════════════════════════════════════════════════

PUPPETEER_HEADLESS=true
PUPPETEER_SANDBOX=false  # Importante en Linux

# ════════════════════════════════════════════════════════════════
# LOGGING
# ════════════════════════════════════════════════════════════════

LOG_LEVEL=info
LOG_FILE=/var/log/mice-catering/app.log
```

### 3. Generar SESSION_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copiar el resultado a .env como SESSION_SECRET
```

---

## 🗄️ Configuración de Base de Datos

### 1. Crear Usuario MariaDB

```bash
sudo mysql -u root
```

```sql
-- Crear usuario
CREATE USER 'catering_user'@'localhost' IDENTIFIED BY 'super_secure_password_here';

-- Crear base de datos
CREATE DATABASE catering_proposals CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Asignar permisos
GRANT ALL PRIVILEGES ON catering_proposals.* TO 'catering_user'@'localhost';
FLUSH PRIVILEGES;

-- Salir
EXIT;
```

### 2. Importar Schema

```bash
mysql -u catering_user -p catering_proposals < database.sql
# Ingresa la contraseña cuando lo pida
```

### 3. Verificar Instalación

```bash
mysql -u catering_user -p -e "USE catering_proposals; SHOW TABLES;"
```

Debe mostrar 9 tablas:
- users
- venues
- dishes
- proposals
- proposal_venues
- proposal_services
- service_options
- proposal_items
- messages

---

## 🌐 Configuración de Nginx

### 1. Crear Archivo de Configuración

```bash
sudo nano /etc/nginx/sites-available/propuestas.micecatering.eu
```

```nginx
# Upstream Node.js
upstream nodejs_app {
    server 127.0.0.1:3000;
}

# Redirigir HTTP a HTTPS
server {
    listen 80;
    server_name propuestas.micecatering.eu;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name propuestas.micecatering.eu;
    
    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/propuestas.micecatering.eu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/propuestas.micecatering.eu/privkey.pem;
    
    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Compresión
    gzip on;
    gzip_types text/plain text/css text/javascript application/json;
    gzip_min_length 1000;
    
    # Limits
    client_max_body_size 10M;
    
    # Logs
    access_log /var/log/nginx/propuestas_access.log;
    error_log /var/log/nginx/propuestas_error.log;
    
    # Proxy a Node.js
    location / {
        proxy_pass http://nodejs_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files (cache)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Uploads directory
    location /uploads/ {
        alias /home/node/app/public/uploads/;
        expires 30d;
        add_header Cache-Control "public";
    }
}
```

### 2. Habilitar Sitio

```bash
sudo ln -s /etc/nginx/sites-available/propuestas.micecatering.eu \
           /etc/nginx/sites-enabled/

# Verificar sintaxis
sudo nginx -t

# Recargar
sudo systemctl reload nginx
```

---

## ⚙️ Configuración de PM2

### 1. Instalar PM2 Globalmente

```bash
sudo npm install -g pm2
```

### 2. Crear `ecosystem.config.js`

```bash
cat > /home/node/app/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'mice-catering',
      script: './src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/error.log',
      out_file: '/var/log/pm2/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      watch: false,
      ignore_watch: ['node_modules', 'public/uploads'],
      max_memory_restart: '500M',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF
```

### 3. Iniciar Aplicación

```bash
cd /home/node/app

# Iniciar con PM2
pm2 start ecosystem.config.js

# Ver estado
pm2 status

# Ver logs
pm2 logs mice-catering

# Hacer startup en boot
pm2 startup
pm2 save
```

---

## 📧 Email (Gmail SMTP)

### 1. Configurar Gmail

1. Habilitar "Aplicaciones menos seguras":
   - https://myaccount.google.com/security

2. O crear contraseña de aplicación (recomendado):
   - https://myaccount.google.com/apppasswords
   - Seleccionar: Mail → Windows Computer (o similar)
   - Copiar la contraseña de 16 caracteres

### 2. Actualizar `.env`

```env
EMAIL_USER=catering@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx  # Contraseña de 16 caracteres (sin espacios en código)
```

### 3. Verificar Conexión

```bash
node -e "
const EmailService = require('./src/services/EmailService');
EmailService.verifyConnection()
  .then(() => console.log('✅ Email conectado'))
  .catch(err => console.log('❌ Error:', err.message));
"
```

---

## 🔒 SSL/HTTPS (Let's Encrypt)

### 1. Instalar Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### 2. Obtener Certificado

```bash
sudo certbot certonly --nginx -d propuestas.micecatering.eu
```

Sigue las instrucciones interactivas.

### 3. Renovación Automática

```bash
# Verificar
sudo certbot renew --dry-run

# Cron (automático en Ubuntu 20.04+)
systemctl list-timers | grep certbot
```

---

## ✅ Testing Pre-Producción

### 1. Verificación de Salud

```bash
curl https://propuestas.micecatering.eu/health
# Esperado: {"status":"ok"}
```

### 2. Test de Rutas Críticas

```bash
# Login
curl -X POST https://propuestas.micecatering.eu/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password"}'

# Dashboard (requiere sesión)
curl https://propuestas.micecatering.eu/dashboard

# Cliente público (magic link)
curl https://propuestas.micecatering.eu/p/test-hash-123
```

### 3. Test de Email

```bash
node scripts/test-email.js
```

### 4. Test de Base de Datos

```bash
node scripts/test-db.js
```

---

## 📊 Monitoreo

### 1. PM2 Monitoreo

```bash
# Monitoreo en tiempo real
pm2 monit

# Dashboard web (opcional)
pm2 web
# Acceder: http://localhost:9615
```

### 2. Logs

```bash
# Logs de aplicación
pm2 logs mice-catering

# Logs de Nginx
tail -f /var/log/nginx/propuestas_error.log
tail -f /var/log/nginx/propuestas_access.log
```

### 3. Recursos del Sistema

```bash
# CPU y Memoria
top -p $(pgrep -f "node src/server.js" | head -1)

# Conexiones de base de datos
mysql -u root -e "SHOW PROCESSLIST;" | grep catering_user
```

### 4. Alertas (Recomendado)

Configurar monitoring con:
- **New Relic**: Application monitoring
- **Datadog**: Infrastructure + APM
- **Sentry**: Error tracking
- **Uptime Robot**: HTTP health checks

---

## 🚀 Despliegue en 1 Línea

```bash
# Setup completo
chmod +x scripts/verify-complete.sh && \
./scripts/verify-complete.sh && \
npm install && \
npm run seed && \
pm2 start ecosystem.config.js && \
pm2 save

# Verificar
pm2 status
```

---

## 📋 Checklist de Despliegue

- [ ] Node.js v20+ instalado
- [ ] MariaDB v10.5+ instalado y corriendo
- [ ] Nginx instalado
- [ ] PM2 instalado globalmente
- [ ] `.env` configurado con valores reales
- [ ] Base de datos creada e importada
- [ ] SSL/HTTPS con Let's Encrypt (o alternativo)
- [ ] Certificado SSL renovación automática
- [ ] Email (Gmail SMTP) verificado
- [ ] Aplicación inicia con `pm2 start`
- [ ] Logs sin errores (`pm2 logs`)
- [ ] HTTPS accesible públicamente
- [ ] Health check responde
- [ ] Magic link funciona (/p/:hash)
- [ ] Datos de prueba cargados
- [ ] Backups configurados
- [ ] Monitoreo activado

---

## 🛠️ Troubleshooting

### Problema: Puerto 3000 ya en uso

```bash
# Encontrar proceso
lsof -i :3000

# Matar proceso
kill -9 <PID>

# O usar puerto diferente en .env
PORT=3001
```

### Problema: Error de conexión MySQL

```bash
# Verificar servicio
sudo systemctl status mariadb

# Verificar credenciales
mysql -u catering_user -p catering_proposals -e "SELECT 1;"

# Reiniciar
sudo systemctl restart mariadb
```

### Problema: Email no funciona

```bash
# Verificar credenciales en .env
# Verificar que Gmail acepta conexión SMTP
# Usar contraseña de aplicación (no contraseña normal)
# Verificar logs: pm2 logs mice-catering
```

### Problema: Nginx 502 Bad Gateway

```bash
# Verificar que Node.js está corriendo
pm2 status

# Ver si Puerto 3000 está abierto
netstat -tulpn | grep 3000

# Reiniciar Node.js
pm2 restart mice-catering
```

---

## 📞 Soporte

**Contacto:**
- Email: guillermo@micecatering.eu
- Documentación: `/docs/*.md`
- Logs: `pm2 logs mice-catering`

**Actualización del Proyecto:**

```bash
# Pull latest code
git pull origin main

# Instalar nuevas dependencias
npm install

# Recargar aplicación
pm2 restart mice-catering

# Ver logs
pm2 logs mice-catering
```

---

**Última Actualización:** Febrero 2026  
**Versión:** 1.0.0 (Producción Lista)
