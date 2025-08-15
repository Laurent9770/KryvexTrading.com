-- =============================================
-- FRONTEND DATABASE CONNECTION TEST
-- Test if the database functions exist and are working
-- =============================================

-- Step 1: Check if functions exist
DO $$
BEGIN
    RAISE NOTICE '=== CHECKING DATABASE FUNCTIONS ===';
    
    -- Check if sync_user_wallet_from_database exists
    IF EXISTS (SELECT FROM information_schema.routines WHERE routine_name = 'sync_user_wallet_from_database') THEN
        RAISE NOTICE '✅ sync_user_wallet_from_database function exists';
    ELSE
        RAISE NOTICE '❌ sync_user_wallet_from_database function MISSING';
    END IF;
    
    -- Check if get_user_wallet_summary exists
    IF EXISTS (SELECT FROM information_schema.routines WHERE routine_name = 'get_user_wallet_summary') THEN
        RAISE NOTICE '✅ get_user_wallet_summary function exists';
    ELSE
        RAISE NOTICE '❌ get_user_wallet_summary function MISSING';
    END IF;
    
    -- Check if is_admin exists
    IF EXISTS (SELECT FROM information_schema.routines WHERE routine_name = 'is_admin') THEN
        RAISE NOTICE '✅ is_admin function exists';
    ELSE
        RAISE NOTICE '❌ is_admin function MISSING';
    END IF;
END $$;

-- Step 2: Check if tables exist
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== CHECKING DATABASE TABLES ===';
    
    -- Check user_wallets table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_wallets') THEN
        RAISE NOTICE '✅ user_wallets table exists';
    ELSE
        RAISE NOTICE '❌ user_wallets table MISSING';
    END IF;
    
    -- Check user_roles table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
        RAISE NOTICE '✅ user_roles table exists';
    ELSE
        RAISE NOTICE '❌ user_roles table MISSING';
    END IF;
    
    -- Check profiles table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        RAISE NOTICE '✅ profiles table exists';
    ELSE
        RAISE NOTICE '❌ profiles table MISSING';
    END IF;
END $$;

-- Step 3: Check user data
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== CHECKING USER DATA ===';
    
    -- Count users
    RAISE NOTICE 'Total users: %', (SELECT COUNT(*) FROM auth.users);
    
    -- Show specific users
    RAISE NOTICE 'Users in system:';
    FOR user_record IN SELECT id, email FROM auth.users LIMIT 5 LOOP
        RAISE NOTICE '  - %: %', user_record.email, user_record.id;
    END LOOP;
    
    -- Check if specific users have wallet data
    RAISE NOTICE '';
    RAISE NOTICE 'Wallet data for specific users:';
    
    -- Check jeanlaurentkoterumutima@gmail.com
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'jeanlaurentkoterumutima@gmail.com') THEN
        DECLARE
            user_id UUID;
            wallet_count INTEGER;
        BEGIN
            SELECT id INTO user_id FROM auth.users WHERE email = 'jeanlaurentkoterumutima@gmail.com';
            SELECT COUNT(*) INTO wallet_count FROM public.user_wallets WHERE user_id = user_id;
            RAISE NOTICE '  jeanlaurentkoterumutima@gmail.com: % wallet entries', wallet_count;
            
            IF wallet_count > 0 THEN
                RAISE NOTICE '    Wallet details:';
                FOR wallet_record IN SELECT wallet_type, asset, balance FROM public.user_wallets WHERE user_id = user_id LOOP
                    RAISE NOTICE '      % %: %', wallet_record.wallet_type, wallet_record.asset, wallet_record.balance;
                END LOOP;
            END IF;
        END;
    ELSE
        RAISE NOTICE '  jeanlaurentkoterumutima@gmail.com: User not found';
    END IF;
    
    -- Check shemaprince92@gmail.com
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'shemaprince92@gmail.com') THEN
        DECLARE
            user_id UUID;
            wallet_count INTEGER;
        BEGIN
            SELECT id INTO user_id FROM auth.users WHERE email = 'shemaprince92@gmail.com';
            SELECT COUNT(*) INTO wallet_count FROM public.user_wallets WHERE user_id = user_id;
            RAISE NOTICE '  shemaprince92@gmail.com: % wallet entries', wallet_count;
            
            IF wallet_count > 0 THEN
                RAISE NOTICE '    Wallet details:';
                FOR wallet_record IN SELECT wallet_type, asset, balance FROM public.user_wallets WHERE user_id = user_id LOOP
                    RAISE NOTICE '      % %: %', wallet_record.wallet_type, wallet_record.asset, wallet_record.balance;
                END LOOP;
            END IF;
        END;
    ELSE
        RAISE NOTICE '  shemaprince92@gmail.com: User not found';
    END IF;
END $$;

-- Step 4: Test function calls (commented out - run manually)
RAISE NOTICE '';
RAISE NOTICE '=== FUNCTION TEST COMMANDS ===';
RAISE NOTICE 'To test functions manually, run these commands:';
RAISE NOTICE '';
RAISE NOTICE '-- Test sync function (replace USER_ID with actual user ID):';
RAISE NOTICE 'SELECT sync_user_wallet_from_database(''USER_ID_HERE'');';
RAISE NOTICE '';
RAISE NOTICE '-- Test wallet summary function (replace USER_ID with actual user ID):';
RAISE NOTICE 'SELECT get_user_wallet_summary(''USER_ID_HERE'');';
RAISE NOTICE '';
RAISE NOTICE '-- Test admin function:';
RAISE NOTICE 'SELECT is_admin();';

-- Step 5: Check RLS policies
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== CHECKING RLS POLICIES ===';
    
    -- Check user_wallets policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_wallets') THEN
        RAISE NOTICE '✅ user_wallets has RLS policies';
        FOR policy_record IN SELECT policyname FROM pg_policies WHERE tablename = 'user_wallets' LOOP
            RAISE NOTICE '  - %', policy_record.policyname;
        END LOOP;
    ELSE
        RAISE NOTICE '❌ user_wallets has NO RLS policies';
    END IF;
    
    -- Check if RLS is enabled
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_wallets' AND rowsecurity = true) THEN
        RAISE NOTICE '✅ RLS is enabled on user_wallets';
    ELSE
        RAISE NOTICE '❌ RLS is NOT enabled on user_wallets';
    END IF;
END $$;

-- Step 6: Check permissions
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== CHECKING PERMISSIONS ===';
    
    -- Check if authenticated role can execute functions
    IF EXISTS (
        SELECT 1 FROM information_schema.routine_privileges 
        WHERE routine_name = 'sync_user_wallet_from_database' 
        AND grantee = 'authenticated'
    ) THEN
        RAISE NOTICE '✅ authenticated role can execute sync_user_wallet_from_database';
    ELSE
        RAISE NOTICE '❌ authenticated role CANNOT execute sync_user_wallet_from_database';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.routine_privileges 
        WHERE routine_name = 'get_user_wallet_summary' 
        AND grantee = 'authenticated'
    ) THEN
        RAISE NOTICE '✅ authenticated role can execute get_user_wallet_summary';
    ELSE
        RAISE NOTICE '❌ authenticated role CANNOT execute get_user_wallet_summary';
    END IF;
END $$;

-- Step 7: Final summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== FRONTEND DATABASE READINESS ===';
    RAISE NOTICE '';
    RAISE NOTICE 'If you see any ❌ errors above, the frontend will not work properly.';
    RAISE NOTICE '';
    RAISE NOTICE 'Required for frontend to work:';
    RAISE NOTICE '  ✅ sync_user_wallet_from_database function exists';
    RAISE NOTICE '  ✅ get_user_wallet_summary function exists';
    RAISE NOTICE '  ✅ user_wallets table exists';
    RAISE NOTICE '  ✅ RLS policies are configured';
    RAISE NOTICE '  ✅ authenticated role has execute permissions';
    RAISE NOTICE '  ✅ Users have wallet data in database';
    RAISE NOTICE '';
    RAISE NOTICE 'If any are missing, run the complete migration:';
    RAISE NOTICE '  supabase/migrations/20250731500000-complete-balance-management-system.sql';
END $$;
