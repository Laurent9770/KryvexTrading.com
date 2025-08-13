-- =============================================
-- FIX SERVICE ROLE PERMISSIONS
-- This migration ensures service_role has proper permissions for admin operations
-- =============================================

-- Step 1: Grant proper permissions to service_role on all essential tables
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.trades TO service_role;
GRANT ALL ON public.trading_pairs TO service_role;
GRANT ALL ON public.transactions TO service_role;
GRANT ALL ON public.user_wallets TO service_role;
GRANT ALL ON public.deposit_requests TO service_role;
GRANT ALL ON public.withdrawal_requests TO service_role;
GRANT ALL ON public.admin_actions TO service_role;
GRANT ALL ON public.user_trading_modes TO service_role;
GRANT ALL ON public.kyc_documents TO service_role;

-- Step 2: Grant permissions on sequences (for auto-incrementing IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Step 3: Grant permissions on auth schema for service_role
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT SELECT ON auth.users TO service_role;

-- Step 4: Verify the fixes
DO $$
DECLARE
    user_roles_grants INTEGER;
    profiles_grants INTEGER;
    trades_grants INTEGER;
BEGIN
    -- Count grants for service_role on key tables
    SELECT COUNT(*) INTO user_roles_grants
    FROM information_schema.role_table_grants 
    WHERE table_name = 'user_roles' 
    AND table_schema = 'public'
    AND grantee = 'service_role';
    
    SELECT COUNT(*) INTO profiles_grants
    FROM information_schema.role_table_grants 
    WHERE table_name = 'profiles' 
    AND table_schema = 'public'
    AND grantee = 'service_role';
    
    SELECT COUNT(*) INTO trades_grants
    FROM information_schema.role_table_grants 
    WHERE table_name = 'trades' 
    AND table_schema = 'public'
    AND grantee = 'service_role';
    
    RAISE NOTICE '=== SERVICE ROLE PERMISSIONS VERIFICATION ===';
    RAISE NOTICE 'user_roles grants for service_role: %', user_roles_grants;
    RAISE NOTICE 'profiles grants for service_role: %', profiles_grants;
    RAISE NOTICE 'trades grants for service_role: %', trades_grants;
    
    IF user_roles_grants >= 6 AND profiles_grants >= 6 AND trades_grants >= 6 THEN
        RAISE NOTICE '✅ Service role permissions fixed successfully!';
    ELSE
        RAISE NOTICE '❌ Some service role permissions may be missing!';
    END IF;
END $$;

-- Step 5: Show current service_role grants for verification
SELECT 
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE grantee = 'service_role'
AND table_schema = 'public'
AND table_name IN ('user_roles', 'profiles', 'trades', 'trading_pairs', 'transactions', 'user_wallets')
ORDER BY table_name, privilege_type;
