# 🚀 Complete Setup Guide - Get Your Site Working

## ✅ Step 1: Verify Database is Ready

1. Go to: `https://auth-db1430.hstgr.io/index.php?db=u773378680_alertamadeira`
2. Login with:
   - Username: `u773378680_alertamadeira`
   - Password: `2t2@X>cX`
3. Check if these tables exist (left sidebar):
   - ✅ `users`
   - ✅ `posts`
   - ✅ `reactions`
   - ✅ `comments`
   - ✅ `advertisements`
   - ✅ `push_notifications`
   - ✅ `push_tokens`

**If tables are missing:** Run the SQL from `backend-php/database/schema.sql` in the SQL tab.

---

## ✅ Step 2: Upload Files to Hostinger

### Option A: Using FileZilla (FTP)

1. **Open FileZilla**
2. **Connect:**
   - Host: `193.203.189.7`
   - Username: `u773378680.alerta`
   - Password: `^T1phanbfEatcJTL`
   - Port: `21`
   - Click **Quickconnect**

3. **On RIGHT side (Remote Site):**
   - You should be at root `/`
   - **Create folder:** Right-click → Create directory → Name: `public_html`
   - **Open it:** Double-click `public_html`

4. **On LEFT side (Local Site):**
   - Navigate to: `C:\Users\Levi\Desktop\alerta-madeira-main`

5. **Upload backend-php:**
   - Find `backend-php` folder on LEFT
   - Right-click → **Upload**
   - Wait for upload to finish
   - **Rename:** On RIGHT, right-click `backend-php` → Rename → Change to `api`

6. **Upload admin-panel:**
   - Find `admin-panel` folder on LEFT
   - Right-click → **Upload**
   - Wait for upload to finish

### Option B: Using Hostinger File Manager (Easier!)

1. **Get hPanel access from buyer** (ask for Hostinger account login)
2. **Login to hPanel:** https://hpanel.hostinger.com
3. **Go to:** Files → File Manager
4. **Navigate to:** `public_html` folder
5. **Upload:**
   - Click **Upload** button
   - Select `backend-php` folder → Upload
   - Select `admin-panel` folder → Upload
6. **Rename:** `backend-php` → `api`

---

## ✅ Step 3: Verify File Structure

After upload, in `public_html` you should have:

```
public_html/
├── api/                    ← backend-php renamed to api
│   ├── api/
│   ├── config/
│   ├── database/
│   ├── middleware/
│   ├── services/
│   └── utils/
└── admin-panel/
    ├── assets/
    ├── config.php
    ├── index.php
    ├── login.php
    └── ...
```

---

## ✅ Step 4: Test Everything

### Test 1: API Health Check
Open in browser:
```
https://www.alertmadeira.com/api/health
```

**✅ Success looks like:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "message": "Alerta Madeira API is running"
  }
}
```

**❌ If error:**
- Check files are in `public_html/api/`
- Check file permissions (should be 755 for folders, 644 for files)

### Test 2: Admin Panel
Open in browser:
```
https://www.alertmadeira.com/admin-panel/
```

**✅ Success:** Login page appears

**Login with:**
- Email: `admin@alertamadeira.pt`
- Password: `admin123`

**✅ After login:** Should see dashboard with tabs (Users, Posts, Ads, Notifications)

**❌ If error:**
- Check `admin-panel/config.php` has correct database credentials
- Check database connection

### Test 3: Test API Endpoints

**Test Login:**
Open browser console (F12) and run:
```javascript
fetch('https://www.alertmadeira.com/api/auth?action=login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    email: 'admin@alertamadeira.pt',
    password: 'admin123'
  })
})
.then(r => r.json())
.then(console.log)
```

**✅ Success:** Returns token and user data

---

## 🔧 Troubleshooting

### "Site can't be reached"
- **Problem:** Files not uploaded or wrong location
- **Fix:** 
  1. Verify files are in `public_html` folder
  2. Check folder is named `api` (not `backend-php`)
  3. Verify domain is correct: `www.alertmadeira.com`

### "404 Not Found"
- **Problem:** Files in wrong location
- **Fix:** 
  1. Files must be in `public_html/api/` and `public_html/admin-panel/`
  2. Check `.htaccess` file exists in `api` folder

### "500 Internal Server Error"
- **Problem:** PHP error or database connection issue
- **Fix:**
  1. Check `api/config/database.php` has correct credentials
  2. Check database exists and tables are created
  3. Check file permissions

### "Database connection failed"
- **Problem:** Wrong database credentials
- **Fix:**
  1. Verify database name: `u773378680_alertamadeira`
  2. Verify username: `u773378680_alertamadeira`
  3. Verify password: `2t2@X>cX`
  4. Test connection in phpMyAdmin

### Admin Panel shows blank page
- **Problem:** PHP error or missing files
- **Fix:**
  1. Check all files uploaded
  2. Check `admin-panel/config.php` has correct settings
  3. Check browser console for errors (F12)

---

## 📋 Final Checklist

Before testing, verify:

- [ ] Database tables created (7 tables)
- [ ] Files uploaded to `public_html`
- [ ] `backend-php` renamed to `api`
- [ ] `admin-panel` folder uploaded
- [ ] File permissions set (755 folders, 644 files)
- [ ] Database credentials correct in config files
- [ ] JWT_SECRET matches in both backend and admin-panel

---

## 🎯 Quick Test URLs

After upload, test these in order:

1. **API Health:** `https://www.alertmadeira.com/api/health`
2. **Admin Login:** `https://www.alertmadeira.com/admin-panel/`
3. **API Login Test:** Use browser console (see Test 3 above)

---

## 📞 Need Help?

If still not working:
1. Take screenshot of FileZilla showing file structure
2. Take screenshot of browser error
3. Check Hostinger error logs (if available)
4. Verify database connection works in phpMyAdmin

