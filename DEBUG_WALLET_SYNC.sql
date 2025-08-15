-- =============================================
-- DEBUG WALLET SYNC ISSUES
-- Check why user wallet is still showing $0.00
-- =============================================

-- Step 1: Check if sync functions exist
SELECT '=== CHECKING SYNC FUNCTIONS ===' as info;

SELECT 
    'sync_user_wallet_from_database function' as function_name,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_schema = 'public' AND routine_name = 'sync_user_wallet_from_database'
    ) THEN 'EXISTS' ELSE 'NOT EXISTS' END as status;

SELECT 
    'get_user_wallet_summary function' as function_name,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_schema = 'public' AND routine_name = 'get_user_wallet_summary'
    ) THEN 'EXISTS' ELSE 'NOT EXISTS' END as status;

-- Step 2: Check user data for jeanlaurentkoterumutima@gmail.com
SELECT '=== CHECKING USER DATA ===' as info;

SELECT 
    u.id as user_id,
    u.email,
    u.created_at
FROM auth.users u
WHERE u.email = 'jeanlaurentkoterumutima@gmail.com';

-- Step 3: Check wallet data for this user
SELECT '=== CHECKING WALLET DATA ===' as info;

SELECT 
    uw.user_id,
    uw.wallet_type,
    uw.asset,
    uw.balance,
    uw.created_at,
    uw.updated_at
FROM public.user_wallets uw
JOIN auth.users u ON uw.user_id = u.id
WHERE u.email = 'jeanlaurentkoterumutima@gmail.com'
ORDER BY uw.wallet_type, uw.asset;

-- Step 4: Check if user has any wallet entries at all
SELECT '=== WALLET COUNT FOR USER ===' as info;

SELECT 
    u.email,
    COUNT(uw.id) as wallet_count,
    COALESCE(SUM(uw.balance), 0) as total_balance
FROM auth.users u
LEFT JOIN public.user_wallets uw ON u.id = uw.user_id
WHERE u.email = 'jeanlaurentkoterumutima@gmail.com'
GROUP BY u.email;

-- Step 5: Test the sync function manually
SELECT '=== TESTING SYNC FUNCTION ===' as info;

DO $$
DECLARE
    test_user_id UUID;
    wallet_data JSONB;
    wallet_summary JSONB;
BEGIN
    -- Get user ID
    SELECT u.id INTO test_user_id
    FROM auth.users u
    WHERE u.email = 'jeanlaurentkoterumutima@gmail.com';
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE '❌ User jeanlaurentkoterumutima@gmail.com not found';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Found user: %', test_user_id;
    
    -- Test sync function
    BEGIN
        SELECT sync_user_wallet_from_database(test_user_id) INTO wallet_data;
        RAISE NOTICE '✅ Sync function result: %', wallet_data;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Sync function failed: %', SQLERRM;
    END;
    
    -- Test wallet summary function
    BEGIN
        SELECT get_user_wallet_summary(test_user_id) INTO wallet_summary;
        RAISE NOTICE '✅ Wallet summary result: %', wallet_summary;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Wallet summary function failed: %', SQLERRM;
    END;
END $$;

-- Step 6: Check all users and their wallet data
SELECT '=== ALL USERS WALLET SUMMARY ===' as info;

SELECT 
    u.email,
    COUNT(uw.id) as wallet_count,
    COALESCE(SUM(CASE WHEN uw.wallet_type = 'trading' THEN uw.balance ELSE 0 END), 0) as trading_balance,
    COALESCE(SUM(CASE WHEN uw.wallet_type = 'funding' THEN uw.balance ELSE 0 END), 0) as funding_balance,
    COALESCE(SUM(uw.balance), 0) as total_balance
FROM auth.users u
LEFT JOIN public.user_wallets uw ON u.id = uw.user_id
GROUP BY u.email
ORDER BY total_balance DESC;

-- Step 7: Check if balance_history table exists and has data
SELECT '=== BALANCE HISTORY CHECK ===' as info;

SELECT 
    'balance_history table' as table_name,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'balance_history'
    ) THEN 'EXISTS' ELSE 'NOT EXISTS' END as status;

-- If table exists, show recent balance changes
SELECT 
    u.email,
    bh.wallet_type,
    bh.asset,
    bh.previous_balance,
    bh.new_balance,
    bh.change_amount,
    bh.change_type,
    bh.reason,
    bh.created_at
FROM public.balance_history bh
JOIN auth.users u ON bh.user_id = u.id
ORDER BY bh.created_at DESC
LIMIT 10;

-- Step 8: Recommendations
DO $$
BEGIN
    RAISE NOTICE '=== RECOMMENDATIONS ===';
    RAISE NOTICE '';
    RAISE NOTICE 'If user has no wallet data:';
    RAISE NOTICE '1. Create initial wallet entries for the user';
    RAISE NOTICE '2. Add some test balance to verify sync works';
    RAISE NOTICE '';
    RAISE NOTICE 'If sync functions don''t exist:';
    RAISE NOTICE '1. Run the wallet sync migration';
    RAISE NOTICE '2. Check for any SQL errors during migration';
    RAISE NOTICE '';
    RAISE NOTICE 'If functions exist but return no data:';
    RAISE NOTICE '1. Check RLS policies';
    RAISE NOTICE '2. Verify user permissions';
    RAISE NOTICE '3. Test with admin user';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Debug complete!';
END $$;
