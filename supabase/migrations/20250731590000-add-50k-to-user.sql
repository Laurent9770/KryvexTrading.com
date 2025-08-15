-- =============================================
-- ADD 50K TO USER ACCOUNT
-- Add 50,000 USD to jeanlaurentkoterumutima@gmail.com
-- =============================================

DO $$
DECLARE
    target_user_id UUID;
    current_balance NUMERIC;
    new_balance NUMERIC;
BEGIN
    RAISE NOTICE '=== ADDING 50K TO USER ACCOUNT ===';
    
    -- Get the user ID
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'jeanlaurentkoterumutima@gmail.com';
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE '❌ User jeanlaurentkoterumutima@gmail.com not found';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Found user: %', target_user_id;
    
    -- Get current balance from profiles
    SELECT COALESCE(account_balance, 0) INTO current_balance
    FROM public.profiles
    WHERE user_id = target_user_id;
    
    RAISE NOTICE '💰 Current balance: $%', current_balance;
    
    -- Calculate new balance
    new_balance := current_balance + 50000;
    
    RAISE NOTICE '💰 New balance will be: $%', new_balance;
    
    -- Update profile balance
    UPDATE public.profiles
    SET 
        account_balance = new_balance,
        updated_at = NOW()
    WHERE user_id = target_user_id;
    
    RAISE NOTICE '✅ Profile balance updated successfully';
    
    -- Update or create user_wallets entry for USD
    INSERT INTO public.user_wallets (user_id, wallet_type, asset, balance, created_at, updated_at)
    VALUES (target_user_id, 'funding', 'USD', 50000, NOW(), NOW())
    ON CONFLICT (user_id, wallet_type, asset) 
    DO UPDATE SET 
        balance = user_wallets.balance + 50000,
        updated_at = NOW();
    
    RAISE NOTICE '✅ User wallet updated successfully';
    
    -- Create wallet transaction record
    INSERT INTO public.wallet_transactions (
        user_id,
        transaction_type,
        amount,
        currency,
        status,
        wallet_type,
        description,
        admin_id,
        processed_at
    ) VALUES (
        target_user_id,
        'deposit',
        50000,
        'USD',
        'completed',
        'funding',
        'Admin funding: Added 50K to user account',
        target_user_id, -- Using target user as admin for this migration
        NOW()
    );
    
    RAISE NOTICE '✅ Wallet transaction recorded';
    
    -- Log admin action
    INSERT INTO public.admin_actions (
        admin_id,
        action_type,
        target_user_id,
        table_name,
        record_id,
        old_values,
        new_values,
        description,
        created_at
    ) VALUES (
        target_user_id, -- Using target user as admin for this migration
        'wallet_fund',
        target_user_id,
        'user_wallets',
        gen_random_uuid(),
        '{"previous_balance": ' || current_balance || '}'::jsonb,
        '{"wallet_type": "funding", "amount": 50000, "currency": "USD", "new_balance": ' || new_balance || ', "remarks": "Added 50K to user account"}'::jsonb,
        'Added 50,000 USD to jeanlaurentkoterumutima@gmail.com account',
        NOW()
    );
    
    RAISE NOTICE '✅ Admin action logged';
    
    -- Verify the update
    SELECT COALESCE(account_balance, 0) INTO new_balance
    FROM public.profiles
    WHERE user_id = target_user_id;
    
    RAISE NOTICE '✅ VERIFICATION: New balance is $%', new_balance;
    RAISE NOTICE '✅ Successfully added 50K to jeanlaurentkoterumutima@gmail.com account!';
    
END $$;
