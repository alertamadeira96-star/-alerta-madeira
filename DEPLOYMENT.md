# Alerta Madeira - Deployment Guide

This guide covers deploying the backend API, web back office, and mobile app.

## Table of Contents

1. [Backend API Deployment](#backend-api-deployment)
2. [Web Back Office Deployment](#web-back-office-deployment)
3. [Mobile App Configuration](#mobile-app-configuration)
4. [Environment Variables](#environment-variables)
5. [Hostinger Specific Instructions](#hostinger-specific-instructions)

---

## Backend API Deployment

### Prerequisites
- Node.js 18+ installed
- Hostinger hosting account with Node.js support
- FTP/SSH access to your hosting

### Step 1: Prepare Backend Files

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Edit `.env` with your configuration:
```
PORT=3000
JWT_SECRET=your-strong-random-secret-key-here
ADMIN_EMAIL=admin@alertamadeira.pt
ADMIN_PASSWORD=your-secure-admin-password
NODE_ENV=production
```

### Step 2: Upload to Hostinger

1. **Via FTP:**
   - Connect to your Hostinger FTP
   - Upload the entire `backend` folder to your hosting (e.g., `public_html/api` or a subdomain)

2. **Via SSH (if available):**
   ```bash
   scp -r backend/* username@your-domain.com:/path/to/api/
   ```

### Step 3: Configure Hostinger Node.js App

1. Log in to your Hostinger control panel
2. Navigate to **Node.js** section
3. Create a new Node.js application:
   - **App Name**: `alerta-madeira-api`
   - **Node.js Version**: 18.x or higher
   - **App Root**: `/api` (or your chosen path)
   - **Startup File**: `server.js`
   - **Port**: `3000` (or the port Hostinger assigns)

4. Set environment variables in Hostinger control panel:
   - `PORT` (use the port Hostinger assigns)
   - `JWT_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `NODE_ENV=production`

### Step 4: Install Dependencies and Start

1. **Via SSH:**
   ```bash
   cd /path/to/api
   npm install --production
   ```

2. **Start the application** (Hostinger usually handles this automatically)

3. **Test the API:**
   - Visit: `https://your-domain.com/api/health`
   - Should return: `{"status":"ok","message":"Alerta Madeira API is running"}`

### Step 5: Database Setup

The SQLite database will be created automatically on first run. Make sure the directory has write permissions:

```bash
chmod 755 /path/to/api
chmod 666 /path/to/api/database.sqlite
```

---

## Web Back Office Deployment

### Step 1: Build the Next.js App

1. Navigate to the backoffice directory:
```bash
cd backoffice
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

4. Build the production version:
```bash
npm run build
```

### Step 2: Deploy to Hostinger

**Option A: Static Export (Recommended for Hostinger)**

1. Update `next.config.js`:
```javascript
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
}
```

2. Build:
```bash
npm run build
```

3. Upload the `out` folder contents to `public_html/backoffice` via FTP

**Option B: Node.js Hosting (If Hostinger supports it)**

1. Upload the entire `backoffice` folder
2. Install dependencies: `npm install --production`
3. Start: `npm start`
4. Configure reverse proxy in Hostinger to point to the Next.js app

### Step 3: Configure Domain/Subdomain

1. In Hostinger control panel, create a subdomain: `backoffice.your-domain.com`
2. Point it to the `backoffice` directory
3. Update `.env.local` with the correct API URL

---

## Mobile App Configuration

### Step 1: Update API URL

1. Create a `.env` file in the root directory:
```bash
EXPO_PUBLIC_API_URL=https://your-domain.com/api
```

2. Or update `services/api.ts` directly:
```typescript
const API_URL = 'https://your-domain.com/api';
```

### Step 2: Configure Push Notifications

1. **Expo Push Notifications Setup:**
   - The app is already configured with Expo Push Notifications
   - Push tokens are automatically registered with the backend when users log in

2. **For Production Builds:**
   - Ensure `expo-notifications` plugin is in `app.json` (already added)
   - Build with EAS:
   ```bash
   eas build --platform ios
   eas build --platform android
   ```

### Step 3: Build and Deploy to App Stores

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS:**
   ```bash
   eas build:configure
   ```

3. **Build for iOS:**
   ```bash
   eas build --platform ios
   ```

4. **Build for Android:**
   ```bash
   eas build --platform android
   ```

5. **Submit to App Stores:**
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

---

## Environment Variables

### Backend (.env)
```
PORT=3000
JWT_SECRET=your-strong-random-secret-key
ADMIN_EMAIL=admin@alertamadeira.pt
ADMIN_PASSWORD=your-secure-password
NODE_ENV=production
```

### Back Office (.env.local)
```
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

### Mobile App (.env)
```
EXPO_PUBLIC_API_URL=https://your-domain.com/api
```

---

## Hostinger Specific Instructions

### Setting Up Node.js Application

1. **Access Node.js Manager:**
   - Log in to Hostinger hPanel
   - Go to **Advanced** → **Node.js**

2. **Create Application:**
   - Click **Create Application**
   - Fill in:
     - **Node.js Version**: 18.x
     - **Application Root**: `/api`
     - **Application Mode**: Production
     - **Application Startup File**: `server.js`
     - **Application URL**: `api.your-domain.com` (or subdomain)

3. **Environment Variables:**
   - Add all variables from `.env` file
   - Save and restart the application

### Database Considerations

- SQLite is used by default (file-based, no setup needed)
- For production, consider migrating to MySQL/PostgreSQL if Hostinger provides it
- Update `backend/database.js` to use MySQL/PostgreSQL if needed

### SSL/HTTPS

- Hostinger provides free SSL certificates
- Ensure your API and back office are accessed via HTTPS
- Update CORS settings in `backend/server.js` if needed

### Firewall and Security

1. **Restrict API Access:**
   - Consider adding IP whitelist for admin endpoints
   - Use strong JWT_SECRET
   - Enable rate limiting (add middleware if needed)

2. **Back Office Security:**
   - Use strong admin password
   - Consider adding 2FA in the future
   - Keep Next.js updated

---

## Testing After Deployment

### 1. Test Backend API

```bash
# Health check
curl https://your-domain.com/api/health

# Test login (should return token)
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@alertamadeira.pt","password":"your-password"}'
```

### 2. Test Back Office

1. Visit: `https://backoffice.your-domain.com`
2. Login with admin credentials
3. Test all features:
   - View users
   - Delete users
   - View posts
   - Delete posts
   - Add/delete ads
   - Send push notifications

### 3. Test Mobile App

1. Update API URL in the app
2. Test login/register
3. Test creating posts
4. Test push notifications (send from back office)

---

## Troubleshooting

### Backend Issues

**Problem:** API not responding
- Check Node.js app is running in Hostinger
- Check port configuration
- Check firewall settings
- Review logs in Hostinger control panel

**Problem:** Database errors
- Check file permissions on `database.sqlite`
- Ensure directory is writable
- Check disk space

### Back Office Issues

**Problem:** Cannot connect to API
- Check `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings in backend
- Verify API is accessible

**Problem:** Build fails
- Check Node.js version (should be 18+)
- Clear `.next` folder and rebuild
- Check for TypeScript errors

### Mobile App Issues

**Problem:** Cannot connect to API
- Verify API URL is correct
- Check CORS settings
- Test API endpoint directly

**Problem:** Push notifications not working
- Verify Expo project ID in `services/pushNotifications.ts`
- Check device permissions
- Verify token is registered in backend

---

## Maintenance

### Regular Tasks

1. **Backup Database:**
   - Download `database.sqlite` regularly
   - Consider automated backups

2. **Update Dependencies:**
   - Regularly update npm packages
   - Check for security vulnerabilities: `npm audit`

3. **Monitor Logs:**
   - Check Hostinger logs regularly
   - Monitor API performance

4. **Update Mobile App:**
   - Push updates via App Store/Play Store
   - Test thoroughly before release

---

## Support

For issues or questions:
1. Check Hostinger documentation
2. Review Expo documentation for mobile app
3. Check Next.js documentation for back office

---

## Additional Notes

- The backend uses SQLite by default. For production with high traffic, consider PostgreSQL or MySQL
- Push notifications require Expo Push Notification service (free tier available)
- Ensure all API endpoints are properly secured
- Regularly update all dependencies for security patches

