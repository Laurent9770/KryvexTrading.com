-- =============================================
-- FIX GRANTS FOR AUTHENTICATED USERS
-- =============================================

-- Step 1: Show current grants before fix
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'user_wallets' 
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- Step 2: Revoke all existing grants
REVOKE ALL ON public.user_wallets FROM anon, authenticated, service_role;
REVOKE ALL ON public.deposit_requests FROM anon, authenticated, service_role;
REVOKE ALL ON public.withdrawal_requests FROM anon, authenticated, service_role;
REVOKE ALL ON public.admin_actions FROM anon, authenticated, service_role;
REVOKE ALL ON public.user_trading_modes FROM anon, authenticated, service_role;
REVOKE ALL ON public.kyc_documents FROM anon, authenticated, service_role;

-- Step 3: Grant proper permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_wallets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deposit_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.withdrawal_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_actions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_trading_modes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kyc_documents TO authenticated;

-- Step 4: Grant SELECT permissions to anon users
GRANT SELECT ON public.user_wallets TO anon;
GRANT SELECT ON public.deposit_requests TO anon;
GRANT SELECT ON public.withdrawal_requests TO anon;
GRANT SELECT ON public.admin_actions TO anon;
GRANT SELECT ON public.user_trading_modes TO anon;
GRANT SELECT ON public.kyc_documents TO anon;

-- Step 5: Grant ALL permissions to service_role
GRANT ALL ON public.user_wallets TO service_role;
GRANT ALL ON public.deposit_requests TO service_role;
GRANT ALL ON public.withdrawal_requests TO service_role;
GRANT ALL ON public.admin_actions TO service_role;
GRANT ALL ON public.user_trading_modes TO service_role;
GRANT ALL ON public.kyc_documents TO service_role;

-- Step 6: Show grants after fix
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'user_wallets' 
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- Step 7: Test admin user access
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'kryvextrading@gmail.com';
    
    IF admin_user_id IS NOT NULL THEN
        RAISE NOTICE '✅ Admin user found: %', admin_user_id;
        
        -- Test has_role function
        IF has_role(admin_user_id, 'admin') THEN
            RAISE NOTICE '✅ Admin role verified';
        ELSE
            RAISE NOTICE '❌ Admin role not found';
        END IF;
    ELSE
        RAISE NOTICE '❌ Admin user not found';
    END IF;
END $$;

-- Step 8: Test admin action insertion
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'kryvextrading@gmail.com';
    
    IF admin_user_id IS NOT NULL THEN
        -- Test inserting an admin action
        BEGIN
            INSERT INTO public.admin_actions (
                admin_email,
                action_type,
                target_user_id,
                details,
                created_at
            ) VALUES (
                'kryvextrading@gmail.com',
                'test_grant_fix',
                admin_user_id,
                '{"test": "grants_fixed", "timestamp": "2025-07-31"}'::jsonb,
                NOW()
            );
            
            RAISE NOTICE '✅ Admin action insertion test PASSED';
            
            -- Clean up test data
            DELETE FROM public.admin_actions 
            WHERE action_type = 'test_grant_fix' 
            AND admin_email = 'kryvextrading@gmail.com';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Admin action insertion test FAILED: %', SQLERRM;
        END;
    END IF;
END $$;

-- Step 9: Final status message
SELECT '🎉 Grants fix completed! Authenticated users now have proper permissions.' as status;
