-- =============================================
-- FINAL VERIFICATION - CHECK IF EVERYTHING IS WORKING
-- =============================================

-- Step 1: Check current grants for user_wallets
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'user_wallets' 
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- Step 2: Test admin user access
DO $$
DECLARE
    admin_user_id UUID;
    admin_role TEXT;
    has_admin_role BOOLEAN;
BEGIN
    -- Find admin user by email
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'kryvextrading@gmail.com';
    
    IF admin_user_id IS NULL THEN
        RAISE NOTICE '❌ Admin user with email kryvextrading@gmail.com not found in auth.users';
    ELSE
        RAISE NOTICE '✅ Admin user found with ID: %', admin_user_id;
        
        -- Check role in profiles table
        SELECT role INTO admin_role FROM public.profiles WHERE user_id = admin_user_id;
        
        IF admin_role IS NULL OR admin_role != 'admin' THEN
            RAISE NOTICE '❌ Admin user does not have admin role. Current role: %', admin_role;
        ELSE
            RAISE NOTICE '✅ Admin user has correct role: %', admin_role;
        END IF;
        
        -- Test has_role function
        SELECT has_role(admin_user_id, 'admin') INTO has_admin_role;
        IF has_admin_role THEN
            RAISE NOTICE '✅ has_role function works correctly for admin user';
        ELSE
            RAISE NOTICE '❌ has_role function returned false for admin user - this is a problem!';
        END IF;
    END IF;
END $$;

-- Step 3: Test admin wallet operations (simulated)
DO $$
DECLARE
    admin_user_id UUID;
    test_user_id UUID;
    test_result BOOLEAN;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'kryvextrading@gmail.com';
    
    -- Get a test user ID (first user in profiles that's not admin)
    SELECT user_id INTO test_user_id FROM public.profiles 
    WHERE user_id != admin_user_id 
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL AND test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testing admin operations with admin ID: % and test user ID: %', admin_user_id, test_user_id;
        
        -- Test admin INSERT operation (will be rolled back)
        BEGIN
            INSERT INTO public.user_wallets (user_id, wallet_type, asset, balance)
            VALUES (test_user_id, 'trading', 'USDT', 1000);
            RAISE NOTICE '✅ Admin INSERT test PASSED';
            ROLLBACK;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Admin INSERT test FAILED: %', SQLERRM;
        END;
        
        -- Test admin UPDATE operation (will be rolled back)
        BEGIN
            UPDATE public.user_wallets 
            SET balance = 2000 
            WHERE user_id = test_user_id AND wallet_type = 'trading' AND asset = 'USDT';
            RAISE NOTICE '✅ Admin UPDATE test PASSED';
            ROLLBACK;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Admin UPDATE test FAILED: %', SQLERRM;
        END;
        
        -- Test admin SELECT operation
        BEGIN
            PERFORM 1 FROM public.user_wallets WHERE user_id = test_user_id LIMIT 1;
            RAISE NOTICE '✅ Admin SELECT test PASSED';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Admin SELECT test FAILED: %', SQLERRM;
        END;
        
    ELSE
        RAISE NOTICE '❌ Cannot test admin operations - missing admin user or test user';
    END IF;
END $$;

-- Step 4: Show current RLS policies summary
SELECT 
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_wallets', 'deposit_requests', 'withdrawal_requests', 'admin_actions', 'user_trading_modes', 'kyc_documents')
GROUP BY tablename
ORDER BY tablename;

-- Step 5: Final status check
DO $$
BEGIN
    RAISE NOTICE '=============================================';
    RAISE NOTICE 'FINAL STATUS CHECK';
    RAISE NOTICE '=============================================';
    RAISE NOTICE 'If you see ✅ marks above, the setup is working correctly!';
    RAISE NOTICE 'If you see ❌ marks, there are still issues to resolve.';
    RAISE NOTICE '=============================================';
END $$;
