-- =============================================
-- ADMIN WALLET TRANSACTION FUNCTION
-- Allows admins to send money to users securely
-- =============================================

-- Step 1: Create the main admin wallet transaction function
CREATE OR REPLACE FUNCTION admin_send_money_to_user(
    target_user_email TEXT,
    amount NUMERIC,
    currency TEXT DEFAULT 'USD',
    wallet_type TEXT DEFAULT 'funding',
    description TEXT DEFAULT 'Admin funding',
    admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_user_id UUID;
    target_user_id UUID;
    current_balance NUMERIC;
    new_balance NUMERIC;
    transaction_id UUID;
    admin_action_id UUID;
    result JSONB;
BEGIN
    -- Get admin user ID
    admin_user_id := auth.uid();
    
    -- Check if admin is authenticated
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Admin must be authenticated';
    END IF;
    
    -- Check if admin has admin role
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = admin_user_id AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can perform this action';
    END IF;
    
    -- Get target user ID
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = target_user_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Target user not found: %', target_user_email;
    END IF;
    
    -- Validate amount
    IF amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than 0';
    END IF;
    
    -- Validate currency
    IF currency NOT IN ('USD', 'EUR', 'GBP', 'BTC', 'ETH') THEN
        RAISE EXCEPTION 'Unsupported currency: %', currency;
    END IF;
    
    -- Validate wallet type
    IF wallet_type NOT IN ('funding', 'trading') THEN
        RAISE EXCEPTION 'Invalid wallet type: %', wallet_type;
    END IF;
    
    -- Get current balance from user_wallets
    SELECT COALESCE(balance, 0) INTO current_balance
    FROM public.user_wallets
    WHERE user_id = target_user_id 
    AND wallet_type = admin_send_money_to_user.wallet_type 
    AND asset = currency;
    
    -- Calculate new balance
    new_balance := current_balance + amount;
    
    -- Generate transaction ID
    transaction_id := gen_random_uuid();
    admin_action_id := gen_random_uuid();
    
    -- Start transaction
    BEGIN
        -- Update or create user_wallets entry
        INSERT INTO public.user_wallets (user_id, wallet_type, asset, balance, created_at, updated_at)
        VALUES (target_user_id, wallet_type, currency, amount, NOW(), NOW())
        ON CONFLICT (user_id, wallet_type, asset) 
        DO UPDATE SET 
            balance = user_wallets.balance + amount,
            updated_at = NOW();
        
        -- Update profiles account_balance if it exists and currency is USD
        IF currency = 'USD' THEN
            UPDATE public.profiles
            SET 
                account_balance = COALESCE(account_balance, 0) + amount,
                updated_at = NOW()
            WHERE user_id = target_user_id;
        END IF;
        
        -- Create wallet transaction record
        INSERT INTO public.wallet_transactions (
            id,
            user_id,
            transaction_type,
            amount,
            currency,
            status,
            wallet_type,
            description,
            admin_id,
            processed_at,
            created_at
        ) VALUES (
            transaction_id,
            target_user_id,
            'deposit',
            amount,
            currency,
            'completed',
            wallet_type,
            description,
            admin_user_id,
            NOW(),
            NOW()
        );
        
        -- Log admin action
        INSERT INTO public.admin_actions (
            id,
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
            admin_action_id,
            admin_user_id,
            'wallet_fund',
            target_user_id,
            'user_wallets',
            transaction_id,
            jsonb_build_object(
                'previous_balance', current_balance,
                'wallet_type', wallet_type,
                'currency', currency
            ),
            jsonb_build_object(
                'amount_added', amount,
                'new_balance', new_balance,
                'wallet_type', wallet_type,
                'currency', currency,
                'admin_notes', admin_notes
            ),
            'Admin sent ' || amount || ' ' || currency || ' to ' || target_user_email || ' (' || wallet_type || ' wallet)',
            NOW()
        );
        
        -- Create result object
        result := jsonb_build_object(
            'success', true,
            'transaction_id', transaction_id,
            'admin_action_id', admin_action_id,
            'target_user_email', target_user_email,
            'target_user_id', target_user_id,
            'amount', amount,
            'currency', currency,
            'wallet_type', wallet_type,
            'previous_balance', current_balance,
            'new_balance', new_balance,
            'description', description,
            'processed_at', NOW()
        );
        
        RETURN result;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback on error
            RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
    END;
END;
$$;

-- Step 2: Create function to get user wallet balance
CREATE OR REPLACE FUNCTION get_user_wallet_balance(
    target_user_email TEXT DEFAULT NULL,
    wallet_type TEXT DEFAULT NULL,
    currency TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    target_user_id UUID;
    result JSONB;
    wallet_data JSONB;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- If no target email provided, use current user
    IF target_user_email IS NULL THEN
        target_user_id := current_user_id;
    ELSE
        -- Get target user ID
        SELECT id INTO target_user_id 
        FROM auth.users 
        WHERE email = target_user_email;
        
        IF target_user_id IS NULL THEN
            RAISE EXCEPTION 'Target user not found: %', target_user_email;
        END IF;
        
        -- Check if current user can view this user's balance
        IF current_user_id != target_user_id AND 
           NOT EXISTS (
               SELECT 1 FROM public.user_roles 
               WHERE user_id = current_user_id AND role = 'admin'
           ) THEN
            RAISE EXCEPTION 'Unauthorized to view this user''s balance';
        END IF;
    END IF;
    
    -- Build wallet data
    SELECT jsonb_agg(
        jsonb_build_object(
            'wallet_type', uw.wallet_type,
            'asset', uw.asset,
            'balance', uw.balance,
            'updated_at', uw.updated_at
        )
    ) INTO wallet_data
    FROM public.user_wallets uw
    WHERE uw.user_id = target_user_id
    AND (wallet_type IS NULL OR uw.wallet_type = get_user_wallet_balance.wallet_type)
    AND (currency IS NULL OR uw.asset = get_user_wallet_balance.currency);
    
    -- Get user info
    SELECT jsonb_build_object(
        'user_id', target_user_id,
        'email', u.email,
        'full_name', p.full_name,
        'account_balance', COALESCE(p.account_balance, 0),
        'wallets', COALESCE(wallet_data, '[]'::jsonb),
        'total_balance_usd', (
            SELECT COALESCE(SUM(balance), 0)
            FROM public.user_wallets
            WHERE user_id = target_user_id AND asset = 'USD'
        ),
        'last_updated', (
            SELECT MAX(updated_at)
            FROM public.user_wallets
            WHERE user_id = target_user_id
        )
    ) INTO result
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.user_id
    WHERE u.id = target_user_id;
    
    RETURN result;
END;
$$;

-- Step 3: Create function to get user transaction history
CREATE OR REPLACE FUNCTION get_user_transaction_history(
    target_user_email TEXT DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    target_user_id UUID;
    result JSONB;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- If no target email provided, use current user
    IF target_user_email IS NULL THEN
        target_user_id := current_user_id;
    ELSE
        -- Get target user ID
        SELECT id INTO target_user_id 
        FROM auth.users 
        WHERE email = target_user_email;
        
        IF target_user_id IS NULL THEN
            RAISE EXCEPTION 'Target user not found: %', target_user_email;
        END IF;
        
        -- Check if current user can view this user's transactions
        IF current_user_id != target_user_id AND 
           NOT EXISTS (
               SELECT 1 FROM public.user_roles 
               WHERE user_id = current_user_id AND role = 'admin'
           ) THEN
            RAISE EXCEPTION 'Unauthorized to view this user''s transactions';
        END IF;
    END IF;
    
    -- Get transaction history
    SELECT jsonb_build_object(
        'user_id', target_user_id,
        'transactions', jsonb_agg(
            jsonb_build_object(
                'id', wt.id,
                'transaction_type', wt.transaction_type,
                'amount', wt.amount,
                'currency', wt.currency,
                'status', wt.status,
                'wallet_type', wt.wallet_type,
                'description', wt.description,
                'processed_at', wt.processed_at,
                'created_at', wt.created_at
            ) ORDER BY wt.created_at DESC
        ),
        'total_count', COUNT(*)
    ) INTO result
    FROM public.wallet_transactions wt
    WHERE wt.user_id = target_user_id
    LIMIT limit_count
    OFFSET offset_count;
    
    RETURN result;
END;
$$;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION admin_send_money_to_user(TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_wallet_balance(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_transaction_history(TEXT, INTEGER, INTEGER) TO authenticated;

-- Step 5: Test the functions
DO $$
DECLARE
    test_result JSONB;
BEGIN
    RAISE NOTICE '=== TESTING ADMIN WALLET FUNCTIONS ===';
    
    -- Test get_user_wallet_balance for current user
    SELECT get_user_wallet_balance() INTO test_result;
    RAISE NOTICE '✅ get_user_wallet_balance test: %', test_result;
    
    -- Test get_user_transaction_history for current user
    SELECT get_user_transaction_history() INTO test_result;
    RAISE NOTICE '✅ get_user_transaction_history test: %', test_result;
    
    RAISE NOTICE '✅ Admin wallet transaction functions created successfully!';
END $$;
