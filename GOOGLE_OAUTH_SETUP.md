# 🔍 Google OAuth Setup Guide for Kryvex Trading

This guide will help you set up Google OAuth authentication in your Supabase project.

## 📋 Prerequisites

You need:
- ✅ Google Cloud Console account
- ✅ Supabase project
- ✅ Domain where your app is deployed

---

## 🚀 Step 1: Google Cloud Console Setup

### **1️⃣ Create Google Cloud Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google+ API** (deprecated but needed for OAuth)
4. Enable **People API** (newer alternative)

### **2️⃣ Create OAuth 2.0 Credentials**
1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Configure:

```
Name: Kryvex Trading App
Authorized JavaScript origins:
  - http://localhost:8080 (for development)
  - https://your-app.onrender.com (your production domain)

Authorized redirect URIs:
  - http://localhost:8080/auth/callback
  - https://your-app.onrender.com/auth/callback
  - https://ftkeczodadvtnxofrwps.supabase.co/auth/v1/callback
```

### **3️⃣ Get Your Credentials**
Copy these values:
- **Client ID**: `123456789-abcdef.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxxxxxxx`

---

## 🔧 Step 2: Supabase Configuration

### **1️⃣ Enable Google Provider**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication → Providers**
3. Find **Google** and toggle it **ON**

### **2️⃣ Add Google Credentials**
```
Client ID: 123456789-abcdef.apps.googleusercontent.com
Client Secret: GOCSPX-xxxxxxxxxx
```

### **3️⃣ Add Redirect URLs**
In **Authentication → URL Configuration**:
```
Site URL: https://your-app.onrender.com
Redirect URLs:
  - https://your-app.onrender.com/auth/callback
  - http://localhost:8080/auth/callback
```

---

## 🌐 Step 3: Update Your App

### **1️⃣ Environment Variables**
Update your `.env` file:
```env
VITE_SUPABASE_URL=https://ftkeczodadvtnxofrwps.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg
VITE_GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
```

### **2️⃣ Render Environment Variables**
Add to Render dashboard:
```
VITE_SUPABASE_URL = https://ftkeczodadvtnxofrwps.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GOOGLE_CLIENT_ID = 123456789-abcdef.apps.googleusercontent.com
```

---

## 🧪 Step 4: Test Configuration

### **1️⃣ Test Locally**
```bash
npm run dev
```
1. Go to `http://localhost:8080/auth`
2. Click **Continue with Google**
3. Should redirect to Google OAuth

### **2️⃣ Test Production**
1. Deploy to Render
2. Go to your live site `/auth`
3. Test Google OAuth flow

---

## 🔧 Step 5: Debugging Common Issues

### **❌ "Google sign in failed" Error**
**Cause**: Supabase client not initialized properly
**Fix**: Check console for Supabase connection errors

### **❌ "Invalid client" Error**
**Cause**: Wrong Client ID or unauthorized domain
**Fix**: 
1. Verify Client ID in Supabase matches Google Console
2. Check authorized domains include your site

### **❌ "Redirect URI mismatch" Error**
**Cause**: Redirect URI not whitelisted
**Fix**: Add all possible redirect URIs:
```
https://ftkeczodadvtnxofrwps.supabase.co/auth/v1/callback
https://your-app.onrender.com/auth/callback
http://localhost:8080/auth/callback
```

### **❌ "OAuth consent screen" Error**
**Cause**: Need to configure consent screen
**Fix**: 
1. Go to **OAuth consent screen** in Google Console
2. Set up consent screen with your app details
3. Add test users (for development)

---

## 📱 Step 6: User Flow

### **Successful Flow:**
1. User clicks "Continue with Google"
2. Redirects to Google OAuth
3. User grants permissions
4. Redirects to `/auth/callback`
5. Supabase processes the authentication
6. User is logged in and redirected to dashboard

### **User Data Retrieved:**
```json
{
  "id": "google_user_id",
  "email": "user@gmail.com",
  "user_metadata": {
    "name": "John Doe",
    "picture": "https://lh3.googleusercontent.com/...",
    "email_verified": true
  }
}
```

---

## 🔐 Security Considerations

### **Production Setup:**
1. ✅ Remove `localhost` URLs from production config
2. ✅ Use HTTPS only
3. ✅ Verify email domains if needed
4. ✅ Set up proper OAuth consent screen
5. ✅ Monitor OAuth usage in Google Console

### **Environment Variables:**
- ✅ Never commit credentials to Git
- ✅ Use different Client IDs for dev/prod
- ✅ Rotate secrets regularly

---

## 📞 Support

If you encounter issues:
1. Check [Supabase Auth docs](https://supabase.com/docs/guides/auth/social-login/auth-google)
2. Check [Google OAuth docs](https://developers.google.com/identity/protocols/oauth2)
3. Verify all URLs match exactly
4. Check browser console for detailed errors

Your Google OAuth setup will be ready! 🎉
