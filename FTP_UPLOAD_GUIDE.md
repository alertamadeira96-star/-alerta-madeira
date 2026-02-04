# Simple FTP Upload Guide for Hostinger

## Quick Steps

### Step 1: Connect to FTP
1. Open FileZilla
2. Enter these details:
   - **Host:** `193.203.189.7`
   - **Username:** `u773378680.alerta`
   - **Password:** `^T1phanbfEatcJTL`
   - **Port:** `21`
3. Click **Quickconnect**

### Step 2: Find or Create public_html
**On the RIGHT side (Remote Site):**

1. You should be at root `/` 
2. Look for a folder called `public_html`
   - **If you see it:** Double-click to open it
   - **If you DON'T see it:** 
     - Right-click in empty space
     - Click "Create directory"
     - Name it: `public_html`
     - Double-click to open it

### Step 3: Upload Files

**Method A: Upload Individual Folders (Recommended)**

1. Make sure you're IN `public_html` folder (right side)
2. On LEFT side, find your folders:
   - `backend-php` folder
   - `admin-panel` folder
3. **Upload backend-php:**
   - Right-click `backend-php` → **Upload**
   - Wait for upload to finish
   - After upload, on RIGHT side, right-click `backend-php` → **Rename**
   - Change name to: `api`
4. **Upload admin-panel:**
   - Right-click `admin-panel` → **Upload**
   - Wait for upload to finish

**Method B: Upload ZIP File (Easier)**

1. Make sure you're IN `public_html` folder (right side)
2. On LEFT side, find: `alerta-madeira-upload.zip`
3. Right-click the ZIP → **Upload**
4. After upload, on RIGHT side:
   - Right-click `alerta-madeira-upload.zip` → **Extract**
   - Or use Hostinger File Manager to extract

### Step 4: Verify Upload

After uploading, on RIGHT side in `public_html`, you should see:
```
public_html/
├── api/              (or backend-php - rename it to api)
│   ├── api/
│   ├── config/
│   └── ...
└── admin-panel/
    ├── assets/
    ├── config.php
    └── ...
```

### Step 5: Test

1. Open browser
2. Go to: `https://www.alertmadeira.com/api/health`
   - Should show: `{"success":true,"data":{"status":"ok"...}}`
3. Go to: `https://www.alertmadeira.com/admin-panel/`
   - Should show login page
   - Login: `admin@alertamadeira.pt` / `admin123`

## Troubleshooting

### "Can't find public_html"
- Create it: Right-click → Create directory → `public_html`
- Or upload to root `/` and test if it works

### "Upload failed"
- Check internet connection
- Try reconnecting to FTP
- Check file permissions (should be 755 for folders, 644 for files)

### "Website not loading"
- Make sure files are in `public_html` folder
- Check if `api` folder exists (not `backend-php`)
- Verify file permissions

### "Database connection failed"
- Check `api/config/database.php` has correct credentials
- Verify database exists in phpMyAdmin

## Need Help?

If still having issues:
1. Take a screenshot of FileZilla (both sides)
2. Tell me what error you see
3. I'll help troubleshoot!

