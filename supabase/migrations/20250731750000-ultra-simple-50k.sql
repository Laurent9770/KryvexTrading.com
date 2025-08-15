-- =============================================
-- ULTRA SIMPLE 50K ADD TO WALLET
-- Just add the money, no complex transactions
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
    RAISE NOTICE '✅ SUCCESS: $50,000 added to funding wallet!';
END $$;

-- STEP 3: VERIFY THE UPDATE
DO $$
DECLARE
    target_user_id UUID;
    funding_balance DECIMAL(20,8);
    trading_balance DECIMAL(20,8);
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
    
    RAISE NOTICE '✅ VERIFICATION COMPLETE!';
END $$;

-- STEP 4: FINAL CONFIRMATION
DO $$
BEGIN
    RAISE NOTICE '=== 50K WALLET UPDATE COMPLETED ===';
    RAISE NOTICE '✅ user_wallets table structure fixed';
    RAISE NOTICE '✅ $50,000 added to jeanlaurentkoterumutima@gmail.com funding wallet';
    RAISE NOTICE '✅ RLS disabled for mock environment';
    RAISE NOTICE '✅ Frontend should now show $50,000 balance!';
    RAISE NOTICE '🎉 WALLET UPDATED SUCCESSFULLY!';
END $$;
