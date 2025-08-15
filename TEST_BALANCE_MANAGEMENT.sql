-- =============================================
-- TEST BALANCE MANAGEMENT SYSTEM
-- Run this script to test the balance management functionality
-- =============================================

-- Step 1: Check if the balance management system is set up
DO $$
DECLARE
    balance_history_exists BOOLEAN;
    admin_views_exist BOOLEAN;
    functions_exist BOOLEAN;
BEGIN
    -- Check if balance_history table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'balance_history'
    ) INTO balance_history_exists;
    
    -- Check if admin views exist
    SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND view_name = 'admin_user_balances'
    ) INTO admin_views_exist;
    
    -- Check if functions exist
    SELECT EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'update_user_balance'
    ) INTO functions_exist;
    
    RAISE NOTICE '=== BALANCE MANAGEMENT SYSTEM CHECK ===';
    RAISE NOTICE 'Balance history table: %', CASE WHEN balance_history_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE 'Admin views: %', CASE WHEN admin_views_exist THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE 'Update functions: %', CASE WHEN functions_exist THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    
    IF balance_history_exists AND admin_views_exist AND functions_exist THEN
        RAISE NOTICE '✅ Balance management system is properly set up!';
    ELSE
        RAISE NOTICE '❌ Balance management system is missing components!';
    END IF;
END $$;

-- Step 2: Show current user balances
SELECT 
    'CURRENT USER BALANCES' as info,
    COUNT(*) as total_wallets,
    COUNT(DISTINCT user_id) as unique_users,
    SUM(CASE WHEN asset = 'USDT' THEN balance ELSE 0 END) as total_usdt,
    SUM(CASE WHEN asset = 'USD' THEN balance ELSE 0 END) as total_usd
FROM public.user_wallets;

-- Step 3: Show sample user data
SELECT 
    'SAMPLE USER DATA' as info,
    u.id as user_id,
    u.email,
    p.full_name,
    ur.role,
    COUNT(uw.id) as wallet_count,
    SUM(CASE WHEN uw.asset = 'USDT' THEN uw.balance ELSE 0 END) as usdt_balance,
    SUM(CASE WHEN uw.asset = 'USD' THEN uw.balance ELSE 0 END) as usd_balance
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.user_wallets uw ON u.id = uw.user_id
GROUP BY u.id, u.email, p.full_name, ur.role
ORDER BY usdt_balance DESC
LIMIT 5;

-- Step 4: Show admin view data (if you have admin access)
SELECT 
    'ADMIN VIEW DATA' as info,
    COUNT(*) as total_records
FROM admin_user_balances;

-- Step 5: Show balance summary data
SELECT 
    'BALANCE SUMMARY DATA' as info,
    COUNT(*) as total_users,
    SUM(total_usdt) as total_usdt_balance,
    SUM(total_usd) as total_usd_balance,
    SUM(wallet_count) as total_wallets
FROM admin_balance_summary;

-- Step 6: Show system statistics (if you have admin access)
SELECT 
    'SYSTEM STATISTICS' as info,
    get_system_balance_stats() as stats;

-- Step 7: Instructions for testing balance updates
DO $$
BEGIN
    RAISE NOTICE '=== TESTING INSTRUCTIONS ===';
    RAISE NOTICE '1. To test balance updates, use the admin interface or run:';
    RAISE NOTICE '   SELECT update_user_balance(''user-uuid'', ''trading'', ''USDT'', 1000.00, ''admin_adjustment'', ''Test balance update'');';
    RAISE NOTICE '';
    RAISE NOTICE '2. To view balance history:';
    RAISE NOTICE '   SELECT * FROM balance_history ORDER BY created_at DESC LIMIT 10;';
    RAISE NOTICE '';
    RAISE NOTICE '3. To search users by balance:';
    RAISE NOTICE '   SELECT * FROM admin_balance_summary WHERE total_usdt > 100 ORDER BY total_usdt DESC;';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Balance management system is ready for use!';
END $$;
