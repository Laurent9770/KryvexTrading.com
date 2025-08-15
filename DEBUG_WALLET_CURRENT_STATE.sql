-- =============================================
-- DEBUG WALLET CURRENT STATE
-- Check what's actually happening with wallet data
-- =============================================

DO $$
DECLARE
    target_user_id UUID;
    wallet_summary JSONB;
    wallet_data JSONB;
    user_wallets_count INTEGER;
    user_wallets_data RECORD;
    pol RECORD;
BEGIN
    RAISE NOTICE '=== DEBUGGING WALLET CURRENT STATE ===';
    
    -- Get target user ID
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'jeanlaurentkoterumutima@gmail.com';
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE '❌ User jeanlaurentkoterumutima@gmail.com not found!';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Found user: %', target_user_id;
    
    -- Check user_wallets table structure
    RAISE NOTICE '=== CHECKING USER_WALLETS TABLE STRUCTURE ===';
    
    -- Count wallet entries for this user
    SELECT COUNT(*) INTO user_wallets_count
    FROM public.user_wallets
    WHERE user_id = target_user_id;
    
    RAISE NOTICE '📊 Total wallet entries for user: %', user_wallets_count;
    
    -- Show all wallet entries for this user
    RAISE NOTICE '=== ALL WALLET ENTRIES FOR USER ===';
    FOR user_wallets_data IN 
        SELECT * FROM public.user_wallets 
        WHERE user_id = target_user_id 
        ORDER BY wallet_type, asset
    LOOP
        RAISE NOTICE '  - % %: Balance = %, Available = %, Updated = %', 
            user_wallets_data.wallet_type, 
            user_wallets_data.asset, 
            user_wallets_data.balance, 
            user_wallets_data.available_balance,
            user_wallets_data.updated_at;
    END LOOP;
    
    -- Test get_user_wallet_summary function
    RAISE NOTICE '=== TESTING get_user_wallet_summary FUNCTION ===';
    
    BEGIN
        SELECT get_user_wallet_summary(target_user_id) INTO wallet_summary;
        RAISE NOTICE '✅ get_user_wallet_summary result: %', wallet_summary;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ get_user_wallet_summary error: %', SQLERRM;
    END;
    
    -- Test sync_user_wallet_from_database function
    RAISE NOTICE '=== TESTING sync_user_wallet_from_database FUNCTION ===';
    
    BEGIN
        SELECT sync_user_wallet_from_database(target_user_id) INTO wallet_data;
        RAISE NOTICE '✅ sync_user_wallet_from_database result: %', wallet_data;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ sync_user_wallet_from_database error: %', SQLERRM;
    END;
    
    -- Check RLS policies on user_wallets
    RAISE NOTICE '=== CHECKING RLS POLICIES ===';
    
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'user_wallets' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE '✅ RLS is ENABLED on user_wallets table';
    ELSE
        RAISE NOTICE '❌ RLS is DISABLED on user_wallets table';
    END IF;
    
    -- List all policies on user_wallets
    RAISE NOTICE '=== RLS POLICIES ON USER_WALLETS ===';
    FOR pol IN 
        SELECT policyname, cmd, qual 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_wallets'
    LOOP
        RAISE NOTICE '  - Policy: % (%): %', pol.policyname, pol.cmd, pol.qual;
    END LOOP;
    
    -- Check permissions
    RAISE NOTICE '=== CHECKING PERMISSIONS ===';
    
    IF EXISTS (
        SELECT 1 FROM information_schema.role_table_grants 
        WHERE table_schema = 'public' 
        AND table_name = 'user_wallets' 
        AND grantee = 'authenticated' 
        AND privilege_type = 'SELECT'
    ) THEN
        RAISE NOTICE '✅ authenticated role has SELECT permission on user_wallets';
    ELSE
        RAISE NOTICE '❌ authenticated role does NOT have SELECT permission on user_wallets';
    END IF;
    
    -- Check function permissions
    RAISE NOTICE '=== CHECKING FUNCTION PERMISSIONS ===';
    
    IF EXISTS (
        SELECT 1 FROM information_schema.routine_privileges 
        WHERE routine_schema = 'public' 
        AND routine_name = 'get_user_wallet_summary' 
        AND grantee = 'authenticated' 
        AND privilege_type = 'EXECUTE'
    ) THEN
        RAISE NOTICE '✅ authenticated role can execute get_user_wallet_summary';
    ELSE
        RAISE NOTICE '❌ authenticated role CANNOT execute get_user_wallet_summary';
    END IF;
    
    RAISE NOTICE '=== DEBUG COMPLETE ===';
END $$;
