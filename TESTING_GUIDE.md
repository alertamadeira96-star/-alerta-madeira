# Testing Guide - Alerta Madeira

## How to Test What We've Created

### Option 1: Test After Uploading to Hostinger (Recommended)

#### Step 1: Upload Files
1. Upload `backend-php` folder → rename to `api` in `public_html`
2. Upload `admin-panel` folder to `public_html`

#### Step 2: Test API Health
Open in browser:
```
https://www.alertmadeira.com/api/health
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "message": "Alerta Madeira API is running"
  }
}
```

✅ **If you see this:** API is working!

❌ **If you see error:** Check file upload location and permissions

#### Step 3: Test Admin Panel
Open in browser:
```
https://www.alertmadeira.com/admin-panel/
```

**Expected Result:**
- Login page appears
- Login with: `admin@alertamadeira.pt` / `admin123`
- Should see admin dashboard

✅ **If you see dashboard:** Admin panel is working!

❌ **If you see error:** Check database connection in `config.php`

#### Step 4: Test API Endpoints

**Test Registration:**
```bash
POST https://www.alertmadeira.com/api/auth?action=register
Body: {
  "email": "test@example.com",
  "password": "test123",
  "name": "Test User"
}
```

**Test Login:**
```bash
POST https://www.alertmadeira.com/api/auth?action=login
Body: {
  "email": "admin@alertamadeira.pt",
  "password": "admin123"
}
```

**Test Get Posts:**
```bash
GET https://www.alertmadeira.com/api/posts
```

### Option 2: Use Test HTML Page

1. Open `test-api.html` in your browser
2. Update API URL if needed
3. Click test buttons
4. See results instantly

### Option 3: Test Locally (If PHP Installed)

If you install PHP locally, you can test:

```bash
# Install PHP (if not installed)
# Windows: Download from php.net
# Mac: brew install php
# Linux: sudo apt install php

# Navigate to backend
cd backend-php

# Start PHP built-in server
php -S localhost:8000

# Test in browser
http://localhost:8000/api/health
```

## What to Check

### ✅ API Working If:
- `/api/health` returns success message
- `/api/auth?action=login` returns token
- `/api/posts` returns data (or empty array)

### ✅ Admin Panel Working If:
- Login page loads
- Can login with admin credentials
- Can see users, posts, ads tabs
- Can delete users/posts

### ✅ Database Working If:
- No "database connection failed" errors
- Can see users in admin panel
- Can create new users via API

## Common Issues & Fixes

### "404 Not Found"
- **Problem:** Files not in correct location
- **Fix:** Make sure files are in `public_html/api/` and `public_html/admin-panel/`

### "Database connection failed"
- **Problem:** Wrong database credentials
- **Fix:** Check `backend-php/config/database.php` has correct credentials

### "Access denied" or "Unauthorized"
- **Problem:** JWT token issue or admin not logged in
- **Fix:** Check `JWT_SECRET` matches in both backend and admin-panel

### "Site can't be reached"
- **Problem:** Files not uploaded or wrong domain
- **Fix:** Verify files are uploaded and domain is correct

## Quick Test Checklist

After uploading to Hostinger:

- [ ] API health check works: `https://www.alertmadeira.com/api/health`
- [ ] Admin panel loads: `https://www.alertmadeira.com/admin-panel/`
- [ ] Can login to admin panel
- [ ] Can see users list (may be empty)
- [ ] Can see posts list (may be empty)
- [ ] Can register new user via API
- [ ] Can login via API and get token

## Next Steps After Testing

Once everything works:

1. ✅ Add Firebase FCM Server Key
2. ✅ Test push notifications
3. ✅ Update Flutter app with API URL
4. ✅ Test Flutter app connection
5. ✅ Prepare for app store deployment

