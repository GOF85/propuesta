# 📋 Deployment Guide - CSV Admin Panels Update

## Summary

Convert admin panels from JSON import/export to **CSV format** for better user accessibility (Excel/Google Sheets compatible).

## Files Updated

### 1. **views/admin/venues.ejs** (279 lines)

- ✅ TAB 1: List remains unchanged
- ✅ TAB 2: Import converted from textarea JSON → **file drag-drop (CSV)**
- ✅ TAB 3: Template converted from JSON → **CSV format**
- ✅ Export button updated to export CSV

### 2. **views/admin/dishes.ejs** (284 lines)  

- ✅ TAB 1: List remains unchanged
- ✅ TAB 2: Import converted from textarea JSON → **file drag-drop (CSV)**
- ✅ TAB 3: Template converted from JSON → **CSV format**
- ✅ Export button updated to export CSV

### 3. **src/controllers/adminController.js** (Already Updated - Feb 5 & 6)

- ✅ `parseCSV()` method - Uses papaparse to parse CSV
- ✅ `toCSV()` method - Converts data to CSV format
- ✅ `importVenues()` - Handles file upload
- ✅ `exportVenues()` - Exports as CSV
- ✅ `importDishes()` - Handles file upload  
- ✅ `exportDishes()` - Exports as CSV

---

## Deployment Steps

### Option 1: Manual FTP/SFTP Upload (**RECOMMENDED** - SSH auth issues)

1. **Connect via SFTP**

   ```bash
   sftp guiyo@188.95.113.225
   ```

2. **Navigate to project root**

   ```
   cd /var/www/vhosts/micecatering.eu/propuesta.micecatering.eu
   ```

3. **Upload the two files**

   ```
   put views/admin/venues.ejs views/admin/venues.ejs
   put views/admin/dishes.ejs views/admin/dishes.ejs
   ```

4. **Exit SFTP**

   ```
   exit
   ```

5. **SSH to restart Node.js**

   ```bash
   ssh guiyo@188.95.113.225
   cd /var/www/vhosts/micecatering.eu/propuesta.micecatering.eu
   
   # Stop Node.js
   pkill -f "node src/server.js"
   
   # Wait 2 seconds
   sleep 2
   
   # Start Node.js again
   pm2 restart propuesta || node src/server.js &
   
   # Verify it's running
   ps aux | grep "node"
   ```

---

### Option 2: Git Push to Server (If Git Workflow Available)

```bash
# From your local machine
cd /Users/guillermo/mc/propuesta

# Push to remote
git push origin main

# Then SSH to server
ssh guiyo@188.95.113.225
cd /var/www/vhosts/micecatering.eu/propuesta.micecatering.eu

# Pull updates
git pull origin main

# Restart Node.js
pm2 restart propuesta || (pkill -f "node src/server.js" && node src/server.js &)
```

---

## ✅ Testing Checklist

After deployment, test the following:

### 1. Venues Admin Panel

- [ ] Navigate to `/admin/venues`
- [ ] Click "📥 Importar CSV" tab
- [ ] **Try drag-drop**: Drag a CSV file onto the dropzone
- [ ] **Try file select**: Click zone to select file
- [ ] File name should appear when selected
- [ ] Click "✅ Importar CSV" to upload
- [ ] Success message should appear

### 2. Download CSV Template

- [ ] Click "📄 Descargar CSV" tab
- [ ] Click "📋 Copiar Plantilla" button
- [ ] Verify CSV is in clipboard
- [ ] Click "⬇️ Descargar CSV" link
- [ ] `venues-template.csv` should download

### 3. Export Venues

- [ ] Go back to "📋 Lista" tab
- [ ] Click "⬇️ Exportar CSV" button
- [ ] Current venues should download as CSV

### 4. Dishes Admin Panel

- [ ] Navigate to `/admin/dishes`
- [ ] Repeat steps 1-3 with dishes
- [ ] File should be named `dishes-template.csv`

---

## 📊 CSV Format Examples

### Venues CSV

```csv
name,description,capacity_cocktail,capacity_banquet,capacity_theater,features,address,map_iframe,external_url,images
"Sala Modernista Barcelona","Espacio diáfano con techos altos",200,120,150,"Luz natural|Wifi|Proyector 4K","Passeig de Gràcia, 85, Barcelona","https://maps.google.com/?q=Barcelona","https://ejemplo.com/barcelona","/uploads/venues/barcelona-1.webp"
```

### Dishes CSV

```csv
name,description,category,allergens,badges,image_url,base_price
"Ensalada César","Lechuga romana, croutons, parmesano, salsa César casera","entrante","gluten|lacteos|huevo","","/uploads/dishes/ensalada-cesar.webp",8.50
```

**Key Points:**

- Pipe character `|` separates array values (features, allergens, badges)
- All text strings must be quoted
- Decimals use `.` not `,`

---

## 🔧 Troubleshooting

### Issue: "File upload not working"

**Solution**: Ensure `express-fileupload` middleware is configured in `app.js`

### Issue: "CSV parsing error"

**Solution**: Verify `papaparse` is in `package.json` and installed:

```bash
npm install papaparse
```

### Issue: "Files uploaded but changes not visible"

**Solution**: Clear browser cache and restart Node.js

```bash
pm2 restart propuesta
```

---

## 📝 Git Commit Info

```
Commit: 0870351 (main branch)
Message: Convert admin panels from JSON to CSV format

Files modified:
- views/admin/venues.ejs
- views/admin/dishes.ejs
- Archive: admin-csv-updates.tar.gz (MD5: 8a8244aa49994f23d87df1bcd4cb3c5c)
```

---

## 🎯 Success Criteria

✅ Admin panels accept CSV file uploads via drag-drop  
✅ CSV template can be downloaded from both panels  
✅ Existing venue/dish data exports as CSV  
✅ No console errors when importing/exporting  
✅ UI shows appropriate success/error messages  

---

**Status**: Ready for deployment  
**Tested Locally**: ✅ Yes  
**Git Committed**: ✅ Yes  
**Production Ready**: ✅ Yes
