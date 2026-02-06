MICE CATERING PROPOSALS APP - Documentación Técnica

1. Visión General

Aplicación web para la gestión, creación y visualización de propuestas comerciales de catering.

Backend: Node.js (Express) + MariaDB.

Frontend: EJS (Templating) + Tailwind CSS (Estilos).

Infraestructura: VPS propio (micecatering.eu) con Nginx y PM2.

2. Características Clave

Propuestas Adhoc: Los platos se copian del catálogo a la propuesta. La edición en la propuesta NO afecta al catálogo maestro.

Venues Scraping: Uso de Puppeteer para extraer info de micecatering.com y guardar imágenes localmente (/public/uploads) para evitar hotlinking.

Branding Dinámico: Uso de node-vibrant para extraer color del logo del cliente e inyectarlo en CSS.

Chat Transparente: Sistema de mensajería persistente en base de datos con notificaciones por Email (Nodemailer + Gmail SMTP).

Modo Mantenimiento: Si proposals.is_editing = true, el cliente ve una pantalla de espera.

Magic Link: Acceso mediante hash único en URL sin login para cliente.

3. Estructura de Directorios

/
├── config/             # Configuración DB y variables
├── public/
│   ├── uploads/        # Imágenes (venues, platos, logos)
│   ├── css/            # Tailwind output
│   └── js/             # Scripts cliente (chat, selección)
├── routes/             # Rutas Express (dashboard, api, client)
├── services/           # Lógica de negocio (Scraper, ImageOptimizer, Email)
├── views/              # Plantillas EJS
│   ├── client/         # Vistas públicas (propuesta, chat)
│   ├── commercial/     # Vistas privadas (editor, dashboard)
│   └── partials/       # Componentes reusables
├── app.js              # Entry point
└── PROJECT.md          # Esta documentación

4. Estándares de Código

Idioma: Variables y funciones en spanglish (ej: getPropuesta). Comentarios explicativos en ESPAÑOL.

Base de Datos: Consultas SQL parametrizadas para evitar inyección. Uso de pool de conexiones.

Imágenes: Todas las subidas se procesan con sharp -> Resize 1920px width max -> Convertir a WebP -> Guardar.

Frontend Móvil: Priorizar "Mobile First". En móvil, las tablas de precios se ocultan y solo se muestran totales.

5. Configuración de Entorno (.env)

DB_HOST=localhost
DB_USER=usuario
DB_PASS=password
DB_NAME=catering_proposals
APP_DOMAIN=https://propuestas.micecatering.eu
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_password_aplicacion
SESSION_SECRET=super_secreto