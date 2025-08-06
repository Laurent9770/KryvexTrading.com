# 🔧 Backend Configuration Guide

## 📋 **Current Environment Variables Analysis**

Based on the Render.com screenshots, here are the current environment variables and what needs to be updated:

### **✅ Current Variables (Working)**
```
NODE_ENV=production
PORT=3001
JWT_SECRET=25f0cc55a6a97243f0ff4c846a21160f24da042657ad648eeb92fd3fc13f10f1cb9ee11860d5b509b8954e53545a72aa0b042a20d6480fb05070b07d2d0b8695
SUPABASE_URL=https://ftkeczodadvtnxofrwps.supabase.co
SUPABASE_ANON_KEY=sb_publishable_OSH3Xg5_iP1-EJP8oJqpHg_16aPCuqb
SUPABASE_SERVICE_ROLE_KEY=sb_secret_dVIR1sALFUo-OQAeVsQuBA_G15ThVNP
```

### **❌ Issues to Fix**

1. **Missing CORS_ORIGIN**: Need to add the frontend URL
2. **Wrong Service Role Key Format**: The current key doesn't look like a proper Supabase service role key
3. **Missing WS Configuration**: WebSocket settings are not needed for Supabase

## 🔧 **Required Environment Variables**

### **Essential Variables**
```
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://kryvextrading-com.onrender.com
SUPABASE_URL=https://ftkeczodadvtnxofrwps.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[YOUR_ACTUAL_SERVICE_ROLE_KEY]
JWT_SECRET=25f0cc55a6a97243f0ff4c846a21160f24da042657ad648eeb92fd3fc13f10f1cb9ee11860d5b509b8954e53545a72aa0b042a20d6480fb05070b07d2d0b8695
```

### **Optional Variables**
```
SUPABASE_ANON_KEY=sb_publishable_OSH3Xg5_iP1-EJP8oJqpHg_16aPCuqb
```

## 🛠️ **How to Fix**

### **Step 1: Get Correct Supabase Service Role Key**

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the "service_role" key (it should start with `eyJ...`)
4. Replace the current `SUPABASE_SERVICE_ROLE_KEY` value

### **Step 2: Add Missing Environment Variables**

In Render.com environment variables, add:

```
CORS_ORIGIN=https://kryvextrading-com.onrender.com
```

### **Step 3: Remove Unnecessary Variables**

You can remove these variables as they're not needed:
```
WS_PATH=/ws
WS_PORT=3002
DATABASE_URL=postgresql://...
```

## 🔍 **Testing the Configuration**

### **Health Check**
```bash
curl https://kryvextrading-com.onrender.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-XX...",
  "environment": "production",
  "supabase": "configured",
  "cors_origin": "https://kryvextrading-com.onrender.com",
  "port": 3001
}
```

### **Supabase Connection Test**
```bash
curl https://kryvextrading-com.onrender.com/api/test-supabase
```

Expected response:
```json
{
  "status": "connected",
  "message": "Supabase connection successful",
  "data": []
}
```

## 🚨 **Common Issues**

### **1. Supabase Connection Fails**
- Check if `SUPABASE_URL` is correct
- Verify `SUPABASE_SERVICE_ROLE_KEY` is the actual service role key
- Ensure the key starts with `eyJ...`

### **2. CORS Errors**
- Verify `CORS_ORIGIN` matches your frontend URL exactly
- Check that the frontend is actually deployed at that URL

### **3. Authentication Errors**
- Ensure `JWT_SECRET` is set and not empty
- Verify the secret is long enough (at least 32 characters)

## 📊 **Monitoring**

### **Check Logs**
In Render.com dashboard:
1. Go to your backend service
2. Click on "Logs" tab
3. Look for these messages:
   - ✅ "Supabase client initialized"
   - ✅ "Kryvex Backend Server running on port 3001"
   - ❌ "Failed to initialize Supabase client"

### **Test Endpoints**
```bash
# Health check
curl https://kryvextrading-com.onrender.com/api/health

# Test Supabase
curl https://kryvextrading-com.onrender.com/api/test-supabase

# Get stats
curl https://kryvextrading-com.onrender.com/api/stats
```

## ✅ **Success Criteria**

The backend is correctly configured when:

1. ✅ Health check returns `"supabase": "configured"`
2. ✅ Supabase test endpoint returns `"status": "connected"`
3. ✅ No CORS errors in browser console
4. ✅ Admin endpoints work with proper authentication
5. ✅ All API endpoints return proper JSON responses

## 🔄 **Next Steps**

After fixing the environment variables:

1. **Redeploy the backend** in Render.com
2. **Test all endpoints** using the curl commands above
3. **Check frontend integration** by visiting the app
4. **Monitor logs** for any remaining errors

---

**🎯 Goal: Get the backend fully functional with Supabase integration!** 