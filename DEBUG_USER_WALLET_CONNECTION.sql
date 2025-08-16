-- =====================================================
-- DEBUG USER WALLET CONNECTION
-- =====================================================
-- Check if user dashboard is connected to wallet
-- =====================================================

-- 1. CHECK USER EXISTS
-- =====================================================

DO $$
DECLARE
    target_user_id UUID;
    target_email TEXT := 'jeanlaurentkoterumutima@gmail.com';
    user_role TEXT;
    wallet_record RECORD;
    tx_record RECORD;
    action_record RECORD;
BEGIN
    RAISE NOTICE '🔍 Checking user: %', target_email;
    
    -- Find user by email
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = target_email;
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE '❌ User not found: %', target_email;
        RETURN;
    ELSE
        RAISE NOTICE '✅ User found: % (ID: %)', target_email, target_user_id;
    END IF;
    
    -- 2. CHECK USER ROLES
    -- =====================================================
    
    RAISE NOTICE '🔍 Checking user roles...';
    
    SELECT role INTO user_role
    FROM public.user_roles
    WHERE user_id = target_user_id;
    
    IF user_role IS NULL THEN
        RAISE NOTICE '⚠️ No role found for user';
    ELSE
        RAISE NOTICE '✅ User role: %', user_role;
    END IF;
    
    -- 3. CHECK USER WALLETS
    -- =====================================================
    
    RAISE NOTICE '🔍 Checking user wallets...';
    
    FOR wallet_record IN 
        SELECT wallet_type, asset, balance, updated_at
        FROM public.user_wallets
        WHERE user_id = target_user_id
        ORDER BY wallet_type, asset
    LOOP
        RAISE NOTICE '💰 Wallet: % % - Balance: % (Updated: %)', 
            wallet_record.wallet_type, 
            wallet_record.asset, 
            wallet_record.balance, 
            wallet_record.updated_at;
    END LOOP;
    
    -- 4. CHECK PROFILE DATA
    -- =====================================================
    
    RAISE NOTICE '🔍 Checking profile data...';
    
    SELECT account_balance, is_verified, kyc_status, updated_at INTO STRICT
    FROM public.profiles
    WHERE user_id = target_user_id;
    
    RAISE NOTICE '📊 Profile - Account Balance: %, Verified: %, KYC: %, Updated: %', 
        account_balance, is_verified, kyc_status, updated_at;
    
    -- 5. TEST WALLET FUNCTIONS
    -- =====================================================
    
    RAISE NOTICE '🔍 Testing wallet functions...';
    
    -- Test get_user_wallet_summary
    BEGIN
        PERFORM get_user_wallet_summary(target_user_id);
        RAISE NOTICE '✅ get_user_wallet_summary function works';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ get_user_wallet_summary function failed: %', SQLERRM;
    END;
    
    -- Test sync_user_wallet_from_database
    BEGIN
        PERFORM sync_user_wallet_from_database(target_user_id);
        RAISE NOTICE '✅ sync_user_wallet_from_database function works';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ sync_user_wallet_from_database function failed: %', SQLERRM;
    END;
    
    -- 6. CHECK WALLET TRANSACTIONS
    -- =====================================================
    
    RAISE NOTICE '🔍 Checking wallet transactions...';
    
    SELECT COUNT(*) INTO STRICT
    FROM public.wallet_transactions
    WHERE user_id = target_user_id;
    
    RAISE NOTICE '📊 Total transactions: %', COUNT;
    
    -- Show recent transactions with correct column names
    FOR tx_record IN 
        SELECT transaction_type, amount, currency, wallet_type, action, remarks, created_at
        FROM public.wallet_transactions
        WHERE user_id = target_user_id
        ORDER BY created_at DESC
        LIMIT 5
    LOOP
        RAISE NOTICE '💳 Transaction: % % % (%s) - Action: % - Remarks: % - Created: %', 
            tx_record.transaction_type, 
            tx_record.amount, 
            tx_record.currency, 
            tx_record.wallet_type, 
            tx_record.action,
            tx_record.remarks,
            tx_record.created_at;
    END LOOP;
    
    -- 7. CHECK ADMIN ACTIONS
    -- =====================================================
    
    RAISE NOTICE '🔍 Checking admin actions...';
    
    SELECT COUNT(*) INTO STRICT
    FROM public.admin_actions
    WHERE target_user_id = target_user_id;
    
    RAISE NOTICE '📊 Total admin actions: %', COUNT;
    
    -- Show recent admin actions
    FOR action_record IN 
        SELECT action_type, description, created_at
        FROM public.admin_actions
        WHERE target_user_id = target_user_id
        ORDER BY created_at DESC
        LIMIT 5
    LOOP
        RAISE NOTICE '👨‍💼 Admin Action: % - %s', 
            action_record.action_type, 
            action_record.description;
    END LOOP;
    
    -- 8. CALCULATE EXPECTED FRONTEND VALUES
    -- =====================================================
    
    RAISE NOTICE '🔍 Calculating expected frontend values...';
    
    DECLARE
        total_balance NUMERIC := 0;
        funding_balance NUMERIC := 0;
        trading_balance NUMERIC := 0;
    BEGIN
        -- Calculate total balance from wallets
        SELECT COALESCE(SUM(balance), 0) INTO total_balance
        FROM public.user_wallets
        WHERE user_id = target_user_id;
        
        -- Get funding balance
        SELECT COALESCE(balance, 0) INTO funding_balance
        FROM public.user_wallets
        WHERE user_id = target_user_id 
        AND wallet_type = 'funding' 
        AND asset = 'USDT';
        
        -- Get trading balance
        SELECT COALESCE(balance, 0) INTO trading_balance
        FROM public.user_wallets
        WHERE user_id = target_user_id 
        AND wallet_type = 'trading' 
        AND asset = 'USDT';
        
        RAISE NOTICE '💰 Expected Frontend Values:';
        RAISE NOTICE '   Total Balance: $%', total_balance;
        RAISE NOTICE '   Funding Balance: $%', funding_balance;
        RAISE NOTICE '   Trading Balance: $%', trading_balance;
        
        -- Check if profile account_balance matches
        IF total_balance != (SELECT account_balance FROM public.profiles WHERE user_id = target_user_id) THEN
            RAISE NOTICE '⚠️ WARNING: Profile account_balance does not match wallet sum!';
            RAISE NOTICE '   Profile shows: $%', (SELECT account_balance FROM public.profiles WHERE user_id = target_user_id);
            RAISE NOTICE '   Wallet sum is: $%', total_balance;
        ELSE
            RAISE NOTICE '✅ Profile account_balance matches wallet sum';
        END IF;
    END;
    
    RAISE NOTICE '🎯 DEBUG COMPLETE - Check the values above to see if they match the frontend!';
    
END $$;
