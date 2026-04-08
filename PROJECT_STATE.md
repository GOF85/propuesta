MICE CATERING PROPOSALS - ESTADO DEL PROYECTO Y ARQUITECTURA

Este documento es el "Cerebro" del proyecto.
INSTRUCCIÓN PARA LA IA (COPILOT/CLAUDE): Lee obligatoriamente este documento antes de sugerir, generar o refactorizar cualquier código. NO asumas tecnologías, NO uses ORMs, NO cambies la arquitectura descrita aquí.

1. VISIÓN GENERAL Y STACK TECNOLÓGICO

Aplicación B2B "Premium" para la creación, negociación y cierre de presupuestos de catering para eventos corporativos.

Backend: Node.js (v20+), Express.js.

Base de Datos: MariaDB (Driver nativo mariadb con Pool). PROHIBIDO EL USO DE ORMs (Nada de Sequelize, Prisma, TypeORM). Solo consultas SQL nativas parametrizadas para evitar inyección SQL.

Frontend: EJS (Templating estructurado con partials), Tailwind CSS (Configuración inyectada vía JS), Vanilla JS, Lucide Icons (Prohibido usar emojis), Day.js (con locale es).

Servicios Integrados: - Puppeteer (Scraping de venues con --no-sandbox).

Sharp (Optimización de imágenes a WebP, max-width 1920px).

Nodemailer (SMTP Chat para notificaciones al comercial).

Zoho Sign (Integración para firma del contrato).

2. ARQUITECTURA DEL SISTEMA (Service Layer Pattern)

El proyecto sigue una separación estricta de responsabilidades (MVC + Services):

/routes: Exponen los endpoints HTTP y aplican middlewares (Auth, Mantenimiento maintenance.js).

/controllers: Reciben la req, validan el input, llaman a los Services y devuelven JSON o renderizan EJS (res.render). NUNCA hacen consultas SQL directamente.

/services: Contienen toda la lógica de negocio y las consultas SQL. Aquí se manejan las transacciones (BEGIN, COMMIT, ROLLBACK). Es la capa más crítica.

/public/js: Contiene Vanilla JS. Principalmente client-proposal.js y editor.js para realizar llamadas asíncronas (fetch) al backend y manipular el DOM sin recargar la página.

3. REGLAS DE NEGOCIO (BUSINESS LOGIC) INQUEBRANTABLES

A. Persistencia "Adhoc" y Deep Cloning

El catálogo maestro (venues, platos) es una plantilla. Cuando un comercial crea una propuesta, se hace una copia profunda (Deep Clone) hacia las tablas proposal_*.

Si el comercial edita un plato (precio, nombre, descripción) en el editor de la propuesta, solo se altera esa instancia, nunca el catálogo maestro.

B. Motor Financiero y Opcionalidad (Financial Engine)

La única fuente de la verdad para el cálculo monetario es el Backend (ProposalService.js).

Cálculo de Base Imponible: Subtotal = Suma(OpcionesSeleccionadas * Pax) + Suma(AddonsFijos).

Descuentos: Se aplican SIEMPRE sobre la base imponible, antes de calcular los impuestos.

IVA Dinámico: Servicios de Gastronomía (type: 'gastronomy') aplican un 10%. Servicios de Logística/Personal (type: 'logistics') aplican un 21%.

Servicios Opcionales (is_optional = true): Los servicios marcados como opcionales en la BD (ej. Córners, Recenas) NO cuentan para el total de decisiones pendientes (total_choices). El usuario puede alcanzar el 100% de progreso sin interactuar con ellos.

C. Frontend Cliente (Premium B2B UX)

Acceso Directo: Vía "Magic Link" seguro (/p/:hash).

Branding Dinámico: El backend envía un objeto brandPalette. En header-client.ejs se inyectan variables CSS nativas (ej. --brand-primary: <%= brandPalette.primary %>) que Tailwind CSS lee a través de su configuración de JS en tiempo de ejecución.

Navegación y UX Fluida (Estilo E-commerce):

Cero Cronogramas Aislados: Queda estrictamente prohibido usar una tabla o sección separada de "Cronograma Estimado". Todos los horarios y días se integran orgánicamente dentro de la sección "Programa y Gastronomía" usando un diseño de Timeline vertical.

Venues en Carrusel: Los espacios propuestos NUNCA se apilan verticalmente si son varios. Se muestran en un carrusel horizontal con scroll (snap-x) para no alargar la página.

Toma de Decisiones Cautiva: Los servicios multi-opción obligan al cliente a elegir. Las opciones descartadas se ocultan visualmente o se atenúan para evitar la fatiga cognitiva.

UI de Servicios Opcionales: Deben mostrarse con un diseño más ligero (fondos atenuados o bordes punteados) y utilizar un "Switch" (interruptor) visual en lugar de botones gigantes de "Elegir", dejando claro que son añadidos voluntarios.

Drawer "Mi Selección" y Bloqueo: Barra inferior flotante que indica el progreso (ej. "1 de 3 selecciones"). Al pulsar, abre un panel lateral. El botón de "Confirmar Propuesta" está desactivado y bloqueado (con un candado) hasta que el progreso de decisiones es del 100%.

Impresión: Se usa Tailwind print:hidden para ocultar menús, botones y el chat, de modo que al imprimir (Ctrl+P) quede un PDF limpio como un contrato.

D. Scraping y Gestión de Archivos

Al importar de micecatering.com, Puppeteer raspea la URL.

Anti-Hotlinking: Nunca guardamos la URL externa de la imagen en BD. Se descargan al VPS, se optimizan con Sharp y se guardan rutas relativas en /public/uploads/.

Función vital en EJS: parseImages(imgStr) siempre se utiliza para sanear los strings o arrays JSON de la base de datos antes de mostrar una etiqueta <img>.

E. Comunicación y Estados

Chat: Sistema de polling (setInterval en client-proposal.js) que consulta si hay nuevos mensajes. No usamos WebSockets en el MVP para evitar carga en el VPS.

Bloqueo de Edición (Maintenance Mode): Si proposal.is_editing === 1 o true en BD (el comercial está tocando precios), cualquier petición del cliente al Magic Link es interceptada por el middleware y devuelve la vista maintenance.ejs.

Estado Bloqueado: Si la propuesta está accepted, la UI del cliente desactiva los botones de "Cambiar Espacio" y "Elegir Opción", mostrando un badge de "Propuesta Confirmada".

4. METODOLOGÍA PARA EL ASISTENTE IA (SNIPER PROMPTING)

Cuando se te solicite generar código para este proyecto, debes seguir este flujo mental:

Revisa qué capa estás tocando (Route, Controller, Service o View).

Asegúrate de no romper las inyecciones EJS existentes (como data-service-id="<%= service.id %>").

Escribe comentarios explicativos en ESPAÑOL. Mantén variables y nombres de funciones en INGLÉS.

NUNCA propongas migrar a un framework Frontend (React/Vue). Mantente estrictamente en Vanilla JS y EJS.