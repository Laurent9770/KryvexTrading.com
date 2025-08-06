# 🚀 Kryvex Trading - Production Deployment Guide

## 📋 **Overview**

This guide will help you deploy the Kryvex Trading platform to Render.com with Supabase integration.

## 🔧 **Prerequisites**

1. **Supabase Project**: Ensure your Supabase project is set up with all migrations applied
2. **Render.com Account**: Access to Render.com dashboard
3. **Environment Variables**: Supabase credentials ready

## 🏗️ **Deployment Steps**

### **Step 1: Prepare Repository**

1. **Push Latest Changes**
   ```bash
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

2. **Verify Build Locally**
   ```bash
   cd frontend && npm run build
   cd ../backend && npm install
   ```

### **Step 2: Render.com Setup**

1. **Create New Web Service**
   - Go to Render.com dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Frontend Service**
   ```
   Name: kryvex-frontend
   Environment: Static Site
   Build Command: cd frontend && npm install && npm run build
   Publish Directory: frontend/dist
   ```

3. **Configure Backend Service**
   ```
   Name: kryvex-backend
   Environment: Node
   Build Command: cd backend && npm install
   Start Command: cd backend && npm start
   ```

### **Step 3: Environment Variables**

#### **Frontend Environment Variables**
```
VITE_SUPABASE_URL=https://ftkeczodadvtnxofrwps.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg
VITE_API_URL=https://kryvex-backend.onrender.com
```

#### **Backend Environment Variables**
```
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://kryvex-frontend.onrender.com
SUPABASE_URL=https://ftkeczodadvtnxofrwps.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]
JWT_SECRET=25f0cc55a6a97243f0ff4c846a21160f24da042657ad648eeb92fd3fc13f10f1cb9ee11860d5b509b8954e53545a72aa9b943a3cd6480fb95079b97d2dab8535
```

### **Step 4: Deploy**

1. **Deploy Backend First**
   - Deploy the backend service
   - Wait for successful deployment
   - Test health endpoint: `https://kryvex-backend.onrender.com/api/health`

2. **Deploy Frontend**
   - Deploy the frontend service
   - Wait for successful deployment
   - Test the application: `https://kryvex-frontend.onrender.com`

## 🔍 **Post-Deployment Testing**

### **1. Health Checks**
- ✅ Backend: `https://kryvex-backend.onrender.com/api/health`
- ✅ Frontend: `https://kryvex-frontend.onrender.com`

### **2. Feature Testing**
- ✅ User Registration/Login
- ✅ Trading Interface
- ✅ Wallet Operations
- ✅ KYC Verification
- ✅ Admin Dashboard
- ✅ Real-time Updates

### **3. Error Monitoring**
- Check browser console for errors
- Monitor Render.com logs
- Verify Supabase connections

## 🛠️ **Troubleshooting**

### **Common Issues**

1. **404 Frontend Errors**
   - Verify build command: `cd frontend && npm install && npm run build`
   - Check publish directory: `frontend/dist`
   - Ensure `index.html` exists in dist folder

2. **CORS Errors**
   - Verify `CORS_ORIGIN` environment variable
   - Check backend CORS configuration
   - Ensure frontend URL matches CORS settings

3. **Supabase Connection Errors**
   - Verify environment variables
   - Check Supabase project status
   - Ensure RLS policies are configured

4. **Build Failures**
   - Check Node.js version (>=18.0.0)
   - Verify all dependencies in package.json
   - Check build logs for specific errors

### **Debug Commands**

```bash
# Test backend locally
cd backend && npm start

# Test frontend build
cd frontend && npm run build

# Check environment variables
echo $VITE_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

## 📊 **Monitoring**

### **Render.com Monitoring**
- Service health status
- Build logs
- Runtime logs
- Performance metrics

### **Supabase Monitoring**
- Database performance
- Real-time subscriptions
- Storage usage
- API rate limits

## 🔄 **Continuous Deployment**

### **Auto-Deploy Setup**
1. Connect GitHub repository to Render
2. Enable auto-deploy on main branch
3. Configure build hooks if needed

### **Environment Management**
- Use Render.com environment variables
- Keep secrets secure
- Rotate keys regularly

## 🎯 **Success Criteria**

✅ **Deployment Successful**
- Both services running
- No build errors
- Health checks passing

✅ **Functionality Working**
- User authentication
- Trading features
- Admin dashboard
- Real-time updates

✅ **Performance Acceptable**
- Page load times < 3 seconds
- API response times < 1 second
- No timeout errors

## 📞 **Support**

If you encounter issues:
1. Check Render.com logs
2. Verify environment variables
3. Test locally first
4. Review this guide

---

**🎉 Congratulations! Your Kryvex Trading platform is now deployed and ready for production use!** 