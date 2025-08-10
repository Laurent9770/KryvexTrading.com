# Supabase Policy Issues and Fixes Summary

## Issues Found

### 1. **Critical SQL Errors**
- **Error**: `ERROR: 42703: column "role" does not exist`
- **Cause**: Policies were referencing a `role` column in the `profiles` table that doesn't exist
- **Fix**: Replaced all `role` column references with proper `user_roles` table queries

### 2. **Missing Policies**
- **Issue**: Several tables lacked proper INSERT policies for user registration
- **Fix**: Added `INSERT` policies for `profiles` table to allow user registration

### 3. **Inconsistent Role Checking**
- **Issue**: Some policies used `has_role()` function while others used direct queries
- **Fix**: Standardized all admin role checks to use `EXISTS` queries with `user_roles` table

### 4. **Storage Policy Issues**
- **Issue**: KYC document storage policies had incorrect admin role checking
- **Fix**: Updated storage policies to use proper role verification

### 5. **Missing Table Policies**
- **Issue**: Some tables like `deposits` and `trade_outcome_logs` had no policies
- **Fix**: Added conditional policies that check if tables exist before creating policies

## Tables Covered

### Core Tables
- ✅ `profiles` - User profile information
- ✅ `user_roles` - User role assignments
- ✅ `kyc_documents` - KYC verification documents
- ✅ `trading_pairs` - Available trading pairs
- ✅ `trades` - User trading history
- ✅ `transactions` - Financial transactions
- ✅ `support_tickets` - Customer support tickets
- ✅ `support_messages` - Support ticket messages
- ✅ `notifications` - User notifications

### Admin Tables
- ✅ `admin_actions` - Admin action audit trail
- ✅ `admin_notifications` - Admin-created notifications
- ✅ `wallet_adjustments` - Manual balance adjustments
- ✅ `user_sessions` - User session tracking
- ✅ `trade_outcome_logs` - Trade outcome control logs

### Storage
- ✅ `storage.objects` - File storage (KYC documents, profile images)

## Policy Types Implemented

### User Policies
- **SELECT**: Users can view their own data
- **INSERT**: Users can create their own records
- **UPDATE**: Users can update their own data (with restrictions)
- **DELETE**: Users can delete their own data (where applicable)

### Admin Policies
- **SELECT**: Admins can view all data
- **INSERT**: Admins can create records for any user
- **UPDATE**: Admins can modify any user's data
- **DELETE**: Admins can delete any data (where applicable)

### Public Policies
- **SELECT**: Public access to non-sensitive data (trading pairs, etc.)

## Security Features

### 1. **Row-Level Security (RLS)**
- All tables have RLS enabled
- Policies enforce data isolation between users

### 2. **Role-Based Access Control**
- Admin role verification using `user_roles` table
- Proper separation between user and admin permissions

### 3. **Data Validation**
- Transaction type restrictions (deposit/withdrawal only)
- KYC document status restrictions (pending only for updates)
- File type restrictions for storage uploads

### 4. **Audit Trail**
- Admin actions are logged
- User sessions are tracked
- Trade outcome changes are recorded

## Key Fixes Applied

### 1. **Fixed Role Column References**
```sql
-- BEFORE (BROKEN)
WHERE user_id = auth.uid() AND role = 'admin'

-- AFTER (FIXED)
WHERE EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role = 'admin'
)
```

### 2. **Added Missing INSERT Policies**
```sql
-- Added for user registration
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 3. **Fixed Storage Policies**
```sql
-- Fixed admin access to KYC documents
CREATE POLICY "Admins can view all KYC documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);
```

### 4. **Conditional Table Policies**
```sql
-- Only creates policies if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'deposits') THEN
    -- Create policies for deposits table
  END IF;
END $$;
```

## Verification Queries

The fix script includes verification queries to:
- List all created policies
- Verify storage policies
- Check for any remaining issues

## Usage Instructions

1. **Run the Fix Script**:
   ```sql
   -- Execute SUPABASE_POLICIES_FIX.sql in your Supabase SQL editor
   ```

2. **Verify the Fixes**:
   ```sql
   -- Check all policies
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```

3. **Test Functionality**:
   - Test user registration
   - Test admin dashboard access
   - Test KYC document upload
   - Test trading functionality

## Benefits of These Fixes

1. **Eliminates SQL Errors**: No more `column "role" does not exist` errors
2. **Complete Coverage**: All tables now have proper policies
3. **Security**: Proper data isolation and access control
4. **Admin Functionality**: Full admin dashboard access restored
5. **User Experience**: Smooth registration and data access
6. **Maintainability**: Consistent policy structure across all tables

## Next Steps

After applying these fixes:
1. Test all user flows (registration, login, trading, KYC)
2. Test all admin flows (dashboard, user management, support)
3. Monitor for any remaining policy-related errors
4. Consider adding additional policies for new features as needed
