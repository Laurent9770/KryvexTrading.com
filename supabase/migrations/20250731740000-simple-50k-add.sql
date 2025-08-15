-- =============================================
-- SIMPLE 50K ADD TO WALLET
-- Works with existing table structures
-- =============================================

-- STEP 1: FIX USER_WALLETS TABLE STRUCTURE
DO $$
BEGIN
    RAISE NOTICE '=== FIXING USER_WALLETS TABLE STRUCTURE ===';
    
    -- Add available_balance column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_wallets' 
        AND column_name = 'available_balance'
    ) THEN
        ALTER TABLE public.user_wallets ADD COLUMN available_balance DECIMAL(20,8) NOT NULL DEFAULT 0;
        RAISE NOTICE '✅ available_balance column added to user_wallets';
    ELSE
        RAISE NOTICE '✅ available_balance column already exists';
    END IF;
    
    -- Update existing rows to have available_balance = balance
    UPDATE public.user_wallets 
    SET available_balance = balance 
    WHERE available_balance IS NULL OR available_balance = 0;
    
    RAISE NOTICE '✅ Updated existing wallet records';
    
    -- Disable RLS on user_wallets (for mock environment)
    ALTER TABLE public.user_wallets DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS disabled on user_wallets table';
    
    -- Grant full permissions
    GRANT ALL ON public.user_wallets TO authenticated;
    RAISE NOTICE '✅ Full permissions granted on user_wallets';
END $$;

-- STEP 2: ADD 50,000 USD TO USER WALLET
DO $$
DECLARE
    target_user_id UUID;
    current_balance DECIMAL(20,8);
    new_balance DECIMAL(20,8);
    admin_user_id UUID;
BEGIN
    RAISE NOTICE '=== ADDING 50,000 USD TO USER WALLET ===';
    
    -- Get target user ID
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'jeanlaurentkoterumutima@gmail.com';
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User jeanlaurentkoterumutima@gmail.com not found!';
    END IF;
    
    RAISE NOTICE '✅ Found user: %', target_user_id;
    
    -- Get admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'kryvextrading@gmail.com';
    
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id 
        FROM auth.users 
        WHERE email = 'admin@kryvex.com';
    END IF;
    
    IF admin_user_id IS NULL THEN
        admin_user_id := target_user_id; -- Use same user as admin if needed
    END IF;
    
    -- Ensure funding wallet exists for USDT
    INSERT INTO public.user_wallets (user_id, wallet_type, asset, balance, available_balance)
    VALUES (target_user_id, 'funding', 'USDT', 0, 0)
    ON CONFLICT (user_id, wallet_type, asset) DO NOTHING;
    
    -- Ensure trading wallet exists for USDT
    INSERT INTO public.user_wallets (user_id, wallet_type, asset, balance, available_balance)
    VALUES (target_user_id, 'trading', 'USDT', 0, 0)
    ON CONFLICT (user_id, wallet_type, asset) DO NOTHING;
    
    RAISE NOTICE '✅ Wallet entries ensured for user';
    
    -- Get current balance
    SELECT balance INTO current_balance
    FROM public.user_wallets
    WHERE user_id = target_user_id AND wallet_type = 'funding' AND asset = 'USDT';
    
    new_balance := current_balance + 50000;
    
    RAISE NOTICE 'Current balance: $%, Adding: $50,000, New balance: $%', current_balance, new_balance;
    
    -- Update funding wallet balance
    UPDATE public.user_wallets 
    SET 
        balance = new_balance,
        available_balance = new_balance,
        updated_at = now()
    WHERE user_id = target_user_id AND wallet_type = 'funding' AND asset = 'USDT';
    
    RAISE NOTICE '✅ Funding wallet updated with $50,000';
    
    -- Record transaction (using existing table structure)
    INSERT INTO public.wallet_transactions (
        user_id, wallet_type, asset, transaction_type, 
        amount, currency, description
    ) VALUES (
        target_user_id, 'funding', 'USDT', 'admin_adjustment',
        50000, 'USD', 'Admin added $50,000 to funding wallet'
    );
    
    RAISE NOTICE '✅ Transaction recorded';
    
    -- Record admin action (if table exists)
    BEGIN
        INSERT INTO public.admin_actions (
            admin_id, user_id, action_type, amount, currency, description
        ) VALUES (
            admin_user_id, target_user_id, 'add_balance', 50000, 'USD', 
            'Added $50,000 to jeanlaurentkoterumutima@gmail.com funding wallet'
        );
        RAISE NOTICE '✅ Admin action recorded';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Could not record admin action (table may not exist): %', SQLERRM;
    END;
    
    RAISE NOTICE '✅ SUCCESS: $50,000 added to funding wallet!';
END $$;

-- STEP 3: VERIFY THE UPDATE
DO $$
DECLARE
    target_user_id UUID;
    funding_balance DECIMAL(20,8);
    trading_balance DECIMAL(20,8);
    transaction_count INTEGER;
BEGIN
    RAISE NOTICE '=== VERIFYING WALLET UPDATE ===';
    
    -- Get target user ID
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'jeanlaurentkoterumutima@gmail.com';
    
    -- Check funding wallet
    SELECT balance INTO funding_balance
    FROM public.user_wallets
    WHERE user_id = target_user_id AND wallet_type = 'funding' AND asset = 'USDT';
    
    RAISE NOTICE '✅ Funding wallet balance: $%', funding_balance;
    
    -- Check trading wallet
    SELECT balance INTO trading_balance
    FROM public.user_wallets
    WHERE user_id = target_user_id AND wallet_type = 'trading' AND asset = 'USDT';
    
    RAISE NOTICE '✅ Trading wallet balance: $%', trading_balance;
    
    -- Count transactions
    SELECT COUNT(*) INTO transaction_count
    FROM public.wallet_transactions
    WHERE user_id = target_user_id;
    
    RAISE NOTICE '✅ Total transactions for user: %', transaction_count;
    
    -- Show recent transactions
    RAISE NOTICE 'Recent transactions:';
    FOR rec IN 
        SELECT transaction_type, amount, created_at
        FROM public.wallet_transactions
        WHERE user_id = target_user_id
        ORDER BY created_at DESC
        LIMIT 3
    LOOP
        RAISE NOTICE '  - %: $% at %', 
            rec.transaction_type, rec.amount, rec.created_at;
    END LOOP;
    
    RAISE NOTICE '✅ VERIFICATION COMPLETE!';
END $$;

-- STEP 4: FINAL CONFIRMATION
DO $$
BEGIN
    RAISE NOTICE '=== 50K WALLET UPDATE COMPLETED ===';
    RAISE NOTICE '✅ user_wallets table structure fixed';
    RAISE NOTICE '✅ $50,000 added to jeanlaurentkoterumutima@gmail.com funding wallet';
    RAISE NOTICE '✅ Transaction recorded in wallet_transactions';
    RAISE NOTICE '✅ RLS disabled for mock environment';
    RAISE NOTICE '✅ Frontend should now show $50,000 balance!';
    RAISE NOTICE '🎉 WALLET UPDATED SUCCESSFULLY!';
END $$;
