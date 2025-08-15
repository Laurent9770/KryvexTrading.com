-- =============================================
-- SYNC USER WALLET WITH DATABASE
-- Fix the disconnect between admin balance management and user wallet display
-- =============================================

-- Step 1: Create function to sync user wallet from database
CREATE OR REPLACE FUNCTION sync_user_wallet_from_database(user_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    wallet_data JSONB;
    result JSONB;
BEGIN
    -- Get all wallet data for the user
    SELECT jsonb_agg(
        jsonb_build_object(
            'wallet_type', wallet_type,
            'asset', asset,
            'balance', balance,
            'updated_at', updated_at
        )
    ) INTO wallet_data
    FROM public.user_wallets
    WHERE user_id = user_id_param;

    -- Return the wallet data
    result := jsonb_build_object(
        'success', true,
        'user_id', user_id_param,
        'wallets', COALESCE(wallet_data, '[]'::jsonb),
        'timestamp', NOW()
    );

    RETURN result;
END;
$$;

-- Step 2: Create function to get user wallet summary
CREATE OR REPLACE FUNCTION get_user_wallet_summary(user_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Check if user can access this data (own data or admin)
    IF auth.uid() != user_id_param AND NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Get wallet summary
    SELECT jsonb_build_object(
        'success', true,
        'user_id', user_id_param,
        'trading_account', (
            SELECT jsonb_object_agg(asset, jsonb_build_object(
                'balance', balance::text,
                'usdValue', concat('$', balance::text),
                'available', balance::text
            ))
            FROM public.user_wallets
            WHERE user_id = user_id_param AND wallet_type = 'trading'
        ),
        'funding_account', (
            SELECT jsonb_build_object(
                'USDT', jsonb_build_object(
                    'balance', COALESCE(balance, 0)::text,
                    'usdValue', concat('$', COALESCE(balance, 0)::text),
                    'available', COALESCE(balance, 0)::text
                )
            )
            FROM public.user_wallets
            WHERE user_id = user_id_param AND wallet_type = 'funding' AND asset = 'USDT'
        ),
        'total_balance', (
            SELECT COALESCE(SUM(balance), 0)
            FROM public.user_wallets
            WHERE user_id = user_id_param
        ),
        'last_updated', NOW()
    ) INTO result;

    RETURN result;
END;
$$;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION sync_user_wallet_from_database(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_wallet_summary(UUID) TO authenticated;

-- Step 4: Find and update shemaprince92@gmail.com wallet
DO $$
DECLARE
    target_user_id UUID;
    current_balance DECIMAL(20,8);
BEGIN
    -- Find the user
    SELECT u.id INTO target_user_id
    FROM auth.users u
    WHERE u.email = 'shemaprince92@gmail.com';

    IF target_user_id IS NULL THEN
        RAISE NOTICE '❌ User shemaprince92@gmail.com not found';
        RETURN;
    END IF;

    RAISE NOTICE '✅ Found user: %', target_user_id;

    -- Check current trading USDT balance
    SELECT balance INTO current_balance
    FROM public.user_wallets
    WHERE user_id = target_user_id 
      AND wallet_type = 'trading' 
      AND asset = 'USDT';

    -- Add 100K to trading USDT balance
    IF current_balance IS NULL THEN
        -- Create new wallet entry
        INSERT INTO public.user_wallets (user_id, wallet_type, asset, balance)
        VALUES (target_user_id, 'trading', 'USDT', 100000.00);
        RAISE NOTICE '✅ Created new trading wallet with 100,000 USDT';
    ELSE
        -- Update existing wallet
        UPDATE public.user_wallets
        SET balance = current_balance + 100000.00, updated_at = NOW()
        WHERE user_id = target_user_id 
          AND wallet_type = 'trading' 
          AND asset = 'USDT';
        RAISE NOTICE '✅ Updated trading wallet: % + 100,000 = % USDT', current_balance, current_balance + 100000.00;
    END IF;

    -- Insert into balance history if table exists
    BEGIN
        INSERT INTO public.balance_history (
            user_id, wallet_type, asset, previous_balance, new_balance, 
            change_amount, change_type, reason, admin_id
        ) VALUES (
            target_user_id, 'trading', 'USDT', 
            COALESCE(current_balance, 0), 
            COALESCE(current_balance, 0) + 100000.00,
            100000.00, 'admin_adjustment', 'Added 100K to trading account', 
            (SELECT id FROM auth.users WHERE email = 'kryvextrading@gmail.com' LIMIT 1)
        );
        RAISE NOTICE '✅ Added balance history entry';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Could not add balance history: %', SQLERRM;
    END;

END $$;

-- Step 5: Verify the update
SELECT '=== VERIFICATION: SHEMAPRINCE92 WALLET ===' as info;
SELECT 
    u.email,
    uw.wallet_type,
    uw.asset,
    uw.balance,
    uw.updated_at
FROM auth.users u
JOIN public.user_wallets uw ON u.id = uw.user_id
WHERE u.email = 'shemaprince92@gmail.com'
ORDER BY uw.wallet_type, uw.asset;

-- Step 6: Test the new functions
DO $$
DECLARE
    test_user_id UUID;
    wallet_summary JSONB;
BEGIN
    RAISE NOTICE '=== TESTING NEW FUNCTIONS ===';
    
    -- Get test user
    SELECT u.id INTO test_user_id
    FROM auth.users u
    WHERE u.email = 'shemaprince92@gmail.com'
    LIMIT 1;

    IF test_user_id IS NOT NULL THEN
        -- Test wallet summary function
        SELECT get_user_wallet_summary(test_user_id) INTO wallet_summary;
        RAISE NOTICE '✅ Wallet summary function works: %', wallet_summary;
    ELSE
        RAISE NOTICE '❌ Test user not found';
    END IF;
END $$;
