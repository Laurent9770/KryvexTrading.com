# 🚀 Deployment Guide

This guide covers deploying the Kryvex Trading Platform with its new frontend/backend structure.

## 📁 Project Structure

```
kryvex-forge-main/
├── frontend/          # React (Vite) Frontend
│   ├── src/          # React components
│   ├── public/       # Static assets
│   └── package.json  # Frontend dependencies
├── backend/           # Node.js Backend
│   ├── server/       # WebSocket server
│   └── package.json  # Backend dependencies
└── package.json       # Root package.json
```

## 🎯 Recommended Deployment Strategy

### **Option 1: Vercel + Railway (Recommended)**

#### Frontend (Vercel)
```bash
# Deploy frontend to Vercel
cd frontend
npm run build
vercel --prod
```

#### Backend (Railway)
```bash
# Deploy backend to Railway
cd backend
railway login
railway init
railway up
```

### **Option 2: Netlify + Render**

#### Frontend (Netlify)
```bash
# Deploy frontend to Netlify
cd frontend
npm run build
netlify deploy --prod --dir=dist
```

#### Backend (Render)
```bash
# Deploy backend to Render
# Connect GitHub repo to Render
# Set build command: npm install
# Set start command: npm start
```

## 🔧 Environment Variables

### Frontend Environment (Vercel/Netlify)
```env
VITE_WS_URL=wss://your-backend-domain.com
VITE_API_URL=https://your-backend-domain.com
```

### Backend Environment (Railway/Render)
```env
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-frontend-domain.com
```

## 📋 Step-by-Step Deployment

### 1. Prepare Your Code

```bash
# Install all dependencies
npm run install:all

# Test locally
npm run dev
```

### 2. Deploy Backend First

#### Railway Deployment
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Create new service → Deploy from GitHub repo
4. Set environment variables:
   ```
   NODE_ENV=production
   PORT=3001
   CORS_ORIGIN=https://your-frontend-domain.vercel.app
   ```
5. Deploy and get your backend URL

#### Render Deployment
1. Go to [render.com](https://render.com)
2. Connect your GitHub repository
3. Create new Web Service
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variables
7. Deploy and get your backend URL

### 3. Deploy Frontend

#### Vercel Deployment
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set root directory to `frontend`
4. Add environment variables:
   ```
   VITE_WS_URL=wss://your-backend-domain.railway.app
   VITE_API_URL=https://your-backend-domain.railway.app
   ```
5. Deploy

#### Netlify Deployment
1. Go to [netlify.com](https://netlify.com)
2. Connect your GitHub repository
3. Set build command: `cd frontend && npm install && npm run build`
4. Set publish directory: `frontend/dist`
5. Add environment variables
6. Deploy

## 🌐 Domain Configuration

### Custom Domain Setup
1. **Frontend**: Configure custom domain in Vercel/Netlify
2. **Backend**: Configure custom domain in Railway/Render
3. **Update Environment Variables**:
   ```env
   # Frontend
   VITE_WS_URL=wss://api.yourdomain.com
   VITE_API_URL=https://api.yourdomain.com
   
   # Backend
   CORS_ORIGIN=https://yourdomain.com
   ```

## 🔒 Security Considerations

### SSL/HTTPS
- ✅ **Vercel**: Automatic SSL
- ✅ **Netlify**: Automatic SSL
- ✅ **Railway**: Automatic SSL
- ✅ **Render**: Automatic SSL

### CORS Configuration
```javascript
// Backend CORS setup
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true,
  optionsSuccessStatus: 200
};
```

### Environment Variables Security
- ✅ Never commit `.env` files
- ✅ Use platform-specific secret management
- ✅ Rotate secrets regularly

## 📊 Monitoring & Analytics

### Frontend Monitoring
- **Vercel Analytics**: Built-in performance monitoring
- **Netlify Analytics**: Built-in analytics
- **Google Analytics**: Add tracking code

### Backend Monitoring
- **Railway**: Built-in logs and metrics
- **Render**: Built-in monitoring
- **Custom Logging**: Implement structured logging

## 🚨 Troubleshooting

### Common Issues

#### Frontend Can't Connect to Backend
```bash
# Check CORS configuration
# Verify WebSocket URL
# Test API endpoints
curl https://your-backend-domain.com/api/test
```

#### WebSocket Connection Issues
```javascript
// Check WebSocket URL in frontend
const wsUrl = import.meta.env.PROD 
  ? import.meta.env.VITE_WS_URL 
  : 'ws://localhost:3001';
```

#### Build Failures
```bash
# Clear cache and reinstall
npm run clean:install
cd frontend && npm run build
cd ../backend && npm run build
```

### Debug Commands
```bash
# Test backend locally
cd backend && npm start

# Test frontend locally
cd frontend && npm run dev

# Check environment variables
echo $VITE_WS_URL
echo $NODE_ENV
```

## 📈 Performance Optimization

### Frontend Optimization
- ✅ **Code Splitting**: Implement lazy loading
- ✅ **Image Optimization**: Use WebP format
- ✅ **Bundle Analysis**: Monitor bundle size
- ✅ **CDN**: Leverage Vercel/Netlify CDN

### Backend Optimization
- ✅ **Connection Pooling**: Optimize database connections
- ✅ **Caching**: Implement Redis caching
- ✅ **Load Balancing**: Scale horizontally
- ✅ **Monitoring**: Set up alerts

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        uses: railway/deploy@v1
```

## 📞 Support

For deployment issues:
1. Check platform-specific documentation
2. Review environment variables
3. Test locally first
4. Check logs for errors
5. Contact platform support

---

**Happy Deploying! 🚀** 