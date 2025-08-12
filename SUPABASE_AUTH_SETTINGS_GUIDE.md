# Supabase Authentication Settings Guide

## 🔍 **Issue Diagnosis**
Since Google login works but email/password doesn't, the problem is in the **Supabase Authentication Settings**.

## 🛠️ **Step-by-Step Fix**

### **Step 1: Run SQL Fix**
First, run this in your **Supabase SQL Editor**:
```sql
-- Copy and paste the entire FIX_EMAIL_AUTHENTICATION.sql file
```

### **Step 2: Check Supabase Dashboard Settings**

#### **2.1 Go to Authentication Settings**
1. **Open your Supabase Dashboard**
2. **Select your project** (`ftkeczodadvtnxofrwps`)
3. **Navigate to**: `Authentication` → `Settings`

#### **2.2 Enable Email Authentication**
In the **Authentication Settings** page:

✅ **Enable Email Signup**
- Check that "Enable email signup" is **ON**
- Check that "Enable email confirmations" is **OFF** (for testing)

✅ **Enable Email Login**
- Check that "Enable email login" is **ON**
- Check that "Enable password reset" is **ON**

✅ **Email Templates**
- Verify email templates are configured
- Check that "Confirm signup" template exists

#### **2.3 Check Provider Settings**
In the **Providers** section:

✅ **Email Provider**
- **Enable Email**: Should be **ON**
- **Confirm Email**: Should be **OFF** (for testing)
- **Secure Email Change**: Should be **ON**

✅ **Google Provider**
- **Enable Google**: Should be **ON** (this is working)
- **Client ID**: Should be configured
- **Client Secret**: Should be configured

#### **2.4 Check URL Configuration**
In the **URL Configuration** section:

✅ **Site URL**
- Should be: `https://kryvex-frontend.onrender.com` (or your frontend URL)

✅ **Redirect URLs**
- Should include: `https://kryvex-frontend.onrender.com/auth`
- Should include: `https://kryvex-frontend.onrender.com/dashboard`
- Should include: `https://kryvex-frontend.onrender.com/admin`

### **Step 3: Test the Fix**

After making these changes:

1. **Wait 2-3 minutes** for settings to propagate
2. **Try logging in** with:
   - Email: `admin@kryvex.com`
   - Password: `Kryvex.@123`

## 🚨 **Common Issues & Solutions**

### **Issue: "Email not confirmed"**
**Solution**: 
- Run the SQL fix script
- Turn OFF "Enable email confirmations" temporarily

### **Issue: "Invalid login credentials"**
**Solution**:
- Check that email authentication is enabled
- Verify the admin user exists and password is correct

### **Issue: "Provider not enabled"**
**Solution**:
- Enable Email provider in Authentication → Providers
- Check that Email signup is enabled

### **Issue: CORS errors**
**Solution**:
- Add your frontend URL to Site URL and Redirect URLs
- Check that URLs match exactly

## ✅ **Expected Results**

After following these steps:
- ✅ **Email login works**
- ✅ **Google login continues to work**
- ✅ **Admin user can login**
- ✅ **Regular users can register/login**

## 🔧 **If Still Not Working**

If email authentication still doesn't work after these steps:

1. **Check browser console** for specific error messages
2. **Verify environment variables** are loaded correctly
3. **Test with a simple email/password** (not admin)
4. **Check Supabase project status** (not paused)

The key is that **Google OAuth works**, which means Supabase is functioning correctly. The issue is specifically with **email authentication configuration**.
