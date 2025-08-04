# 🚀 Render.com Deployment Guide

## 📋 Prerequisites

1. **Render.com Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Backend Domain**: `https://kryvextrading-com.onrender.com`
4. **Frontend Domain**: `https://kryvex-frontend.onrender.com`

## 🎯 Deployment Steps

### Step 1: Connect GitHub Repository

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the repository: `Laurent9770/KryvexTrading.com`

### Step 2: Configure Backend Service

**Service Settings:**
- **Name**: `kryvex-trading-backend`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`

**Environment Variables:**
```env
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://kryvex-frontend.onrender.com
JWT_SECRET=your_super_secret_jwt_key_here
```

### Step 3: Create PostgreSQL Database

1. In Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. **Name**: `kryvex-trading-db`
3. **Database**: `kryvex_trading`
4. **User**: `kryvex_user`
5. **Plan**: `Free`

### Step 4: Link Database to Backend

1. Go to your backend service
2. Click **"Environment"** tab
3. Add these environment variables:

```env
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DATABASE_URL=${DATABASE_URL}
```

### Step 5: Deploy Frontend (Optional)

If you want to deploy the frontend separately:

1. Create another **Web Service**
2. **Name**: `kryvex-trading-frontend`
3. **Build Command**: `cd frontend && npm install && npm run build`
4. **Start Command**: `cd frontend && npm start`

## 🔧 Configuration Files

### render.yaml (Auto-deployment)
```yaml
services:
  - type: web
    name: kryvex-trading-backend
    env: node
    plan: free
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: CORS_ORIGIN
        value: https://kryvex-frontend.onrender.com
      - key: JWT_SECRET
        generateValue: true
      - key: DB_HOST
        fromDatabase:
          name: kryvex-trading-db
          property: host
      - key: DB_PORT
        fromDatabase:
          name: kryvex-trading-db
          property: port
      - key: DB_NAME
        fromDatabase:
          name: kryvex-trading-db
          property: database
      - key: DB_USER
        fromDatabase:
          name: kryvex-trading-db
          property: user
      - key: DB_PASSWORD
        fromDatabase:
          name: kryvex-trading-db
          property: password
      - key: DATABASE_URL
        fromDatabase:
          name: kryvex-trading-db
          property: connectionString

databases:
  - name: kryvex-trading-db
    databaseName: kryvex_trading
    user: kryvex_user
    plan: free
```

## 🌐 URLs After Deployment

### Backend API
- **Base URL**: `https://kryvextrading-com.onrender.com`
- **Health Check**: `https://kryvextrading-com.onrender.com/api/health`
- **WebSocket**: `wss://kryvextrading-com.onrender.com`

### Frontend Application
- **Main App**: `https://kryvex-frontend.onrender.com`
- **Admin Dashboard**: `https://kryvex-frontend.onrender.com/admin`
- **User Dashboard**: `https://kryvex-frontend.onrender.com/dashboard`

### API Endpoints
- **Auth**: `https://kryvextrading-com.onrender.com/api/auth/*`
- **Users**: `https://kryvextrading-com.onrender.com/api/users/*`
- **Wallets**: `https://kryvextrading-com.onrender.com/api/wallets/*`
- **Trading**: `https://kryvextrading-com.onrender.com/api/trading/*`
- **Admin**: `https://kryvextrading-com.onrender.com/api/admin/*`
- **KYC**: `https://kryvextrading-com.onrender.com/api/kyc/*`
- **Chat**: `https://kryvextrading-com.onrender.com/api/chat/*`

## 🔐 Admin Access

**Admin Credentials:**
- **Email**: `admin@kryvex.com`
- **Password**: `Kryvex.@123`
- **Admin Dashboard**: `https://kryvex-frontend.onrender.com/admin`

## 📊 Monitoring

### Health Checks
- **Backend**: `https://kryvextrading-com.onrender.com/api/health`
- **Database**: Check Render Dashboard → Database → Logs

### Logs
- **Backend Logs**: Render Dashboard → Service → Logs
- **Database Logs**: Render Dashboard → Database → Logs

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check `package.json` dependencies
   - Verify Node.js version (20.x)
   - Check build logs in Render Dashboard

2. **Database Connection Issues**
   - Verify database environment variables
   - Check database status in Render Dashboard
   - Test connection with provided credentials

3. **CORS Issues**
   - Verify `CORS_ORIGIN` environment variable
   - Check frontend domain matches backend CORS settings

4. **WebSocket Issues**
   - Verify WebSocket URL in frontend config
   - Check WebSocket server is running on correct port

### Debug Commands

```bash
# Test backend health
curl https://kryvextrading-com.onrender.com/api/health

# Test database connection
curl https://kryvextrading-com.onrender.com/api/health

# Check environment variables
echo $NODE_ENV
echo $DATABASE_URL
```

## 🔄 Auto-Deployment

The `render.yaml` file enables automatic deployment:

1. **Push to GitHub**: Any push to `main` branch triggers deployment
2. **Environment Variables**: Automatically configured from database
3. **Health Checks**: Automatic monitoring and restart on failure

## 📈 Scaling

### Free Tier Limits
- **Backend**: 750 hours/month
- **Database**: 90 days free trial
- **Bandwidth**: 100GB/month

### Upgrade Options
- **Paid Plans**: Available for higher limits
- **Custom Domains**: Add your own domain
- **SSL Certificates**: Automatic HTTPS

## 🎉 Success Indicators

✅ **Backend Running**: Health check returns 200 OK
✅ **Database Connected**: No connection errors in logs
✅ **WebSocket Working**: Real-time features functional
✅ **Admin Access**: Can login to admin dashboard
✅ **API Endpoints**: All endpoints responding correctly

## 📞 Support

- **Render Support**: [support.render.com](https://support.render.com)
- **Documentation**: [render.com/docs](https://render.com/docs)
- **Community**: [render.com/community](https://render.com/community) 