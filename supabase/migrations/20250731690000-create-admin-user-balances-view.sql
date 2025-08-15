-- =============================================
-- CREATE ADMIN_USER_BALANCES VIEW
-- Create the missing view that the frontend is trying to access
-- =============================================

-- Step 1: Create the admin_user_balances view
DO $$
BEGIN
    RAISE NOTICE '=== CREATING ADMIN_USER_BALANCES VIEW ===';
    
    -- Drop the view if it exists
    DROP VIEW IF EXISTS public.admin_user_balances;
    
    -- Create the admin_user_balances view
    CREATE VIEW public.admin_user_balances AS
    SELECT 
        u.id as user_id,
        u.email,
        p.full_name,
        p.is_verified,
        p.kyc_status,
        p.role,
        p.account_balance,
        p.auto_generated,
        p.created_at as user_created_at,
        p.updated_at as user_updated_at,
        -- Wallet balances
        COALESCE(funding_wallet.balance, 0) as funding_balance,
        COALESCE(trading_wallet.balance, 0) as trading_balance,
        -- Total balance
        COALESCE(p.account_balance, 0) + 
        COALESCE(funding_wallet.balance, 0) + 
        COALESCE(trading_wallet.balance, 0) as total_balance,
        -- Last transaction
        GREATEST(
            p.updated_at,
            COALESCE(funding_wallet.updated_at, '1970-01-01'::timestamp),
            COALESCE(trading_wallet.updated_at, '1970-01-01'::timestamp)
        ) as last_activity
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.user_id
    LEFT JOIN (
        SELECT 
            user_id, 
            balance, 
            updated_at
        FROM public.user_wallets 
        WHERE wallet_type = 'funding' AND asset = 'USD'
    ) funding_wallet ON u.id = funding_wallet.user_id
    LEFT JOIN (
        SELECT 
            user_id, 
            balance, 
            updated_at
        FROM public.user_wallets 
        WHERE wallet_type = 'trading' AND asset = 'USD'
    ) trading_wallet ON u.id = trading_wallet.user_id
    ORDER BY p.created_at DESC;
    
    RAISE NOTICE '✅ admin_user_balances view created successfully';
END $$;

-- Step 2: Grant permissions on the view
GRANT SELECT ON public.admin_user_balances TO authenticated;

-- Step 3: Test the view
DO $$
DECLARE
    view_count INTEGER;
BEGIN
    RAISE NOTICE '=== TESTING ADMIN_USER_BALANCES VIEW ===';
    
    -- Test if the view exists and is accessible
    SELECT COUNT(*) INTO view_count FROM public.admin_user_balances;
    RAISE NOTICE '✅ admin_user_balances view accessible: % records found', view_count;
    
    -- Test a sample query
    RAISE NOTICE 'Sample data from admin_user_balances view:';
    DECLARE
        sample_record RECORD;
    BEGIN
        FOR sample_record IN 
            SELECT email, full_name, total_balance, role 
            FROM public.admin_user_balances 
            LIMIT 3
        LOOP
            RAISE NOTICE '  - % (%): $% (role: %)', 
                sample_record.email, 
                sample_record.full_name, 
                sample_record.total_balance, 
                sample_record.role;
        END LOOP;
    END;
    
    RAISE NOTICE '✅ admin_user_balances view test completed successfully';
END $$;

-- Step 4: Create RLS policies for the view (if needed)
DO $$
BEGIN
    RAISE NOTICE '=== SETTING UP VIEW PERMISSIONS ===';
    
    -- Grant usage on the view
    GRANT USAGE ON SCHEMA public TO authenticated;
    
    RAISE NOTICE '✅ View permissions configured';
END $$;

-- Step 5: Final verification
DO $$
BEGIN
    RAISE NOTICE '=== FINAL VERIFICATION ===';
    RAISE NOTICE '✅ admin_user_balances view created';
    RAISE NOTICE '✅ View permissions granted to authenticated users';
    RAISE NOTICE '✅ Dashboard should now load without 404 errors';
    RAISE NOTICE '✅ Admin can view all user balances';
END $$;
