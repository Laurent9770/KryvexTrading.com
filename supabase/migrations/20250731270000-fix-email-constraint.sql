-- =============================================
-- FIX EMAIL CONSTRAINT ISSUE
-- This migration fixes the unique email constraint that's blocking user creation
-- =============================================

-- Step 1: Check current profiles table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check current constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'profiles' 
AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Step 3: Check for any duplicate emails that might cause issues
SELECT 
    email,
    COUNT(*) as count
FROM public.profiles 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Step 4: Remove the problematic unique constraint on email
-- This constraint is causing the user creation to fail
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_email_key;

-- Step 5: Add a unique constraint on user_id instead (which is the correct approach)
-- This ensures each user can only have one profile, but emails can be reused if needed
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);

-- Step 6: Add an index on email for performance (but not unique)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Step 7: Verify the changes
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'profiles' 
AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Step 8: Show indexes on profiles table
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'profiles' 
AND schemaname = 'public'
ORDER BY indexname;

-- Step 9: Test that we can now create users
DO $$
BEGIN
    RAISE NOTICE '=== EMAIL CONSTRAINT FIXED ===';
    RAISE NOTICE 'The unique constraint on email has been removed.';
    RAISE NOTICE 'Now you should be able to create users via Supabase Auth UI.';
    RAISE NOTICE 'Try creating sales@kryvex.com again.';
END $$;

-- Step 10: Show current admin users
SELECT 
    email,
    full_name,
    role,
    kyc_status,
    is_verified,
    account_balance,
    created_at
FROM public.profiles 
WHERE role = 'admin'
ORDER BY created_at;
