# 🚀 Render.com Deployment Guide

This guide will help you deploy your Kryvex Trading Platform to Render.com using the ZIP files we've created.

## 📦 ZIP Files Created

✅ **backend.zip** (9.5 KB) - Node.js WebSocket server  
✅ **frontend.zip** (70.9 MB) - React frontend with dependencies  

## 🎯 Deployment Strategy

We'll deploy in this order:
1. **Backend** (WebSocket server) first
2. **Frontend** (React app) second
3. **Connect** them together

---

## 🔧 STEP 1: Deploy Backend to Render

### 1.1 Create Render Account
1. Go to [https://render.com](https://render.com)
2. Sign up for a free account
3. Verify your email

### 1.2 Deploy Backend Service
1. Click **"New"** → **"Web Service"**
2. Choose **"Deploy from archive"**
3. Upload your `backend.zip` file
4. Click **"Continue"**

### 1.3 Configure Backend Settings

**Basic Settings:**
- **Name**: `kryvex-backend`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or leave default)

**Build & Deploy Settings:**
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Auto-Deploy**: ✅ Enabled

**Environment Variables:**
```
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-frontend-name.onrender.com
```

### 1.4 Deploy Backend
1. Click **"Create Web Service"**
2. Wait for deployment (2-3 minutes)
3. Note your backend URL: `https://kryvex-backend.onrender.com`

---

## 🌐 STEP 2: Deploy Frontend to Render

### 2.1 Create Static Site
1. Go back to Render dashboard
2. Click **"New"** → **"Static Site"**
3. Choose **"Deploy from archive"**
4. Upload your `frontend.zip` file
5. Click **"Continue"**

### 2.2 Configure Frontend Settings

**Basic Settings:**
- **Name**: `kryvex-frontend`
- **Region**: Same as backend
- **Branch**: `main` (or leave default)

**Build Settings:**
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Auto-Deploy**: ✅ Enabled

**Environment Variables:**
```
VITE_API_URL=https://kryvex-backend.onrender.com
VITE_WS_URL=wss://kryvex-backend.onrender.com
```

### 2.3 Deploy Frontend
1. Click **"Create Static Site"**
2. Wait for deployment (3-5 minutes)
3. Note your frontend URL: `https://kryvex-frontend.onrender.com`

---

## 🔗 STEP 3: Connect Frontend & Backend

### 3.1 Update Backend CORS
1. Go to your backend service in Render
2. Click **"Environment"** tab
3. Update `CORS_ORIGIN`:
   ```
   CORS_ORIGIN=https://kryvex-frontend.onrender.com
   ```
4. Click **"Save Changes"**
5. Wait for automatic redeploy

### 3.2 Test Connection
1. Visit your frontend URL
2. Open browser developer tools (F12)
3. Check Console for any connection errors
4. Try registering a user to test WebSocket

---

## 🧪 STEP 4: Testing Your Deployment

### 4.1 Basic Functionality Test
- ✅ **Landing Page**: Should load without errors
- ✅ **User Registration**: Create a new account
- ✅ **Login**: Sign in with created account
- ✅ **Dashboard**: View portfolio and stats
- ✅ **Market Page**: View crypto prices
- ✅ **Trade Buttons**: Should navigate to trading page

### 4.2 WebSocket Connection Test
1. Open browser console
2. Look for WebSocket connection messages
3. Try placing a trade to test real-time updates
4. Check if admin features work (if you're admin)

### 4.3 Admin Features Test
- ✅ **Admin Login**: Use admin credentials
- ✅ **User Management**: View registered users
- ✅ **KYC Management**: Review submissions
- ✅ **Wallet Controls**: Fund user wallets
- ✅ **Live Chat**: Test admin-user communication

---

## 🚨 Troubleshooting

### Common Issues & Solutions

#### 1. Frontend Can't Connect to Backend
**Symptoms**: Console shows connection errors
**Solution**:
```bash
# Check backend URL in frontend environment
VITE_API_URL=https://your-backend-name.onrender.com
VITE_WS_URL=wss://your-backend-name.onrender.com
```

#### 2. CORS Errors
**Symptoms**: Browser blocks requests
**Solution**:
```bash
# Update backend CORS_ORIGIN
CORS_ORIGIN=https://your-frontend-name.onrender.com
```

#### 3. WebSocket Connection Failed
**Symptoms**: Real-time features don't work
**Solution**:
- Ensure backend is running
- Check WebSocket URL format (wss://)
- Verify Render supports WebSocket (it does)

#### 4. Build Failures
**Symptoms**: Frontend deployment fails
**Solution**:
```bash
# Check build command
npm install && npm run build

# Check publish directory
dist
```

#### 5. Environment Variables Not Working
**Symptoms**: App uses localhost URLs
**Solution**:
- Double-check environment variable names
- Ensure no typos in URLs
- Redeploy after changing variables

---

## 📊 Monitoring Your Deployment

### Render Dashboard
- **Logs**: View real-time logs
- **Metrics**: Monitor performance
- **Deployments**: Track deployment history
- **Environment**: Manage variables

### Health Checks
```bash
# Test backend API
curl https://your-backend.onrender.com/api/test

# Test frontend
curl https://your-frontend.onrender.com
```

---

## 🔄 Updating Your Deployment

### Backend Updates
1. Make changes to your code
2. Recreate `backend.zip`
3. Upload to Render backend service
4. Auto-deploy will trigger

### Frontend Updates
1. Make changes to your code
2. Recreate `frontend.zip`
3. Upload to Render static site
4. Auto-deploy will trigger

### Environment Variable Updates
1. Go to service settings
2. Update environment variables
3. Save changes
4. Service will redeploy automatically

---

## 💰 Cost Considerations

### Render Free Tier
- **Web Services**: 750 hours/month
- **Static Sites**: Unlimited
- **Bandwidth**: 100 GB/month
- **Perfect for testing and small projects**

### Render Paid Plans
- **Starter**: $7/month - More resources
- **Standard**: $25/month - Production ready
- **Pro**: $100/month - High performance

---

## 🎉 Success Checklist

- ✅ Backend deployed and running
- ✅ Frontend deployed and accessible
- ✅ WebSocket connection working
- ✅ User registration/login working
- ✅ Trading features functional
- ✅ Admin panel accessible
- ✅ Real-time updates working
- ✅ No console errors
- ✅ Mobile responsive

---

## 📞 Support

If you encounter issues:
1. Check Render logs for errors
2. Verify environment variables
3. Test locally first
4. Contact Render support
5. Check this guide for solutions

---

**🎯 Your Kryvex Trading Platform is now live on Render.com!**

**Frontend**: `https://kryvex-frontend.onrender.com`  
**Backend**: `https://kryvex-backend.onrender.com`

Happy Trading! 🚀 