# 🧪 Kryvex Trading Platform - Testing Guide

## ✅ AUTHENTICATION TESTS

### 1. Email Signup Test
**Steps:**
1. Go to `/auth` page
2. Click "Sign Up" tab
3. Fill in:
   - First Name: `Test`
   - Last Name: `User`
   - Email: `test@example.com`
   - Phone: `+1234567890`
   - Password: `TestPassword123`
   - Confirm Password: `TestPassword123`
4. Click "Sign Up"

**Expected Result:**
- ✅ Success message: "Registration Successful"
- ✅ User should be logged in automatically
- ✅ Redirected to dashboard
- ✅ Console shows: "HTTP SignUp for: test@example.com"

### 2. Email Login Test
**Steps:**
1. Sign out if logged in
2. Go to `/auth` page
3. Use "Email" tab (default)
4. Enter:
   - Email: `test@example.com`
   - Password: `TestPassword123`
5. Click "Sign In"

**Expected Result:**
- ✅ Success message: "Welcome back!"
- ✅ User logged in
- ✅ Redirected to dashboard
- ✅ Console shows: "HTTP SignIn for: test@example.com"

### 3. Google OAuth Test
**Steps:**
1. Sign out if logged in
2. Go to `/auth` page
3. Click "Continue with Google"
4. Complete Google authentication

**Expected Result:**
- ✅ Redirected to Google login
- ✅ After Google auth, redirected back to app
- ✅ User logged in with Google account
- ✅ Dashboard shows Google user info
- ✅ Console shows: "OAuth authentication successful"

## 🔧 DATABASE SCHEMA SETUP

### Run the Production Schema
**Steps:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `PRODUCTION_SCHEMA.sql`
3. Run the SQL script
4. Verify tables are created:
   - `profiles`
   - `user_roles`
   - `trading_pairs`
   - `trades`
   - `transactions`
   - `kyc_submissions`
   - And 10+ other tables

**Expected Result:**
- ✅ All tables created successfully
- ✅ RLS policies applied
- ✅ Triggers created for user profile creation
- ✅ Sample trading pairs inserted
- ✅ No more 404 errors in console

## 💰 TRADING FEATURES TEST

### 1. Dashboard Test
**Steps:**
1. Login successfully
2. Navigate to `/dashboard`

**Expected Result:**
- ✅ Account balance displayed
- ✅ Trading pairs with real prices
- ✅ No console errors
- ✅ All widgets loading properly

### 2. Trading Page Test
**Steps:**
1. Navigate to `/trading`
2. Try to place a test trade

**Expected Result:**
- ✅ Trading interface loads
- ✅ Market data displays
- ✅ Can interact with trading controls
- ✅ Authentication preserved

### 3. Wallet Test
**Steps:**
1. Navigate to `/wallet`
2. Check wallet balance and transactions

**Expected Result:**
- ✅ Wallet page loads
- ✅ Balance information displayed
- ✅ Transaction history (if any)

## 🛠️ TROUBLESHOOTING

### If Authentication Fails:
1. Check browser console for HTTP errors
2. Verify Supabase credentials in `httpClient.ts`
3. Check if OAuth redirect URLs are configured in Supabase

### If Database Errors Persist:
1. Ensure `PRODUCTION_SCHEMA.sql` was run successfully
2. Check Supabase logs for RLS policy errors
3. Verify user has proper permissions

### If OAuth Fails:
1. Check Google OAuth configuration in Supabase
2. Verify redirect URLs match exactly
3. Check browser console for OAuth token extraction

## 🎯 SUCCESS CRITERIA

### Authentication System ✅
- [x] HTTP-based auth bypassing SDK issues
- [x] Email signup/login working
- [x] Google OAuth working
- [x] Session persistence
- [x] Proper user data handling

### Database Schema ✅
- [x] All necessary tables created
- [x] RLS policies in place
- [x] Triggers for user creation
- [x] No 404 errors

### Trading Platform ✅
- [x] Dashboard loading with user data
- [x] Trading interface accessible
- [x] Market data displaying
- [x] Navigation working

## 📊 MONITORING

### Console Logs to Watch For:
- ✅ `"✅ HTTP SignUp for: email@domain.com"`
- ✅ `"✅ HTTP SignIn for: email@domain.com"`
- ✅ `"✅ OAuth authentication successful"`
- ✅ `"🔍 getSupabaseClient called - returning HTTP client"`
- ✅ `"User session processed"`

### Error Logs to Avoid:
- ❌ `"Cannot read properties of undefined (reading 'headers')"`
- ❌ `"Real Supabase client not available"`
- ❌ `"404 (Not Found)" for database tables`
- ❌ `"Supabase client unavailable"`

---

**🎉 If all tests pass, the Kryvex Trading Platform is ready for production use!**
