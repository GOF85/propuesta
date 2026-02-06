
# 🚀 QUICK START (5 MIN)

## 1. Instala dependencias

```bash
npm install
```

## 2. Copia `.env.example` a `.env` y edítalo

```bash
cp .env.example .env
# Edita .env con tu editor favorito
```

## 3. Arranca la app en modo desarrollo

```bash
npm run dev
```

## 4. Accede al dashboard

http://localhost:3000/dashboard

## 5. (Opcional) Carga datos de prueba

```bash
node scripts/seed-test-data.js
```

## 6. ¡Listo!

Consulta [README.md](README.md) para más detalles.
```bash
npm run dev
```

**Open:** http://localhost:3000

---

## 🔑 Test Credentials

### User 1 (Commercial)
- **Email:** juan@micecatering.eu
- **Password:** password123
- **Role:** Commercial

### User 2 (Commercial)  
- **Email:** maria@micecatering.eu
- **Password:** password123
- **Role:** Commercial

### User 3 (Admin)
- **Email:** admin@micecatering.eu
- **Password:** admin123
- **Role:** Admin

---

## 🎯 Quick Actions

### Create Proposal
1. Login as commercial
2. Dashboard → "Nueva Propuesta"
3. Fill: Nombre Cliente, Fecha, PAX
4. Click "Crear"

### Send to Client
1. In editor, click "Enviar a Cliente"
2. Copy magic link
3. Client opens link without login

### Client Portal
- **URL:** `/p/{magic-hash}`
- **No login required**
- **Can:** View, accept, reject, chat, download PDF

---

## 📊 Project Structure

```
src/              # Backend code
├── controllers/  # HTTP handlers
├── services/     # Business logic (★ Main logic here)
├── routes/       # URL endpoints
├── middleware/   # Auth, errors
└── config/       # DB, constants

views/            # HTML templates (EJS)
├── commercial/   # Dashboard, editor
├── client/       # Magic link access
└── partials/     # Reusable components

public/           # Static files
├── js/           # Client scripts
├── css/          # Styles
└── uploads/      # Generated files
```

---

## 🔐 Important Variables (.env)

**Database:**
```env
DB_HOST=localhost
DB_USER=catering_user
DB_PASS=super_secure_password
DB_NAME=catering_proposals
```

**Application:**
```env
PORT=3000
NODE_ENV=development
SESSION_SECRET=generate_with_uuid_v4
```

**Email (Gmail SMTP):**
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your_16_char_app_password
```

---

## 📝 Common Commands

```bash
npm run dev         # Development (auto-reload)
npm run seed        # Load test data
npm test            # Run tests (when implemented)
npm start           # Production start
npm run verify      # Verify installation
pm2 start ecosystem.config.js  # Production with PM2
pm2 logs            # See logs
```

---

## 🎨 Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js v20+ |
| Framework | Express.js |
| Database | MariaDB 10.5+ |
| Templates | EJS |
| Styling | Tailwind CSS |
| Email | Nodemailer |

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | Overview & setup |
| [PROJECT.md](PROJECT.md) | Detailed specs |
| [EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md) | Quick overview |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production setup |
| [docs/TESTING.md](docs/TESTING.md) | Test cases |
| [docs/README.md](docs/README.md) | Docs index |

---

## ✅ Verification

After startup, verify:

```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@micecatering.eu","password":"password123"}'

# Database
mysql catering_proposals -e "SELECT COUNT(*) FROM users;"
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 in use | Change PORT in .env |
| DB connection error | Check DB_USER, DB_PASS in .env |
| Email not working | Use Gmail app password (not account password) |
| Modules not found | Run `npm install` again |

---

## 🚀 Next Steps

1. **Explore Dashboard:** Login & create proposals
2. **Test Editor:** Add venues, services, dishes
3. **Try Magic Link:** Send to client (no login!)
4. **Test Chat:** Send messages between users
5. **Review Code:** Check `/src` structure

---

## 📞 Need Help?

- **Docs:** [docs/README.md](docs/README.md)
- **Deployment:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Testing:** [docs/TESTING.md](docs/TESTING.md)
- **API:** [docs/API.md](docs/API.md)

---

**Status:** ✅ Ready to develop!

*For full setup, see [README.md](README.md)*
