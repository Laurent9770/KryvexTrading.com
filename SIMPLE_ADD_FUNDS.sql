-- =====================================================
-- SIMPLE ADD FUNDS TO USER WALLET
-- =====================================================
-- Add funds without transaction record to avoid constraint issues
-- =====================================================

DO $$
DECLARE
    target_user_id UUID;
    target_email TEXT := 'jeanlaurentkoterumutima@gmail.com';
    amount_to_add NUMERIC := 50000;
BEGIN
    RAISE NOTICE '💰 Adding $% to user: %', amount_to_add, target_email;
    
    -- Find user by email
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = target_email;
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE '❌ User not found: %', target_email;
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ User found: % (ID: %)', target_email, target_user_id;
    
    -- Get current funding balance
    DECLARE
        current_balance NUMERIC := 0;
        new_balance NUMERIC := 0;
    BEGIN
        SELECT COALESCE(balance, 0) INTO current_balance
        FROM public.user_wallets
        WHERE user_id = target_user_id 
        AND wallet_type = 'funding' 
        AND asset = 'USDT';
        
        new_balance := current_balance + amount_to_add;
        
        RAISE NOTICE '📊 Current funding balance: $%', current_balance;
        RAISE NOTICE '📊 New funding balance will be: $%', new_balance;
        
        -- Update funding wallet
        UPDATE public.user_wallets
        SET balance = new_balance, updated_at = NOW()
        WHERE user_id = target_user_id 
        AND wallet_type = 'funding' 
        AND asset = 'USDT';
        
        -- Update profile account_balance
        UPDATE public.profiles
        SET account_balance = (
            SELECT COALESCE(SUM(balance), 0)
            FROM public.user_wallets
            WHERE user_id = target_user_id
        ), updated_at = NOW()
        WHERE user_id = target_user_id;
        
        RAISE NOTICE '✅ Successfully added $% to funding wallet', amount_to_add;
        RAISE NOTICE '✅ Profile account_balance updated';
        
        -- Verify the update
        SELECT COALESCE(balance, 0) INTO new_balance
        FROM public.user_wallets
        WHERE user_id = target_user_id 
        AND wallet_type = 'funding' 
        AND asset = 'USDT';
        
        RAISE NOTICE '✅ Verification - New funding balance: $%', new_balance;
        
        -- Show total balance
        SELECT COALESCE(SUM(balance), 0) INTO new_balance
        FROM public.user_wallets
        WHERE user_id = target_user_id;
        
        RAISE NOTICE '✅ Total balance across all wallets: $%', new_balance;
        
    END;
    
    RAISE NOTICE '🎯 FUNDS ADDED SUCCESSFULLY!';
    RAISE NOTICE '🔄 The user should now see the updated balance on their dashboard.';
    RAISE NOTICE '📱 If the frontend still shows $0.00, there may be a caching or sync issue.';
    
END $$;
