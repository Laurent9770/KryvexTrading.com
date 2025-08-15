-- =============================================
-- ADD INITIAL WALLET DATA
-- Create initial wallet entries for users and test sync
-- =============================================

-- Step 1: Add initial wallet data for jeanlaurentkoterumutima@gmail.com
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Find the user
    SELECT u.id INTO target_user_id
    FROM auth.users u
    WHERE u.email = 'jeanlaurentkoterumutima@gmail.com';

    IF target_user_id IS NULL THEN
        RAISE NOTICE '❌ User jeanlaurentkoterumutima@gmail.com not found';
        RETURN;
    END IF;

    RAISE NOTICE '✅ Found user: %', target_user_id;

    -- Check if user already has wallet entries
    IF NOT EXISTS (SELECT 1 FROM public.user_wallets WHERE user_id = target_user_id) THEN
        -- Create initial wallet entries
        INSERT INTO public.user_wallets (user_id, wallet_type, asset, balance) VALUES
            (target_user_id, 'trading', 'USDT', 1000.00),
            (target_user_id, 'trading', 'BTC', 0.00000000),
            (target_user_id, 'trading', 'ETH', 0.00000000),
            (target_user_id, 'funding', 'USDT', 5000.00);
        
        RAISE NOTICE '✅ Created initial wallet entries for jeanlaurentkoterumutima@gmail.com';
    ELSE
        RAISE NOTICE 'ℹ️ User already has wallet entries';
    END IF;

END $$;

-- Step 2: Add initial wallet data for shemaprince92@gmail.com (if not exists)
DO $$
DECLARE
    target_user_id UUID;
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

    -- Check if user already has wallet entries
    IF NOT EXISTS (SELECT 1 FROM public.user_wallets WHERE user_id = target_user_id) THEN
        -- Create initial wallet entries with 100K USDT
        INSERT INTO public.user_wallets (user_id, wallet_type, asset, balance) VALUES
            (target_user_id, 'trading', 'USDT', 100000.00),
            (target_user_id, 'trading', 'BTC', 0.00000000),
            (target_user_id, 'trading', 'ETH', 0.00000000),
            (target_user_id, 'funding', 'USDT', 10000.00);
        
        RAISE NOTICE '✅ Created initial wallet entries for shemaprince92@gmail.com with 100K USDT';
    ELSE
        RAISE NOTICE 'ℹ️ User already has wallet entries';
    END IF;

END $$;

-- Step 3: Create initial wallet entries for all users who don't have them
DO $$
DECLARE
    user_record RECORD;
BEGIN
    RAISE NOTICE '=== CREATING WALLET ENTRIES FOR ALL USERS ===';
    
    FOR user_record IN 
        SELECT u.id, u.email
        FROM auth.users u
        WHERE NOT EXISTS (
            SELECT 1 FROM public.user_wallets uw WHERE uw.user_id = u.id
        )
    LOOP
        -- Create initial wallet entries for each user
        INSERT INTO public.user_wallets (user_id, wallet_type, asset, balance) VALUES
            (user_record.id, 'trading', 'USDT', 1000.00),
            (user_record.id, 'trading', 'BTC', 0.00000000),
            (user_record.id, 'trading', 'ETH', 0.00000000),
            (user_record.id, 'funding', 'USDT', 5000.00);
        
        RAISE NOTICE '✅ Created wallet entries for: %', user_record.email;
    END LOOP;
    
    RAISE NOTICE '✅ Wallet creation complete!';
END $$;

-- Step 4: Verify the wallet data
SELECT '=== VERIFICATION: WALLET DATA ===' as info;

SELECT 
    u.email,
    uw.wallet_type,
    uw.asset,
    uw.balance,
    uw.updated_at
FROM auth.users u
JOIN public.user_wallets uw ON u.id = uw.user_id
ORDER BY u.email, uw.wallet_type, uw.asset;

-- Step 5: Test the sync functions with real data
SELECT '=== TESTING SYNC FUNCTIONS ===' as info;

DO $$
DECLARE
    test_user_id UUID;
    wallet_data JSONB;
    wallet_summary JSONB;
BEGIN
    -- Test with jeanlaurentkoterumutima@gmail.com
    SELECT u.id INTO test_user_id
    FROM auth.users u
    WHERE u.email = 'jeanlaurentkoterumutima@gmail.com';
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testing sync for jeanlaurentkoterumutima@gmail.com...';
        
        -- Test sync function
        SELECT sync_user_wallet_from_database(test_user_id) INTO wallet_data;
        RAISE NOTICE '✅ Sync function result: %', wallet_data;
        
        -- Test wallet summary function
        SELECT get_user_wallet_summary(test_user_id) INTO wallet_summary;
        RAISE NOTICE '✅ Wallet summary result: %', wallet_summary;
    END IF;
    
    -- Test with shemaprince92@gmail.com
    SELECT u.id INTO test_user_id
    FROM auth.users u
    WHERE u.email = 'shemaprince92@gmail.com';
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testing sync for shemaprince92@gmail.com...';
        
        -- Test sync function
        SELECT sync_user_wallet_from_database(test_user_id) INTO wallet_data;
        RAISE NOTICE '✅ Sync function result: %', wallet_data;
        
        -- Test wallet summary function
        SELECT get_user_wallet_summary(test_user_id) INTO wallet_summary;
        RAISE NOTICE '✅ Wallet summary result: %', wallet_summary;
    END IF;
END $$;

-- Step 6: Summary
DO $$
BEGIN
    RAISE NOTICE '=== SUMMARY ===';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Initial wallet data created for all users';
    RAISE NOTICE '✅ jeanlaurentkoterumutima@gmail.com should now have:';
    RAISE NOTICE '   - Trading USDT: 1,000.00';
    RAISE NOTICE '   - Funding USDT: 5,000.00';
    RAISE NOTICE '';
    RAISE NOTICE '✅ shemaprince92@gmail.com should now have:';
    RAISE NOTICE '   - Trading USDT: 100,000.00';
    RAISE NOTICE '   - Funding USDT: 10,000.00';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Next steps:';
    RAISE NOTICE '1. Refresh the user wallet page';
    RAISE NOTICE '2. Click the refresh button in the wallet';
    RAISE NOTICE '3. Check if balances now show correctly';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Migration complete!';
END $$;
