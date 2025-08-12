# Admin Database Setup Guide

This guide provides step-by-step instructions to set up all the necessary database tables, policies, and functions for the admin dashboard functionality in Supabase.

## 📋 Prerequisites

1. **Supabase Project**: You must have a Supabase project set up
2. **Database Access**: Access to run SQL commands in your Supabase SQL Editor
3. **User Account**: At least one user account created in Supabase Auth

## 🚀 Step-by-Step Setup

### Step 1: Run the Base Tables Migration

First, run the base tables migration to ensure all required tables exist:

```sql
-- Run this in Supabase SQL Editor
-- File: supabase/migrations/20250731080000-fix-admin-dashboard-tables.sql
```

This migration will:
- ✅ Add missing columns to `profiles` table (`kyc_status`, `account_balance`, `is_verified`)
- ✅ Add missing columns to `trades` table (`result`, `profit_loss`, `completed_at`)
- ✅ Create `user_wallets` table
- ✅ Create `withdrawal_requests` table
- ✅ Create `deposits` table
- ✅ Create `admin_actions` table
- ✅ Enable Row Level Security (RLS)
- ✅ Create basic RLS policies
- ✅ Create performance indexes

### Step 2: Run the Admin Functions Migration

Next, run the admin functions and policies migration:

```sql
-- Run this in Supabase SQL Editor
-- File: supabase/migrations/20250731090000-admin-functions-and-policies.sql
```

This migration will:
- ✅ Create admin role management functions (`has_role`, `is_admin`)
- ✅ Add `role` column to `profiles` table
- ✅ Create admin dashboard statistics function
- ✅ Create user trading statistics function
- ✅ Create KYC status update function
- ✅ Create user balance adjustment function
- ✅ Create withdrawal request processing function
- ✅ Create deposit processing function
- ✅ Create admin dashboard view
- ✅ Set up enhanced RLS policies for admin access
- ✅ Grant all necessary permissions

### Step 3: Set Up Admin User

After running the migrations, you need to promote a user to admin:

```sql
-- Run this in Supabase SQL Editor
-- File: supabase/migrations/20250731100000-setup-admin-user.sql
```

Then promote your user to admin:

```sql
-- Replace 'your-email@example.com' with the actual email of the user you want to make admin
SELECT public.promote_to_admin('your-email@example.com');
```

## 🔧 Database Functions Available

After setup, the following functions will be available:

### Admin Role Management
- `public.has_role(user_id, role_name)` - Check if user has specific role
- `public.is_admin(user_id)` - Check if user is admin
- `public.promote_to_admin(email)` - Promote user to admin
- `public.demote_from_admin(email)` - Demote admin to user

### Admin Dashboard Functions
- `public.get_admin_dashboard_stats()` - Get overall dashboard statistics
- `public.get_user_trading_stats(user_id)` - Get specific user's trading stats

### Admin Actions
- `public.update_kyc_status(user_id, status, notes)` - Update user KYC status
- `public.adjust_user_balance(user_id, amount, operation, reason)` - Adjust user balance
- `public.process_withdrawal_request(request_id, status, notes)` - Process withdrawal requests
- `public.process_deposit(deposit_id, status, notes)` - Process deposits

## 📊 Database Views Available

- `public.admin_dashboard_view` - Complete admin dashboard data
- `public.admin_users_view` - List of all admin users

## 🔒 Row Level Security (RLS) Policies

The following RLS policies are automatically created:

### Profiles Table
- Users can view their own profile
- Admins can view all profiles
- Admins can update all profiles

### Trades Table
- Users can view their own trades
- Admins can view all trades
- Admins can update all trades

### User Wallets Table
- Users can view their own wallet
- Admins can view all wallets

### Withdrawal Requests Table
- Users can view their own requests
- Users can create requests
- Admins can manage all requests

### Deposits Table
- Users can view their own deposits
- Users can create deposits
- Admins can manage all deposits

### Admin Actions Table
- Only admins can view and create admin actions

## 🧪 Testing the Setup

After running all migrations, you can test the setup:

### 1. Check Admin Functions
```sql
-- Check if admin functions exist
SELECT proname FROM pg_proc 
WHERE proname IN ('has_role', 'is_admin', 'get_admin_dashboard_stats', 'update_kyc_status', 'adjust_user_balance');
```

### 2. Check Admin Users
```sql
-- View all admin users
SELECT * FROM public.admin_users_view;
```

### 3. Check Dashboard Stats
```sql
-- Get admin dashboard statistics
SELECT public.get_admin_dashboard_stats();
```

### 4. Check RLS Policies
```sql
-- View all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

## 🔍 Verification Commands

Run these commands to verify everything is working:

```sql
-- Check admin users count
SELECT COUNT(*) as admin_count FROM public.profiles WHERE role = 'admin';

-- Check regular users count
SELECT COUNT(*) as user_count FROM public.profiles WHERE role = 'user';

-- Check function count
SELECT COUNT(*) as function_count FROM pg_proc 
WHERE proname IN ('has_role', 'is_admin', 'get_admin_dashboard_stats', 'update_kyc_status', 'adjust_user_balance');

-- Check policy count
SELECT COUNT(*) as policy_count FROM pg_policies WHERE schemaname = 'public';
```

## 🚨 Important Notes

### Security
- All admin functions use `SECURITY DEFINER` to ensure proper permissions
- RLS policies ensure users can only access their own data
- Admin actions are logged for audit purposes

### Performance
- Indexes are created for optimal query performance
- Views are used to aggregate data efficiently
- Functions are optimized for minimal database load

### Maintenance
- Admin actions are automatically logged in `admin_actions` table
- All functions include proper error handling
- Database changes are tracked through migrations

## 🆘 Troubleshooting

### Common Issues

1. **"Function not found" errors**
   - Ensure all migrations have been run in order
   - Check that functions were created successfully

2. **"Permission denied" errors**
   - Verify RLS policies are in place
   - Check that user has proper role assigned

3. **"Admin user not working"**
   - Ensure user was promoted using `promote_to_admin` function
   - Check that user exists in `profiles` table

### Debug Commands

```sql
-- Check user roles
SELECT email, role FROM public.profiles WHERE email = 'your-email@example.com';

-- Check admin functions
SELECT proname, prosrc FROM pg_proc WHERE proname LIKE '%admin%';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

## 📞 Support

If you encounter any issues:

1. Check the Supabase logs in your project dashboard
2. Verify all migrations have been run successfully
3. Ensure your user account exists and has been promoted to admin
4. Check that RLS policies are properly configured

## ✅ Success Checklist

After completing the setup, verify:

- [ ] All migrations run without errors
- [ ] Admin user can log in and access admin dashboard
- [ ] Admin can view all user data
- [ ] Admin can update KYC status
- [ ] Admin can adjust user balances
- [ ] Admin can process withdrawal requests
- [ ] Admin can process deposits
- [ ] Admin actions are being logged
- [ ] Regular users cannot access admin functions
- [ ] RLS policies are working correctly

Once all items are checked, your admin functionality is ready to use! 🎉
