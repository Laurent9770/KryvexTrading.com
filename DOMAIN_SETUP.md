# 🌐 Custom Domain Setup Guide for kryvextrading.com

## 📋 Overview
This guide will help you configure your custom domain `kryvextrading.com` purchased on GoDaddy to work with your Render deployment.

## 🚀 Step-by-Step Configuration

### **Step 1: Get Your Render App URL**
Your Render app is deployed at: `https://kryvex-frontend.onrender.com`

### **Step 2: Configure DNS in GoDaddy**

#### **2.1 Access GoDaddy DNS Settings**
1. Log into your GoDaddy account at [godaddy.com](https://godaddy.com)
2. Go to "My Products" → "Domains"
3. Find `kryvextrading.com` and click "Manage"
4. Click on the "DNS" tab

#### **2.2 Add DNS Records**
Add these DNS records:

**Record 1 - Root Domain (A Record):**
```
Type: A
Name: @ (or leave blank)
Value: 216.24.57.1
TTL: 1 Hour
```

**Record 2 - www Subdomain (CNAME Record):**
```
Type: CNAME
Name: www
Value: kryvex-frontend.onrender.com
TTL: 1 Hour
```

**Alternative for Root Domain (if A record doesn't work):**
```
Type: ANAME or ALIAS
Name: @ (or leave blank)
Value: kryvex-frontend.onrender.com
TTL: 1 Hour
```

### **Step 3: Configure Custom Domain in Render**

#### **3.1 Access Render Dashboard**
1. Go to [render.com](https://render.com)
2. Log into your account
3. Find your "kryvex-frontend" service

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

### **Step 4: Verify Domain Ownership**
After adding DNS records:
1. Wait 1-2 hours for DNS propagation
2. Go back to Render dashboard
3. Click "Verify" button next to each domain
4. Status should change from "DNS update needed" to "Active"

### **Step 5: SSL Certificate**
Render will automatically provision SSL certificates for your custom domain. This may take 24-48 hours.

### **Step 6: Verify Configuration**

#### **6.1 Test DNS Propagation**
Use these tools to check DNS propagation:
- [whatsmydns.net](https://whatsmydns.net)
- [dnschecker.org](https://dnschecker.org)

#### **6.2 Test Your Domain**
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
- Verify DNS records are correct
- Check Render service is running
- Test with health endpoint: `https://kryvextrading.com/api/health`

#### **4. www vs non-www Issues**
- Ensure both records are added in GoDaddy
- Configure both domains in Render
- Test both URLs

#### **5. Verification Failing**
- Double-check DNS record values
- Ensure TTL is set to 1 hour or less
- Wait for DNS propagation before verifying

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

- [ ] A record added for root domain (216.24.57.1)
- [ ] CNAME record added for www subdomain (kryvex-frontend.onrender.com)
- [ ] Custom domains added in Render dashboard
- [ ] DNS propagation verified
- [ ] Domain ownership verified in Render
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

## 🔍 Current Status

Based on your Render dashboard:
- ✅ Custom domains added: `kryvextrading.com` and `www.kryvextrading.com`
- ⏳ Waiting for DNS verification
- ⏳ SSL certificate provisioning in progress

---

**Note:** DNS changes can take up to 48 hours to fully propagate globally. Be patient and test periodically. 