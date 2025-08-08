# Supabase Authentication Setup Guide

## 🔧 **Step 1: Apply Database Schema**

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the contents of `supabase/auth_schema.sql`**
4. **Click "Run" to execute the SQL**

This will create:
- ✅ `users` table with proper structure
- ✅ Row Level Security (RLS) policies
- ✅ Automatic trigger for user profile creation
- ✅ Performance indexes

## 🔧 **Step 2: Configure Authentication**

1. **Go to Authentication > Settings**
2. **Enable Email Sign-up** (if not already enabled)
3. **Configure your site URL** (e.g., `http://localhost:5173`)
4. **Add redirect URLs** for your app

## 🔧 **Step 3: Environment Variables**

Make sure your `.env` file has:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🔧 **Step 4: Test the Setup**

1. **Start your development server:**
   ```bash
   cd frontend && npm run dev
   ```

2. **Go to `/auth` in your browser**

3. **Register a new user** with:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john.doe@example.com`
   - Password: `SecurePass123!`

4. **Check Supabase Dashboard:**
   - Go to **Authentication > Users** - should show the new user
   - Go to **Table Editor > users** - should show the user profile

## 🔧 **Step 5: Verify Real Data**

After registration, you should see:
- ✅ **Real user name** in the sidebar
- ✅ **Real email** instead of mock data
- ✅ **Proper KYC status** (unverified by default)
- ✅ **No more "Mock User"** anywhere in the app

## 🐛 **Troubleshooting**

### **If registration fails:**
1. Check browser console for errors
2. Verify environment variables are correct
3. Ensure Supabase project is active
4. Check RLS policies are applied correctly

### **If user data doesn't load:**
1. Check the trigger function exists
2. Verify the `users` table was created
3. Check browser console for auth state logs

### **If you still see mock data:**
1. Clear browser localStorage
2. Hard refresh the page (Ctrl+F5)
3. Check that the new auth service is being used

## 📋 **Database Schema Overview**

```sql
-- Users table structure
users (
  id UUID PRIMARY KEY,           -- References auth.users(id)
  email TEXT NOT NULL,           -- User's email
  first_name TEXT,               -- User's first name
  last_name TEXT,                -- User's last name
  phone TEXT,                    -- User's phone number
  kyc_status TEXT DEFAULT 'unverified', -- KYC verification status
  created_at TIMESTAMPTZ DEFAULT NOW()  -- Account creation date
)
```

## 🔐 **Security Features**

- ✅ **Row Level Security (RLS)** enabled
- ✅ **Users can only access their own data**
- ✅ **Automatic profile creation** via trigger
- ✅ **Proper authentication flow** with Supabase Auth

## 🎯 **Next Steps**

After successful setup:
1. **Test login/logout functionality**
2. **Verify user data persistence**
3. **Test profile updates**
4. **Implement KYC verification flow**
5. **Add admin user management**

---

**Need help?** Check the browser console for debug logs and ensure all environment variables are set correctly.
