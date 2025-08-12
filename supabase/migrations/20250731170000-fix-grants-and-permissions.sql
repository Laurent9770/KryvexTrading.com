-- =============================================
-- FIX GRANTS AND PERMISSIONS FOR AUTHENTICATED USERS
-- =============================================

-- Step 1: Check current grants and fix them
DO $$
BEGIN
    RAISE NOTICE 'Current grants for user_wallets:';
END $$;

-- Show current grants
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'user_wallets' 
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- Step 2: Revoke all existing grants and re-grant them properly
REVOKE ALL ON public.user_wallets FROM anon, authenticated, service_role;

-- Step 3: Grant proper permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_wallets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deposit_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.withdrawal_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_actions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_trading_modes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kyc_documents TO authenticated;

-- Step 4: Grant minimal permissions to anon (if needed for public access)
GRANT SELECT ON public.user_wallets TO anon;
GRANT SELECT ON public.deposit_requests TO anon;
GRANT SELECT ON public.withdrawal_requests TO anon;
GRANT SELECT ON public.admin_actions TO anon;
GRANT SELECT ON public.user_trading_modes TO anon;
GRANT SELECT ON public.kyc_documents TO anon;

-- Step 5: Grant service_role permissions (for backend operations)
GRANT ALL ON public.user_wallets TO service_role;
GRANT ALL ON public.deposit_requests TO service_role;
GRANT ALL ON public.withdrawal_requests TO service_role;
GRANT ALL ON public.admin_actions TO service_role;
GRANT ALL ON public.user_trading_modes TO service_role;
GRANT ALL ON public.kyc_documents TO service_role;

-- Step 6: Verify grants were applied correctly
DO $$
BEGIN
    RAISE NOTICE 'Updated grants for user_wallets:';
END $$;

-- Show updated grants
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'user_wallets' 
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- Step 7: Test if authenticated users can now access the table
DO $$
DECLARE
    test_user_id UUID;
    test_result BOOLEAN;
BEGIN
    -- Get a test user ID (first user in profiles)
    SELECT user_id INTO test_user_id FROM public.profiles LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testing access with user ID: %', test_user_id;
        
        -- Test SELECT access
        BEGIN
            PERFORM 1 FROM public.user_wallets WHERE user_id = test_user_id LIMIT 1;
            RAISE NOTICE 'SELECT test PASSED';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'SELECT test FAILED: %', SQLERRM;
        END;
        
        -- Test INSERT access (will be rolled back)
        BEGIN
            INSERT INTO public.user_wallets (user_id, wallet_type, asset, balance)
            VALUES (test_user_id, 'test', 'TEST', 0);
            RAISE NOTICE 'INSERT test PASSED';
            ROLLBACK;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'INSERT test FAILED: %', SQLERRM;
        END;
        
    ELSE
        RAISE NOTICE 'No test user found in profiles table';
    END IF;
END $$;

-- Step 8: Check if admin user exists and has proper role
DO $$
DECLARE
    admin_user_id UUID;
    admin_role TEXT;
BEGIN
    -- Find admin user by email
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'kryvextrading@gmail.com';
    
    IF admin_user_id IS NULL THEN
        RAISE NOTICE 'Admin user with email kryvextrading@gmail.com not found in auth.users';
    ELSE
        RAISE NOTICE 'Admin user found with ID: %', admin_user_id;
        
        -- Check role in profiles table
        SELECT role INTO admin_role FROM public.profiles WHERE user_id = admin_user_id;
        
        IF admin_role IS NULL OR admin_role != 'admin' THEN
            RAISE NOTICE 'Admin user does not have admin role. Current role: %', admin_role;
            
            -- Update role to admin
            UPDATE public.profiles 
            SET role = 'admin', updated_at = NOW()
            WHERE user_id = admin_user_id;
            
            RAISE NOTICE 'Updated user role to admin';
        ELSE
            RAISE NOTICE 'Admin user has correct role: %', admin_role;
        END IF;
        
        -- Test has_role function
        IF has_role(admin_user_id, 'admin') THEN
            RAISE NOTICE 'has_role function works correctly for admin user';
        ELSE
            RAISE NOTICE 'has_role function returned false for admin user - this is a problem!';
        END IF;
    END IF;
END $$;

-- Step 9: Final verification - show all current policies
DO $$
BEGIN
    RAISE NOTICE 'Current RLS policies for user_wallets:';
END $$;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_wallets' 
ORDER BY policyname;
