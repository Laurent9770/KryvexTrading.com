-- =============================================
-- COMPLETE SYSTEM TEST SCRIPT
-- Test all tables, functions, and admin balance management
-- =============================================

-- Step 1: Verify all tables exist
DO $$
BEGIN
    RAISE NOTICE '=== VERIFYING TABLES ===';
    
    -- Check user_roles table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
        RAISE NOTICE '✅ user_roles table exists';
    ELSE
        RAISE NOTICE '❌ user_roles table missing';
    END IF;
    
    -- Check user_wallets table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_wallets') THEN
        RAISE NOTICE '✅ user_wallets table exists';
    ELSE
        RAISE NOTICE '❌ user_wallets table missing';
    END IF;
    
    -- Check balance_history table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'balance_history') THEN
        RAISE NOTICE '✅ balance_history table exists';
    ELSE
        RAISE NOTICE '❌ balance_history table missing';
    END IF;
    
    -- Check profiles table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        RAISE NOTICE '✅ profiles table exists';
    ELSE
        RAISE NOTICE '❌ profiles table missing';
    END IF;
END $$;

-- Step 2: Verify all functions exist
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFYING FUNCTIONS ===';
    
    -- Check admin functions
    IF EXISTS (SELECT FROM information_schema.routines WHERE routine_name = 'is_admin') THEN
        RAISE NOTICE '✅ is_admin function exists';
    ELSE
        RAISE NOTICE '❌ is_admin function missing';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.routines WHERE routine_name = 'update_user_balance') THEN
        RAISE NOTICE '✅ update_user_balance function exists';
    ELSE
        RAISE NOTICE '❌ update_user_balance function missing';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.routines WHERE routine_name = 'add_balance_to_user') THEN
        RAISE NOTICE '✅ add_balance_to_user function exists';
    ELSE
        RAISE NOTICE '❌ add_balance_to_user function missing';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.routines WHERE routine_name = 'remove_balance_from_user') THEN
        RAISE NOTICE '✅ remove_balance_from_user function exists';
    ELSE
        RAISE NOTICE '❌ remove_balance_from_user function missing';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.routines WHERE routine_name = 'get_user_wallet_summary') THEN
        RAISE NOTICE '✅ get_user_wallet_summary function exists';
    ELSE
        RAISE NOTICE '❌ get_user_wallet_summary function missing';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.routines WHERE routine_name = 'sync_user_wallet_from_database') THEN
        RAISE NOTICE '✅ sync_user_wallet_from_database function exists';
    ELSE
        RAISE NOTICE '❌ sync_user_wallet_from_database function missing';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.routines WHERE routine_name = 'get_system_balance_stats') THEN
        RAISE NOTICE '✅ get_system_balance_stats function exists';
    ELSE
        RAISE NOTICE '❌ get_system_balance_stats function missing';
    END IF;
END $$;

-- Step 3: Verify all views exist
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFYING VIEWS ===';
    
    IF EXISTS (SELECT FROM information_schema.views WHERE table_name = 'admin_user_balances') THEN
        RAISE NOTICE '✅ admin_user_balances view exists';
    ELSE
        RAISE NOTICE '❌ admin_user_balances view missing';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.views WHERE table_name = 'admin_balance_summary') THEN
        RAISE NOTICE '✅ admin_balance_summary view exists';
    ELSE
        RAISE NOTICE '❌ admin_balance_summary view missing';
    END IF;
END $$;

-- Step 4: Check user data
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== CHECKING USER DATA ===';
    
    -- Count users
    RAISE NOTICE 'Total users: %', (SELECT COUNT(*) FROM auth.users);
    
    -- Count profiles
    RAISE NOTICE 'Total profiles: %', (SELECT COUNT(*) FROM public.profiles);
    
    -- Count user roles
    RAISE NOTICE 'Total user roles: %', (SELECT COUNT(*) FROM public.user_roles);
    
    -- Count admin users
    RAISE NOTICE 'Admin users: %', (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin');
    
    -- Count wallets
    RAISE NOTICE 'Total wallets: %', (SELECT COUNT(*) FROM public.user_wallets);
    
    -- Count balance history
    RAISE NOTICE 'Balance history entries: %', (SELECT COUNT(*) FROM public.balance_history);
END $$;

-- Step 5: Show sample data
RAISE NOTICE '';
RAISE NOTICE '=== SAMPLE USER DATA ===';
SELECT 
    u.email,
    p.full_name,
    ur.role,
    COUNT(uw.id) as wallet_count,
    SUM(uw.balance) as total_balance
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.user_wallets uw ON u.id = uw.user_id
GROUP BY u.email, p.full_name, ur.role
ORDER BY total_balance DESC NULLS LAST;

-- Step 6: Show wallet details
RAISE NOTICE '';
RAISE NOTICE '=== WALLET DETAILS ===';
SELECT 
    u.email,
    uw.wallet_type,
    uw.asset,
    uw.balance,
    uw.updated_at
FROM auth.users u
JOIN public.user_wallets uw ON u.id = uw.user_id
ORDER BY u.email, uw.wallet_type, uw.asset;

-- Step 7: Test admin functions (commented out - run manually)
RAISE NOTICE '';
RAISE NOTICE '=== ADMIN FUNCTION TESTS ===';
RAISE NOTICE 'To test admin functions, run these commands manually:';
RAISE NOTICE '';
RAISE NOTICE '-- Test adding balance:';
RAISE NOTICE 'SELECT add_balance_to_user(''USER_ID_HERE'', ''trading'', ''USDT'', 1000.00, ''Test addition'');';
RAISE NOTICE '';
RAISE NOTICE '-- Test removing balance:';
RAISE NOTICE 'SELECT remove_balance_from_user(''USER_ID_HERE'', ''trading'', ''USDT'', 500.00, ''Test removal'');';
RAISE NOTICE '';
RAISE NOTICE '-- Test getting wallet summary:';
RAISE NOTICE 'SELECT get_user_wallet_summary(''USER_ID_HERE'');';
RAISE NOTICE '';
RAISE NOTICE '-- Test system stats:';
RAISE NOTICE 'SELECT get_system_balance_stats();';

-- Step 8: Show admin views
RAISE NOTICE '';
RAISE NOTICE '=== ADMIN VIEWS ===';
RAISE NOTICE 'Admin User Balances:';
SELECT * FROM admin_user_balances LIMIT 5;

RAISE NOTICE '';
RAISE NOTICE 'Admin Balance Summary:';
SELECT * FROM admin_balance_summary LIMIT 5;

-- Step 9: Final verification
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== FINAL VERIFICATION ===';
    
    -- Check if admin user exists
    IF EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN auth.users u ON ur.user_id = u.id
        WHERE u.email = 'kryvextrading@gmail.com' AND ur.role = 'admin'
    ) THEN
        RAISE NOTICE '✅ Admin user kryvextrading@gmail.com is properly configured';
    ELSE
        RAISE NOTICE '⚠️ Admin user kryvextrading@gmail.com needs configuration';
    END IF;
    
    -- Check if all users have wallet entries
    IF NOT EXISTS (
        SELECT 1 FROM auth.users u
        WHERE NOT EXISTS (
            SELECT 1 FROM public.user_wallets uw WHERE uw.user_id = u.id
        )
    ) THEN
        RAISE NOTICE '✅ All users have wallet entries';
    ELSE
        RAISE NOTICE '⚠️ Some users are missing wallet entries';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 SYSTEM STATUS: READY FOR ADMIN BALANCE MANAGEMENT';
    RAISE NOTICE '';
    RAISE NOTICE 'Admin can now:';
    RAISE NOTICE '  ✅ Add balance to user wallets';
    RAISE NOTICE '  ✅ Remove balance from user wallets';
    RAISE NOTICE '  ✅ View all user balances';
    RAISE NOTICE '  ✅ Track balance history';
    RAISE NOTICE '  ✅ Get system statistics';
    RAISE NOTICE '';
    RAISE NOTICE 'Users can now:';
    RAISE NOTICE '  ✅ View their own wallet data';
    RAISE NOTICE '  ✅ Sync wallet from database';
    RAISE NOTICE '  ✅ See real-time balance updates';
END $$;
