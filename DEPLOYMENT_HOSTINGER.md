# Hostinger Shared Hosting Deployment Guide

## Prerequisites
- Hostinger shared hosting account
- PHP 8.0+ enabled
- MySQL database access
- FTP/File Manager access

## Step 1: Create MySQL Database

1. Log in to Hostinger hPanel
2. Go to **Databases** → **MySQL Databases**
3. Create new database: `alerta_madeira`
4. Create database user and password
5. Grant all privileges to user
6. Note down:
   - Database name
   - Database user
   - Database password
   - Database host (usually `localhost`)

## Step 2: Import Database Schema

1. Go to **Databases** → **phpMyAdmin**
2. Select your database
3. Click **Import** tab
4. Choose file: `backend-php/database/schema.sql`
5. Click **Go**
6. Verify tables are created

## Step 3: Upload Backend Files

### Via File Manager:
1. Go to **Files** → **File Manager**
2. Navigate to `public_html` (or your domain folder)
3. Create folder: `api`
4. Upload all files from `backend-php/` to `api/`

### Via FTP:
1. Connect via FTP client (FileZilla, etc.)
2. Upload `backend-php/` contents to `public_html/api/`

### File Structure Should Be:
```
public_html/
└── api/
    ├── api/
    ├── config/
    ├── database/
    ├── middleware/
    ├── services/
    └── utils/
```

## Step 4: Configure Backend

1. Edit `api/config/database.php`:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'alerta_madeira');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');
```

2. Edit `api/config/config.php`:
```php
define('JWT_SECRET', 'your-strong-random-secret-key-here');
```

3. Edit `api/services/fcm.php`:
```php
define('FCM_SERVER_KEY', 'your-firebase-server-key');
```

## Step 5: Set File Permissions

1. In File Manager, select `api` folder
2. Right-click → **Change Permissions**
3. Set to `755` for folders
4. Set to `644` for files
5. Make sure `api/` folder is writable (for SQLite if used, but we use MySQL)

## Step 6: Configure .htaccess (if needed)

Create `api/.htaccess`:
```apache
RewriteEngine On
RewriteBase /api/

# Route all requests to index.php
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ api/index.php [QSA,L]

# Enable CORS
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Authorization"
```

## Step 7: Upload Admin Panel

1. Upload `admin-panel/` folder to `public_html/admin-panel/`
2. Edit `admin-panel/config.php` with database credentials
3. Edit `admin-panel/assets/js/app.js`:
   - Change `API_URL` to your domain: `https://your-domain.com/api`

## Step 8: Test Backend

1. Visit: `https://your-domain.com/api/health`
2. Should return: `{"success":true,"data":{"status":"ok","message":"Alerta Madeira API is running"}}`

## Step 9: Test Admin Panel

1. Visit: `https://your-domain.com/admin-panel/`
2. Login with:
   - Email: `admin@alertamadeira.pt`
   - Password: `admin123`
3. Test all features

## Step 10: Firebase Setup

1. Go to https://console.firebase.google.com
2. Create new project or use existing
3. Add Android app (package name from Flutter)
4. Add iOS app (bundle ID from Flutter)
5. Download config files:
   - `google-services.json` (Android)
   - `GoogleService-Info.plist` (iOS)
6. Get Server Key:
   - Project Settings → Cloud Messaging → Server Key
7. Add to `api/services/fcm.php`

## Troubleshooting

### API Not Working
- Check PHP version (should be 8.0+)
- Check file permissions
- Check database connection
- Check error logs in hPanel

### Admin Panel Not Loading
- Check database connection in `config.php`
- Check API URL in JavaScript
- Check browser console for errors

### Push Notifications Not Working
- Verify FCM Server Key is correct
- Check Firebase project settings
- Verify tokens are registered in database
- Check PHP error logs

### CORS Issues
- Ensure `.htaccess` is configured
- Check `config/config.php` CORS headers
- Verify API URL matches domain

## Security Checklist

- [ ] Changed default admin password
- [ ] Set strong JWT_SECRET
- [ ] Enabled HTTPS/SSL
- [ ] Set proper file permissions
- [ ] Restricted database user permissions (if possible)
- [ ] Regular backups

## Support

- Hostinger Support: https://www.hostinger.com/contact
- Check error logs in hPanel → **Logs**

