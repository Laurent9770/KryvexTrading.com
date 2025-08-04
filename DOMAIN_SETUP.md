# 🌐 Custom Domain Setup Guide for kryvextrading.com

## 📋 Overview
This guide will help you configure your custom domain `kryvextrading.com` purchased on GoDaddy to work with your Render deployment.

## 🚀 Step-by-Step Configuration

### **Step 1: Get Your Render App URL**
Your Render app is deployed at: `https://kryvex-trading-platform.onrender.com`

### **Step 2: Configure DNS in GoDaddy**

#### **2.1 Access GoDaddy DNS Settings**
1. Log into your GoDaddy account at [godaddy.com](https://godaddy.com)
2. Go to "My Products" → "Domains"
3. Find `kryvextrading.com` and click "Manage"
4. Click on the "DNS" tab

#### **2.2 Add CNAME Records**
Add these DNS records:

**Record 1 - Root Domain:**
```
Type: CNAME
Name: @ (or leave blank)
Value: kryvex-trading-platform.onrender.com
TTL: 600 (or 1 hour)
```

**Record 2 - www Subdomain:**
```
Type: CNAME
Name: www
Value: kryvex-trading-platform.onrender.com
TTL: 600 (or 1 hour)
```

**Record 3 - Apex Domain (Alternative):**
If CNAME doesn't work for root domain, use A record:
```
Type: A
Name: @ (or leave blank)
Value: 76.76.19.19
TTL: 600 (or 1 hour)
```

### **Step 3: Configure Custom Domain in Render**

#### **3.1 Access Render Dashboard**
1. Go to [render.com](https://render.com)
2. Log into your account
3. Find your "kryvex-trading-platform" service

#### **3.2 Add Custom Domains**
1. Click on your service
2. Go to "Settings" tab
3. Scroll down to "Custom Domains"
4. Click "Add Domain"
5. Enter: `kryvextrading.com`
6. Click "Add Domain"

#### **3.3 Add www Subdomain**
1. Click "Add Domain" again
2. Enter: `www.kryvextrading.com`
3. Click "Add Domain"

### **Step 4: SSL Certificate**
Render will automatically provision SSL certificates for your custom domain. This may take 24-48 hours.

### **Step 5: Verify Configuration**

#### **5.1 Test DNS Propagation**
Use these tools to check DNS propagation:
- [whatsmydns.net](https://whatsmydns.net)
- [dnschecker.org](https://dnschecker.org)

#### **5.2 Test Your Domain**
Once configured, test these URLs:
- `https://kryvextrading.com`
- `https://www.kryvextrading.com`

## 🔧 Troubleshooting

### **Common Issues:**

#### **1. DNS Not Propagated**
- Wait 24-48 hours for full propagation
- Check with DNS propagation tools
- Clear browser cache

#### **2. SSL Certificate Issues**
- Wait 24-48 hours for SSL provisioning
- Check Render dashboard for certificate status
- Ensure DNS is properly configured

#### **3. Domain Not Loading**
- Verify CNAME records are correct
- Check Render service is running
- Test with health endpoint: `https://kryvextrading.com/api/health`

#### **4. www vs non-www Issues**
- Ensure both records are added in GoDaddy
- Configure both domains in Render
- Test both URLs

## 📊 Monitoring

### **Health Check Endpoints:**
- `https://kryvextrading.com/api/health`
- `https://kryvextrading.com/api/test`

### **Expected Health Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-08-04T...",
  "buildPath": "/app/frontend/dist",
  "buildExists": true,
  "indexExists": true,
  "environment": "production"
}
```

## 🎯 Final Checklist

- [ ] CNAME records added in GoDaddy
- [ ] Custom domains added in Render
- [ ] DNS propagation verified
- [ ] SSL certificate provisioned
- [ ] Both www and non-www working
- [ ] Health endpoint responding
- [ ] Application loading correctly

## 📞 Support

If you encounter issues:
1. Check Render deployment logs
2. Verify DNS configuration
3. Test health endpoints
4. Contact Render support if needed

## 🚀 Success Indicators

Once properly configured, you should see:
- ✅ `https://kryvextrading.com` loads your app
- ✅ `https://www.kryvextrading.com` loads your app
- ✅ SSL certificate is active (green lock)
- ✅ Health endpoint returns status "ok"
- ✅ All application features work correctly

---

**Note:** DNS changes can take up to 48 hours to fully propagate globally. Be patient and test periodically. 