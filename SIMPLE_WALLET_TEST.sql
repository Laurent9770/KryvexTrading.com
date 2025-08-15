-- =============================================
-- SIMPLE WALLET TEST
-- Basic test to see what's in the database
-- =============================================

-- Check if user exists
SELECT 
    'User Check' as test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'jeanlaurentkoterumutima@gmail.com') 
        THEN '✅ User exists' 
        ELSE '❌ User not found' 
    END as result;

-- Get user ID
SELECT 
    'User ID' as test,
    id as user_id,
    email
FROM auth.users 
WHERE email = 'jeanlaurentkoterumutima@gmail.com';

-- Check user_wallets table structure
SELECT 
    'Table Structure' as test,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_wallets'
ORDER BY ordinal_position;

-- Count wallet entries for user
SELECT 
    'Wallet Count' as test,
    COUNT(*) as total_entries
FROM public.user_wallets 
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'jeanlaurentkoterumutima@gmail.com'
);

-- Show all wallet entries
SELECT 
    'Wallet Data' as test,
    wallet_type,
    asset,
    balance,
    available_balance,
    updated_at
FROM public.user_wallets 
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'jeanlaurentkoterumutima@gmail.com'
)
ORDER BY wallet_type, asset;

-- Check RLS status
SELECT 
    'RLS Status' as test,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ENABLED' 
        ELSE '❌ RLS DISABLED' 
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_wallets';

-- Check permissions
SELECT 
    'Permissions' as test,
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'user_wallets'
AND grantee = 'authenticated';

-- Test function existence
SELECT 
    'Function Check' as test,
    routine_name,
    CASE 
        WHEN routine_name IS NOT NULL THEN '✅ Function exists'
        ELSE '❌ Function missing'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_user_wallet_summary';

-- Test function permissions
SELECT 
    'Function Permissions' as test,
    grantee,
    privilege_type
FROM information_schema.routine_privileges 
WHERE routine_schema = 'public' 
AND routine_name = 'get_user_wallet_summary'
AND grantee = 'authenticated';
