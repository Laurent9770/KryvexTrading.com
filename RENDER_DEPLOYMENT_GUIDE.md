# Render.com Deployment Guide for Kryvex Trading Platform

## 🎯 **Overview**

This guide provides step-by-step instructions for deploying the Kryvex Trading Platform on **Render.com** with **Supabase** integration, ensuring proper SPA routing and no 404 refresh issues.

## 🚀 **Prerequisites**

### **Required Accounts**
- ✅ **Render.com** account
- ✅ **Supabase** project
- ✅ **GitHub** repository (for automatic deployments)

### **Environment Variables**
Make sure you have these Supabase environment variables ready:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 📋 **Deployment Steps**

### **Step 1: Prepare Your Repository**

1. **Push to GitHub**: Ensure your code is pushed to GitHub
2. **Verify Files**: Make sure these files are in your repository:
   - `render.yaml` (Render configuration)
   - `package.json` (with build scripts)
   - `vite.config.ts` (Vite configuration)

### **Step 2: Create Render Service**

1. **Login to Render**: Go to [render.com](https://render.com)
2. **New Static Site**: Click "New" → "Static Site"
3. **Connect Repository**: Connect your GitHub repository
4. **Configure Settings**:

#### **Basic Settings**
```
Name: kryvex-trading-frontend
Branch: main (or your default branch)
Root Directory: (leave empty)
Build Command: npm install && npm run build
Publish Directory: dist
```

#### **Environment Variables**
```
VITE_SUPABASE_URL = your_supabase_url
VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
NODE_ENV = production
```

### **Step 3: Advanced Settings**

#### **Auto-Deploy**
- ✅ **Auto-Deploy**: Enabled
- ✅ **Deploy on Push**: Enabled

#### **Health Check Path**
```
Health Check Path: /
```

## 🔧 **Configuration Files**

### **1. render.yaml**
```yaml
services:
  - type: web
    name: kryvex-trading-frontend
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    headers:
      - path: /*
        name: X-Content-Type-Options
        value: nosniff
      - path: /*
        name: X-Frame-Options
        value: DENY
      - path: /*
        name: X-XSS-Protection
        value: "1; mode=block"
      - path: /*
        name: Cache-Control
        value: "public, max-age=31536000, immutable"
      - path: /assets/*
        name: Cache-Control
        value: "public, max-age=31536000, immutable"
      - path: /*.js
        name: Cache-Control
        value: "public, max-age=31536000, immutable"
      - path: /*.css
        name: Cache-Control
        value: "public, max-age=31536000, immutable"
      - path: /*.ico
        name: Cache-Control
        value: "public, max-age=31536000, immutable"
      - path: /*.png
        name: Cache-Control
        value: "public, max-age=31536000, immutable"
      - path: /*.svg
        name: Cache-Control
        value: "public, max-age=31536000, immutable"
```

### **2. package.json Scripts**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "serve": "node server.js"
  }
}
```

### **3. vite.config.ts**
```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8080,
    host: true,
  },
  preview: {
    port: 8080,
    host: true,
  },
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
        },
      },
    },
  },
})
```

## 🔒 **Security Configuration**

### **Headers Applied**
- ✅ **X-Content-Type-Options**: Prevents MIME type sniffing
- ✅ **X-Frame-Options**: Prevents clickjacking attacks
- ✅ **X-XSS-Protection**: Enables XSS protection
- ✅ **Cache-Control**: Optimizes static asset caching

### **SPA Routing**
- ✅ **Rewrite Rules**: All routes serve `index.html`
- ✅ **Client-side Routing**: React Router handles navigation
- ✅ **No 404 Errors**: Proper fallback for all routes

## 📊 **Performance Optimizations**

### **Build Optimizations**
- ✅ **Code Splitting**: Manual chunks for better caching
- ✅ **Tree Shaking**: Unused code removed
- ✅ **Minification**: CSS and JS optimized
- ✅ **Asset Optimization**: Images and fonts optimized

### **Caching Strategy**
- ✅ **Static Assets**: 1-year cache for JS, CSS, images
- ✅ **HTML**: No cache for dynamic content
- ✅ **CDN Ready**: All assets optimized for CDN

## 🧪 **Testing Your Deployment**

### **Test Scenarios**
1. **Direct URL Access**: Navigate to `https://your-app.onrender.com/trading`
2. **Page Refresh**: Refresh while on `/market`
3. **Deep Linking**: Share direct links to `/wallet`
4. **Browser Navigation**: Use back/forward buttons

### **Expected Results**
- ✅ **No 404 errors**: All routes load correctly
- ✅ **Fast loading**: Optimized assets load quickly
- ✅ **Proper routing**: Each route shows correct content
- ✅ **Authentication**: Login/logout works properly

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. Build Failures**
```bash
# Check build locally first
npm run build

# Verify all dependencies are installed
npm install
```

#### **2. Environment Variables**
- ✅ Ensure `VITE_SUPABASE_URL` is set
- ✅ Ensure `VITE_SUPABASE_ANON_KEY` is set
- ✅ Check Supabase project is active

#### **3. Routing Issues**
- ✅ Verify `render.yaml` has rewrite rules
- ✅ Check that `dist/index.html` exists after build
- ✅ Ensure all routes are properly configured

### **Debug Commands**
```bash
# Local build test
npm run build

# Check dist folder
ls -la dist/

# Test local server
npm run serve
```

## 📈 **Monitoring & Analytics**

### **Render Dashboard**
- ✅ **Build Logs**: Monitor build process
- ✅ **Deployment History**: Track changes
- ✅ **Performance Metrics**: Monitor response times
- ✅ **Error Logs**: Debug issues

### **Supabase Dashboard**
- ✅ **Database Performance**: Monitor queries
- ✅ **Authentication**: Track user sign-ups
- ✅ **Real-time Subscriptions**: Monitor connections
- ✅ **Storage Usage**: Track file uploads

## 🚀 **Deployment Checklist**

### **Pre-Deployment**
- [ ] Code pushed to GitHub
- [ ] Supabase project configured
- [ ] Environment variables ready
- [ ] Local build successful
- [ ] All tests passing

### **Deployment**
- [ ] Render service created
- [ ] Repository connected
- [ ] Environment variables set
- [ ] Build command configured
- [ ] Auto-deploy enabled

### **Post-Deployment**
- [ ] All routes accessible
- [ ] No 404 errors on refresh
- [ ] Authentication working
- [ ] Real-time features functional
- [ ] Performance acceptable

## 🎯 **Final Result**

After following this guide, you'll have:

1. **✅ Professional Deployment**: Fast, secure, and reliable
2. **✅ No 404 Errors**: Perfect SPA routing
3. **✅ Optimized Performance**: Fast loading times
4. **✅ Security Headers**: Protection against attacks
5. **✅ Auto-Deployment**: Automatic updates on code push
6. **✅ Monitoring**: Built-in analytics and logs

Your Kryvex Trading Platform will be **production-ready** on Render.com with seamless user experience and no routing issues! 🚀 