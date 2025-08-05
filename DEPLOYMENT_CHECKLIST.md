# 🚀 Railway Migration Deployment Checklist

## ✅ **Step 1: Database Export (COMPLETED)**
- [x] Local PostgreSQL database exported
- [x] Backup file: `kryvex_trading_backup.sql` (11.84 KB)
- [x] 7 tables identified for migration
- [x] Database structure preserved

## 🔄 **Step 2: Railway PostgreSQL Setup**
- [ ] Go to https://railway.app
- [ ] Sign in with GitHub
- [ ] Click "New Project"
- [ ] Select "Provision PostgreSQL"
- [ ] Wait for database creation (1-2 minutes)
- [ ] Note project name (e.g., `kryvex-trading-db`)

## 🔄 **Step 3: Get Railway Connection Details**
- [ ] Click on PostgreSQL service
- [ ] Go to "Connect" tab
- [ ] Copy connection URL
- [ ] Format: `postgresql://user:password@host:port/railway`

## 🔄 **Step 4: Import Database to Railway**

### Option A: Using pgAdmin (Recommended)
- [ ] Add Railway server in pgAdmin
- [ ] Use connection details from step 3
- [ ] Connect to Railway server
- [ ] Right-click on `railway` database
- [ ] Select "Query Tool"
- [ ] Open `kryvex_trading_backup.sql`
- [ ] Execute (F5)

### Option B: Using Command Line
- [ ] Run: `psql "postgresql://user:password@host:port/railway" < kryvex_trading_backup.sql`

## 🔄 **Step 5: Update Render Environment Variables**

### Backend Environment Variables
- [ ] Go to Render backend service
- [ ] Navigate to "Environment" tab
- [ ] Add/Update these variables:

```env
# Database Configuration
DATABASE_URL=${{ Postgres.DATABASE_URL }}

# Server Configuration
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://kryvex-frontend.onrender.com

# JWT Configuration
JWT_SECRET=25f0cc55a6a97243f0ff4c846a21160f24da042657ad648eeb92fd3fc13f10f1cb9ee11860d5b509b8954e53545a72aa9b943a3cd6480fb95079b97d2dab8535
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Admin Configuration
ADMIN_EMAIL=admin@kryvex.com
ADMIN_PASSWORD=Kryvex.@123

# WebSocket Configuration
WS_PORT=3002
WS_PATH=/ws
```

### Frontend Environment Variables
- [ ] Go to Render frontend service
- [ ] Navigate to "Environment" tab
- [ ] Add/Update these variables:

```env
VITE_API_URL=https://kryvextrading-com.onrender.com
VITE_WS_URL=wss://kryvextrading-com.onrender.com
```

## 🔄 **Step 6: Test Connections**

### Test Railway Database
- [ ] Set DATABASE_URL environment variable
- [ ] Run: `node scripts/test-railway-connection.js`
- [ ] Verify all 7 tables are present
- [ ] Confirm admin user exists

### Test Backend Deployment
- [ ] Deploy backend to Render
- [ ] Test API endpoints:
  - `https://kryvextrading-com.onrender.com/api/health`
  - `https://kryvextrading-com.onrender.com/api/admin/users`
- [ ] Check Render logs for errors

### Test Frontend Deployment
- [ ] Deploy frontend to Render
- [ ] Visit frontend URL
- [ ] Check browser console for connection status
- [ ] Test admin login

## 🔄 **Step 7: Verify Admin Dashboard**
- [ ] Login to admin dashboard
- [ ] Test all admin tabs:
  - [ ] Users tab
  - [ ] KYC tab
  - [ ] Deposits tab
  - [ ] Withdrawals tab
  - [ ] Wallets tab
  - [ ] Trading Control tab
  - [ ] Audit tab
  - [ ] Notifications tab

## 🔄 **Step 8: Final Verification**
- [ ] Test user registration
- [ ] Test user login
- [ ] Test trading functionality
- [ ] Test WebSocket connections
- [ ] Test real-time updates
- [ ] Verify no localhost references remain

## 🔄 **Step 9: Clean Up**
- [ ] Delete local backup file after successful migration
- [ ] Update documentation with new connection details
- [ ] Monitor Railway usage and costs
- [ ] Set up logging for database connections

## 📊 **Migration Summary**

### Database Content
- **Tables**: 7 (users, wallets, trades, transactions, admin_actions, profiles, trade_outcome_logs)
- **Data Records**: 0 (clean database structure)
- **Backup Size**: 11.84 KB
- **Admin User**: Ready for creation

### Production URLs
- **Frontend**: `https://kryvex-frontend.onrender.com`
- **Backend**: `https://kryvextrading-com.onrender.com`
- **Database**: Railway PostgreSQL

### Security Configuration
- **JWT Secret**: 64-byte secure key
- **SSL**: Enabled for production
- **CORS**: Configured for frontend domain
- **Admin Auth**: Protected routes

## 🎯 **Success Criteria**
- [ ] All API endpoints responding
- [ ] Database queries working
- [ ] Admin authentication functional
- [ ] Real-time updates working
- [ ] No CORS errors
- [ ] No localhost references
- [ ] All admin dashboard tabs functional

## 📞 **Support Resources**
- **Railway Logs**: Check for database errors
- **Render Logs**: Check for backend errors
- **Browser Console**: Check for frontend errors
- **Test Scripts**: Use provided verification scripts

---

*Status: Ready for Railway Migration*
*Last Updated: $(date)* 