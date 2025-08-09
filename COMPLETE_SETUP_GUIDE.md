# 🚀 Kryvex Trading Platform - Complete Setup Guide

This guide provides step-by-step instructions to set up the complete Kryvex Trading Platform with all required database tables, policies, and configurations.

## 📋 Prerequisites

- Supabase project created and accessible
- Node.js 18+ installed
- Git repository cloned

## 🗄️ Database Setup

### 1. Apply Complete Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/complete_schema.sql`
4. Paste and run the SQL script

This will create:
- ✅ All required tables (users, profiles, trades, wallets, etc.)
- ✅ RLS policies for security
- ✅ Triggers and functions
- ✅ Initial data (trading pairs, staking pools)
- ✅ Proper indexes for performance

### 2. Storage Setup

1. Go to **Storage** in Supabase dashboard
2. Create buckets:
   - `kyc-documents` (for KYC verification files)
   - `profile-images` (for user profile pictures)
3. Apply storage policies from `supabase/storage_policies.sql`

### 3. Authentication Setup

1. Go to **Authentication → Settings**
2. Configure providers:

#### Email Settings:
- ✅ Enable Email provider
- ✅ Enable Email confirmations (optional)
- Set custom SMTP (optional)

#### Google OAuth Setup:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - `https://ftkeczodadvtnxofrwps.supabase.co/auth/v1/callback`
   - `https://your-domain.com/auth/callback`
4. Copy Client ID and Secret to Supabase **Authentication → Providers → Google**

#### Phone/SMS Setup (Optional):
- Configure phone provider in Supabase
- Add Textlocal or other SMS provider credentials

### 4. Site URL Configuration

In **Authentication → Settings**:
- Site URL: `https://your-domain.com`
- Redirect URLs:
  - `https://your-domain.com/auth/callback`
  - `https://your-domain.com/**`
  - `http://localhost:3000/**` (for development)

## 🔧 Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Variables

Create `frontend/.env`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://ftkeczodadvtnxofrwps.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg

# API Configuration
VITE_API_URL=https://kryvextrading-com.onrender.com

# Textlocal SMS (Optional)
VITE_TEXTLOCAL_API_KEY=aky_313RjxSQGXb9yNSAyxytYMU2dSo
VITE_TEXTLOCAL_SENDER=Kryvextrading
```

### 3. Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🌐 Deployment

### Render.com Deployment

1. Connect your GitHub repository to Render
2. Create a **Static Site** service
3. Configure build settings:
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Root Directory**: `/` (or leave empty)

4. Add environment variables in Render dashboard:
   ```
   VITE_SUPABASE_URL=https://ftkeczodadvtnxofrwps.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg
   VITE_API_URL=https://kryvextrading-com.onrender.com
   ```

5. Deploy and test

## ✅ Testing & Verification

### 1. Database Verification

Run this query in Supabase SQL Editor to verify setup:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if policies are enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Check initial data
SELECT symbol, current_price FROM trading_pairs LIMIT 5;
SELECT name, apy_rate FROM staking_pools LIMIT 5;
```

### 2. Frontend Verification

1. Visit your deployed site
2. Check Supabase client test panel shows all green ✅
3. Test registration with a new email
4. Test Google OAuth (should redirect properly)
5. Check browser console for any errors

### 3. Authentication Flow Test

1. **Registration**:
   - Fill out registration form
   - Should create user in database
   - Should redirect to dashboard

2. **Login**:
   - Use registered credentials
   - Should authenticate successfully

3. **Google OAuth**:
   - Click "Continue with Google"
   - Should redirect to Google
   - Should return and authenticate

## 🔒 Security Checklist

- ✅ RLS enabled on all tables
- ✅ Policies restrict access to user's own data
- ✅ Admin functions require admin role
- ✅ Sensitive data not exposed to frontend
- ✅ Storage buckets have proper policies
- ✅ Environment variables are secure

## 🐛 Common Issues & Solutions

### Issue: "Supabase client failed to initialize"
**Solution**: 
- Verify environment variables are set correctly in Render
- Clear build cache and redeploy
- Check browser console for detailed errors

### Issue: "Cannot read properties of undefined (reading 'headers')"
**Solution**:
- Ensure only one version of `@supabase/supabase-js` is installed
- Run `npm ls @supabase/supabase-js` to check
- Delete `node_modules` and reinstall if needed

### Issue: Google OAuth redirects to landing page
**Solution**:
- Verify redirect URLs in Google Cloud Console
- Check Supabase auth settings
- Ensure `/auth/callback` route exists and works

### Issue: Database permission errors
**Solution**:
- Verify RLS policies are applied correctly
- Check user roles in `user_roles` table
- Ensure functions have proper SECURITY DEFINER

## 📞 Support

For issues or questions:
- Check browser console for detailed error messages
- Verify all environment variables are set
- Test database connectivity in Supabase dashboard
- Review Render deployment logs

## 🎉 Success!

If all tests pass, your Kryvex Trading Platform is ready for production use with:
- ✅ Complete user authentication system
- ✅ KYC verification workflow
- ✅ Trading functionality
- ✅ Wallet management
- ✅ Admin dashboard
- ✅ Real-time chat and notifications
- ✅ Staking and rewards system
