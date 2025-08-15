-- =============================================
-- FRONTEND WALLET TEST
-- Simulate what the frontend is doing
-- =============================================

DO $$
DECLARE
    target_user_id UUID;
    wallet_summary JSONB;
    trading_account JSONB;
    funding_account JSONB;
    total_balance NUMERIC;
    asset_record RECORD;
    rec RECORD;
BEGIN
    RAISE NOTICE '=== FRONTEND WALLET TEST ===';
    
    -- Get target user ID
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'jeanlaurentkoterumutima@gmail.com';
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE '❌ User jeanlaurentkoterumutima@gmail.com not found!';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Found user: %', target_user_id;
    
    -- Test the exact function the frontend calls
    RAISE NOTICE '=== TESTING get_user_wallet_summary (FRONTEND CALL) ===';
    
    BEGIN
        SELECT get_user_wallet_summary(target_user_id) INTO wallet_summary;
        
        RAISE NOTICE '✅ Raw wallet summary: %', wallet_summary;
        
        -- Extract the parts the frontend uses
        trading_account := wallet_summary->'trading_account';
        funding_account := wallet_summary->'funding_account';
        total_balance := (wallet_summary->>'total_balance')::NUMERIC;
        
        RAISE NOTICE '📊 Trading Account: %', trading_account;
        RAISE NOTICE '💰 Funding Account: %', funding_account;
        RAISE NOTICE '💵 Total Balance: $%', total_balance;
        
        -- Check if funding account has USDT
        IF funding_account ? 'USDT' THEN
            RAISE NOTICE '✅ USDT in funding account: %', funding_account->'USDT';
        ELSE
            RAISE NOTICE '❌ No USDT in funding account!';
        END IF;
        
        -- Check trading account assets
        IF jsonb_typeof(trading_account) = 'object' THEN
            RAISE NOTICE '📈 Trading account assets:';
            FOR asset_record IN SELECT * FROM jsonb_each(trading_account)
            LOOP
                RAISE NOTICE '  - %: %', asset_record.key, asset_record.value;
            END LOOP;
        ELSE
            RAISE NOTICE '❌ Trading account is not an object: %', trading_account;
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ get_user_wallet_summary error: %', SQLERRM;
    END;
    
    -- Test direct database query (what the function does internally)
    RAISE NOTICE '=== TESTING DIRECT DATABASE QUERY ===';
    
    -- Check funding wallet
    RAISE NOTICE '💰 Direct funding wallet query:';
    FOR rec IN 
        SELECT wallet_type, asset, balance, available_balance, updated_at
        FROM public.user_wallets 
        WHERE user_id = target_user_id AND wallet_type = 'funding'
    LOOP
        RAISE NOTICE '  - % %: Balance = %, Available = %', 
            rec.wallet_type, rec.asset, rec.balance, rec.available_balance;
    END LOOP;
    
    -- Check trading wallet
    RAISE NOTICE '📈 Direct trading wallet query:';
    FOR rec IN 
        SELECT wallet_type, asset, balance, available_balance, updated_at
        FROM public.user_wallets 
        WHERE user_id = target_user_id AND wallet_type = 'trading'
    LOOP
        RAISE NOTICE '  - % %: Balance = %, Available = %', 
            rec.wallet_type, rec.asset, rec.balance, rec.available_balance;
    END LOOP;
    
    -- Test what the frontend would see
    RAISE NOTICE '=== FRONTEND EXPECTED DATA FORMAT ===';
    
    -- Simulate the frontend data structure
    RAISE NOTICE 'Expected fundingAccount.USDT:';
    RAISE NOTICE '  - balance: "50,000.00"';
    RAISE NOTICE '  - usdValue: "$50,000.00"';
    RAISE NOTICE '  - available: "50,000.00"';
    
    RAISE NOTICE 'Expected tradingAccount:';
    RAISE NOTICE '  - USDT: { balance: "0.00000000", usdValue: "$0.00", available: "0.00000000" }';
    RAISE NOTICE '  - BTC: { balance: "0.00000000", usdValue: "$0.00", available: "0.00000000" }';
    RAISE NOTICE '  - ETH: { balance: "0.00000000", usdValue: "$0.00", available: "0.00000000" }';
    
    RAISE NOTICE '=== TEST COMPLETE ===';
END $$;
