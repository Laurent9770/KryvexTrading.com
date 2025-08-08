# Production Setup Guide - Render.com Deployment

## 🌐 **Production URL**
Your Kryvex Trading Platform is deployed at: [https://kryvex-frontend.onrender.com](https://kryvex-frontend.onrender.com)

## 🔧 **Step 1: Supabase Dashboard Configuration**

### **Authentication Settings**
1. **Go to Supabase Dashboard > Authentication > Settings**
2. **Update Site URL:** `https://kryvex-frontend.onrender.com`
3. **Add Redirect URLs:**
   ```
   https://kryvex-frontend.onrender.com/auth
   https://kryvex-frontend.onrender.com/dashboard
   https://kryvex-frontend.onrender.com/
   https://kryvex-frontend.onrender.com
   ```

### **Email Templates (Optional)**
1. **Go to Authentication > Email Templates**
2. **Customize the confirmation email** with your branding
3. **Test the email flow** with a real email address

## 🔧 **Step 2: Apply Database Schema**

1. **Go to Supabase Dashboard > SQL Editor**
2. **Copy and paste the contents of `supabase/auth_schema.sql`**
3. **Click "Run" to execute the SQL**

This creates:
- ✅ `users` table with proper structure
- ✅ Row Level Security (RLS) policies
- ✅ Automatic trigger for user profile creation
- ✅ Performance indexes

## 🔧 **Step 3: Render.com Environment Variables**

### **In your Render.com dashboard:**
1. **Go to your service settings**
2. **Navigate to Environment Variables**
3. **Add these variables:**

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
NODE_ENV=production
```

### **To find your Supabase credentials:**
1. **Go to Supabase Dashboard > Settings > API**
2. **Copy the Project URL** (for `VITE_SUPABASE_URL`)
3. **Copy the anon public key** (for `VITE_SUPABASE_ANON_KEY`)

## 🔧 **Step 4: Test Production Authentication**

### **Test Registration:**
1. **Go to** [https://kryvex-frontend.onrender.com/auth](https://kryvex-frontend.onrender.com/auth)
2. **Click "Sign Up" tab**
3. **Register with real information:**
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john.doe@example.com`
   - Password: `SecurePass123!`
   - Phone: `+1234567890`

### **Verify in Supabase Dashboard:**
1. **Go to Authentication > Users** - should show the new user
2. **Go to Table Editor > users** - should show the user profile
3. **Check the user's metadata** in the auth.users table

## 🔧 **Step 5: Production Security Checklist**

### **✅ Supabase Security:**
- [ ] Row Level Security (RLS) enabled on `users` table
- [ ] Email confirmation enabled (optional)
- [ ] CAPTCHA protection enabled
- [ ] Rate limiting configured

### **✅ Render.com Security:**
- [ ] Environment variables are set correctly
- [ ] HTTPS is enabled (automatic on Render)
- [ ] Build process is working correctly

### **✅ Application Security:**
- [ ] No mock data in production
- [ ] Real user authentication working
- [ ] Proper error handling
- [ ] Secure logout functionality

## 🧪 **Testing Production Features**

### **Test User Registration:**
```bash
# Expected behavior:
1. User fills registration form
2. Supabase creates auth user
3. Database trigger creates user profile
4. User is redirected to dashboard
5. Real user data appears in sidebar
```

### **Test User Login:**
```bash
# Expected behavior:
1. User enters credentials
2. Supabase authenticates user
3. User profile loads from database
4. User sees real data in dashboard
```

### **Test User Logout:**
```bash
# Expected behavior:
1. User clicks logout
2. Supabase session is cleared
3. User is redirected to landing page
4. No user data remains in app
```

## 🐛 **Production Troubleshooting**

### **If registration fails:**
1. **Check browser console** for errors
2. **Verify Supabase credentials** in environment variables
3. **Check Supabase project** is active and not paused
4. **Verify redirect URLs** are set correctly

### **If user data doesn't load:**
1. **Check the database trigger** exists and works
2. **Verify the `users` table** was created correctly
3. **Check RLS policies** are applied
4. **Look at browser console** for auth state logs

### **If you see mock data:**
1. **Clear browser data** and hard refresh
2. **Check environment variables** are set correctly
3. **Verify the new auth service** is being used
4. **Check build process** on Render.com

## 📊 **Monitoring Production**

### **Supabase Dashboard:**
- **Authentication > Users** - Monitor user registrations
- **Table Editor > users** - Check user profiles
- **Logs** - Monitor authentication events

### **Render.com Dashboard:**
- **Logs** - Monitor application errors
- **Metrics** - Track performance
- **Deployments** - Monitor build status

## 🎯 **Next Steps After Production Setup**

1. **Test all authentication flows** thoroughly
2. **Implement KYC verification** system
3. **Add admin user management** features
4. **Set up monitoring and alerts**
5. **Configure backup and recovery** procedures

---

**Production URL:** [https://kryvex-frontend.onrender.com](https://kryvex-frontend.onrender.com)

**Need help?** Check the browser console for debug logs and ensure all environment variables are set correctly in your Render.com dashboard. 