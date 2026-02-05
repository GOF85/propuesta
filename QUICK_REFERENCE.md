# ⚡ QUICK REFERENCE - Patrones & Comandos

## Comandos Frecuentes

```bash
# Iniciar servidor
npm run dev

# Ver health
curl http://localhost:3000/health

# Ver logs MariaDB
tail -f /var/log/mysql/error.log

# Ver logs PM2
npm run logs
```

---

## Estructura de Archivos

```
src/
├── config/
│   ├── db.js              # Pool MariaDB
│   ├── constants.js       # Constantes app
│   └── utils.js           # Helpers
├── middleware/
│   ├── auth.js            # Auth + Error handler
│   └── maintenance.js     # is_editing check
├── controllers/           # HTTP request handlers
├── services/              # Lógica de negocio + SQL
├── routes/
│   └── index.js           # Central route registry
├── app.js                 # Express setup
└── server.js              # Entry point

views/
├── partials/
│   ├── header.ejs
│   ├── footer.ejs
│   └── flash-messages.ejs
├── commercial/            # (TODO) Dashboard, Editor
├── client/
│   └── maintenance.ejs     # Waiting screen
├── auth/                  # (TODO) Login, Register
└── errors/
    ├── 403.ejs
    ├── 404.ejs
    └── 500.ejs

public/
├── css/
│   └── tailwind.css       # Custom styles
├── js/
│   ├── utils.js           # Client helpers
│   ├── editor.js          # (TODO) Editor DOM
│   └── chat.js            # (TODO) Chat polling
└── uploads/               # User images
```

---

## Service Pattern Template

### New Service
```javascript
// src/services/MyService.js
const { pool } = require('../config/db');

class MyService {
  async getData(id) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(
        'SELECT * FROM my_table WHERE id = ?',
        [id]
      );
      return result[0];
    } finally {
      conn.end();
    }
  }
  
  async updateData(id, data) {
    const conn = await pool.getConnection();
    try {
      await conn.query('START TRANSACTION');
      
      const result = await conn.query(
        'UPDATE my_table SET name = ? WHERE id = ?',
        [data.name, id]
      );
      
      await conn.query('COMMIT');
      return result;
    } catch (err) {
      await conn.query('ROLLBACK');
      throw err;
    } finally {
      conn.end();
    }
  }
}

module.exports = new MyService();
```

### New Controller
```javascript
// src/controllers/myController.js
const MyService = require('../services/MyService');
const { validationResult } = require('express-validator');

class MyController {
  async getData(req, res, next) {
    try {
      const { id } = req.params;
      const data = await MyService.getData(id);
      
      if (!data) {
        return res.status(404).json({ error: 'Not found' });
      }
      
      res.json(data);
    } catch (err) {
      next(err); // Pasa al error handler
    }
  }
  
  async updateData(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { id } = req.params;
      const updated = await MyService.updateData(id, req.body);
      
      req.flash('success', 'Actualizado correctamente');
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MyController();
```

### New Route
```javascript
// src/routes/my.js
const express = require('express');
const { body, param } = require('express-validator');
const { authenticateUser } = require('../middleware/auth');
const MyController = require('../controllers/myController');

const router = express.Router();

router.get('/my/:id',
  authenticateUser,
  param('id').isInt(),
  MyController.getData
);

router.put('/my/:id',
  authenticateUser,
  param('id').isInt(),
  body('name').trim().notEmpty(),
  MyController.updateData
);

module.exports = router;
```

### Integrar en app.js
```javascript
const myRoutes = require('./routes/my');
app.use('/', myRoutes);
```

---

## EJS Template Patterns

### Partial
```ejs
<%- include('partials/header') %>

<!-- Content here -->

<%- include('partials/footer') %>
```

### Flash Messages
```ejs
<%- include('partials/flash-messages') %>
```

### Conditional
```ejs
<% if (user && user.role === 'admin') { %>
  <p>Admin only content</p>
<% } %>
```

### Loop
```ejs
<% proposals.forEach(prop => { %>
  <tr>
    <td><%= prop.client_name %></td>
    <td><%= prop.total_price %></td>
  </tr>
<% }) %>
```

### Output (sanitized)
```ejs
<%= user.name %>          <!-- Escaped -->
<%- htmlContent %>        <!-- Raw HTML (use carefully!) -->
```

---

## Database Patterns

### Query with Prepared Statements
```javascript
const result = await conn.query(
  'SELECT * FROM users WHERE email = ? AND role = ?',
  [email, role]
);
```

### Transaction (Multi-step operations)
```javascript
await conn.query('START TRANSACTION');
try {
  // Step 1
  await conn.query('INSERT INTO proposals ...');
  // Step 2
  await conn.query('INSERT INTO proposal_venues ...');
  await conn.query('COMMIT');
} catch (err) {
  await conn.query('ROLLBACK');
  throw err;
}
```

### Pagination
```javascript
const page = req.query.page || 1;
const limit = 10;
const offset = (page - 1) * limit;

const result = await conn.query(
  'SELECT * FROM proposals LIMIT ? OFFSET ?',
  [limit, offset]
);
```

---

## Client-side Utilities

### Fetch API
```javascript
// src/public/js/utils.js
const data = await fetchAPI('/api/proposals/1', {
  method: 'PUT',
  body: JSON.stringify({ status: 'sent' })
});
```

### Show Notification
```javascript
showNotification('Cambios guardados', 'success');
showNotification('Error al guardar', 'error', 5000);
```

### Format Currency
```javascript
const price = formatCurrency(1234.56); // "1.234,56 €"
```

### Debounce (Search)
```javascript
const handleSearch = debounce(async (term) => {
  const results = await fetchAPI(`/api/search?q=${term}`);
  updateUI(results);
}, 500);

input.addEventListener('input', (e) => handleSearch(e.target.value));
```

---

## Important Constants

From `src/config/constants.js`:

```javascript
PROPOSAL_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  ACCEPTED: 'accepted'
};

VAT_RATES = {
  SERVICE: 10.0,  // Servicios
  FOOD: 21.0      // Alimentos
};

RATE_LIMITS = {
  MAGIC_LINK_PER_MINUTE: 5,
  CHAT_PER_MINUTE: 10
};

POLLING_INTERVALS = {
  CHAT_POLL_MS: 30000 // 30 segundos
};
```

---

## Error Handling

### In Service
```javascript
if (!proposal) {
  throw new Error('Propuesta no encontrada');
}
```

### In Controller
```javascript
catch (err) {
  console.error(err);
  req.flash('error', err.message);
  res.status(500).render('errors/500');
}
```

### Flash Message Types
```javascript
req.flash('success', 'Operación completada');
req.flash('error', 'Algo salió mal');
req.flash('info', 'Información importante');
```

---

## Testing SQL

```bash
# Acceder a MariaDB
mysql -u catering_user -p catering_proposals

# Ver propuestas
SELECT * FROM proposals;

# Ver con joins
SELECT p.*, u.name FROM proposals p
LEFT JOIN users u ON p.user_id = u.id
LIMIT 10;

# Ver estado de edición
SELECT id, client_name, is_editing FROM proposals
WHERE is_editing = true;

# Contar por estado
SELECT status, COUNT(*) FROM proposals
GROUP BY status;
```

---

## IDE Setup (VS Code)

### Extensions
- MySQL (cweijan)
- EJS Language Support
- Tailwind CSS IntelliSense
- Thunder Client

### Debugger (launch.json)
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/server.js",
      "restart": true,
      "console": "integratedTerminal"
    }
  ]
}
```

---

**Last Updated:** February 2026
