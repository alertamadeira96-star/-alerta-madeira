# Alerta Madeira - Setup Guide

## Project Structure

```
alerta-madeira-main/
├── app/                    # Mobile app (React Native/Expo)
├── backend/                 # Backend API (Node.js/Express)
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── middleware/         # Auth middleware
│   └── database.js         # Database setup
├── backoffice/             # Web admin panel (Next.js)
│   ├── pages/              # Next.js pages
│   ├── components/         # React components
│   └── contexts/           # React contexts
├── services/               # Mobile app services
│   ├── api.ts             # API client
│   └── pushNotifications.ts # Push notification setup
└── DEPLOYMENT.md           # Deployment instructions
```

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your settings
npm start
```

The API will run on `http://localhost:3000`

### 2. Back Office Setup

```bash
cd backoffice
npm install
# Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:3000/api
npm run dev
```

The back office will run on `http://localhost:3000` (or 3001 if 3000 is taken)

### 3. Mobile App Setup

```bash
# In root directory
npm install
# Create .env with EXPO_PUBLIC_API_URL=http://localhost:3000/api
npm start
```

## Features Implemented

✅ **Backend API**
- User authentication (JWT)
- User management (CRUD)
- Posts management (CRUD)
- Comments system
- Advertisements management
- Push notifications system
- SQLite database

✅ **Web Back Office**
- Admin login
- User management (view, delete)
- Posts management (view, delete)
- Advertisements management (add, delete)
- Push notifications (send to all users)
- Modern, responsive UI

✅ **Mobile App Updates**
- Integrated with backend API
- Push notifications support
- Automatic token registration
- Real-time data sync

✅ **Push Notifications**
- Expo Push Notifications integrated
- Backend service to send notifications
- Token management
- Admin can send notifications from back office

## Default Admin Credentials

- **Email**: `admin@alertamadeira.pt`
- **Password**: `admin123` (change in production!)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Users (Admin only)
- `GET /api/users` - Get all users
- `DELETE /api/users/:id` - Delete user

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get post by ID
- `POST /api/posts` - Create post (authenticated)
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/reactions` - Toggle reaction

### Comments
- `GET /api/comments/post/:postId` - Get comments for post
- `POST /api/comments` - Add comment (authenticated)

### Advertisements
- `GET /api/ads` - Get all ads
- `GET /api/ads/active` - Get active ads
- `POST /api/ads` - Add ad (admin only)
- `DELETE /api/ads/:id` - Delete ad (admin only)

### Notifications (Admin only)
- `GET /api/notifications` - Get all notifications
- `POST /api/notifications/send` - Send push notification

### Push Tokens
- `POST /api/push-tokens` - Register push token (authenticated)

## Next Steps

1. **Deploy Backend to Hostinger**
   - Follow `DEPLOYMENT.md` instructions
   - Set up Node.js application
   - Configure environment variables

2. **Deploy Back Office to Hostinger**
   - Build Next.js app
   - Upload to hosting
   - Configure subdomain

3. **Update Mobile App**
   - Set API URL to production
   - Build with EAS
   - Submit to App Stores

4. **Security**
   - Change default admin password
   - Use strong JWT_SECRET
   - Enable HTTPS
   - Consider rate limiting

## Important Notes

- The backend uses SQLite by default. For production, consider PostgreSQL/MySQL
- Push notifications require Expo Push Notification service
- All API endpoints require authentication except public endpoints
- Admin endpoints require admin role

## Support

For deployment help, see `DEPLOYMENT.md`
For issues, check the troubleshooting section in `DEPLOYMENT.md`

