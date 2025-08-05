# Production Setup Guide

## 🚀 **Production Deployment with Render & PostgreSQL**

This guide provides step-by-step instructions to deploy your Kryvex Trading Platform to production using Render hosting and PostgreSQL database.

---

## 🌍 **Production Services**

### **Frontend**: `https://kryvex-frontend.onrender.com`
### **Backend**: `https://kryvextrading-com.onrender.com`
### **Database**: `kryvex_trading` (PostgreSQL)

---

## 📋 **Environment Configuration**

### **1. Backend Environment Variables**

Create a `.env` file in the `backend/` directory with the following configuration:

```env
# Server Configuration
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://kryvex-frontend.onrender.com

# Database Configuration - Replace with your actual PostgreSQL credentials
DB_HOST=your_postgres_host_url
DB_PORT=5432
DB_NAME=kryvex_trading
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
DATABASE_URL=postgresql://your_postgres_username:your_postgres_password@your_postgres_host_url:5432/kryvex_trading

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Admin Configuration
ADMIN_EMAIL=admin@kryvex.com
ADMIN_PASSWORD=Kryvex.@123

# WebSocket Configuration
WS_PORT=3002
WS_PATH=/ws

# External Services
COINGECKO_BASE_URL=https://api.coingecko.com/api/v3
BINANCE_BASE_URL=https://api.binance.com/api/v3
```

### **2. Frontend Environment Variables**

Create a `.env` file in the `frontend/` directory with the following configuration:

```env
# Frontend Environment Variables
VITE_WS_URL=wss://kryvextrading-com.onrender.com
VITE_API_URL=https://kryvextrading-com.onrender.com
```

---

## 🔧 **Database Setup**

### **1. PostgreSQL Database**

Ensure your PostgreSQL database `kryvex_trading` is set up with the following tables:

```sql
-- Core tables (already created by migration scripts)
- users
- user_profiles
- wallets
- trades
- transactions
- admin_actions
- audit_logs
- admin_fund_actions
- notifications
- user_sessions
```

### **2. Database Connection**

The backend will automatically connect to the `kryvex_trading` database using the environment variables:

- `DB_HOST`: Your PostgreSQL host URL
- `DB_NAME`: `kryvex_trading`
- `DB_USER`: Your PostgreSQL username
- `DB_PASSWORD`: Your PostgreSQL password

---

## 🚀 **Deployment Steps**

### **1. Backend Deployment (Render)**

1. **Connect your GitHub repository to Render**
2. **Create a new Web Service**
3. **Configure the service:**
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment Variables**: Add all backend environment variables

### **2. Frontend Deployment (Render)**

1. **Create a new Static Site**
2. **Configure the service:**
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Environment Variables**: Add all frontend environment variables

### **3. Database Setup**

1. **Create PostgreSQL database on your preferred provider**
2. **Run the migration scripts:**
   ```bash
   # Apply the admin migration
   psql -h your_host -U your_user -d kryvex_trading -f scripts/admin-migration.sql
   ```

---

## ✅ **Verification Checklist**

### **Backend Verification**
- [ ] Database connection successful
- [ ] CORS configured for frontend domain
- [ ] WebSocket server running
- [ ] All API endpoints responding
- [ ] Admin authentication working

### **Frontend Verification**
- [ ] API calls to production backend
- [ ] WebSocket connection to production backend
- [ ] No localhost references
- [ ] Environment variables loaded correctly

### **Database Verification**
- [ ] `kryvex_trading` database connected
- [ ] All tables created
- [ ] Admin user exists
- [ ] No mock data in production

---

## 🔍 **Troubleshooting**

### **Common Issues**

1. **CORS Errors**
   - Ensure `CORS_ORIGIN` is set to `https://kryvex-frontend.onrender.com`
   - Check that the frontend URL is correct

2. **Database Connection Issues**
   - Verify PostgreSQL credentials
   - Ensure SSL is enabled for production
   - Check database host accessibility

3. **WebSocket Connection Issues**
   - Verify `VITE_WS_URL` is set to `wss://kryvextrading-com.onrender.com`
   - Check WebSocket server is running on backend

4. **Environment Variables**
   - Ensure all variables are set in Render dashboard
   - Check for typos in variable names

---

## 📊 **Monitoring**

### **Health Check Endpoints**
- Backend: `https://kryvextrading-com.onrender.com/api/health`
- Frontend: Check browser console for connection status

### **Logs**
- Monitor Render logs for backend errors
- Check browser console for frontend errors
- Monitor database connection logs

---

## 🎯 **Production Features**

### **✅ Clean User Data**
- New users start with zero balance
- No mock data or fake statistics
- Real-time data only from actual user actions

### **✅ Admin Control**
- Complete admin dashboard functionality
- Real-time user management
- Audit logging for all actions

### **✅ Security**
- JWT authentication
- CORS protection
- Rate limiting
- SSL encryption

---

## 📞 **Support**

If you encounter issues:

1. **Check Render logs** for backend errors
2. **Check browser console** for frontend errors
3. **Verify environment variables** are set correctly
4. **Test database connection** manually
5. **Review CORS configuration** for domain mismatches

---

*Last updated: $(date)*
*Status: ✅ Production Ready* 