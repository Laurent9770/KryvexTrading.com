-- =====================================================
-- DIAGNOSE AND FIX WALLET TRANSACTIONS CONSTRAINT
-- =====================================================
-- Comprehensive diagnostic and fix for action constraint issues
-- =====================================================

-- 1. DIAGNOSE THE CONSTRAINT
-- =====================================================

DO $$
DECLARE
    constraint_def TEXT;
    allowed_actions RECORD;
BEGIN
    RAISE NOTICE '🔍 DIAGNOSING WALLET TRANSACTIONS CONSTRAINT...';
    
    -- Get the exact constraint definition
    SELECT pg_get_constraintdef(oid) INTO constraint_def
    FROM pg_constraint
    WHERE conrelid = 'public.wallet_transactions'::regclass 
    AND conname = 'wallet_transactions_action_check';
    
    RAISE NOTICE '📋 Constraint Definition: %', constraint_def;
    
    -- Show existing action values
    RAISE NOTICE '📊 Existing action values in table:';
    FOR allowed_actions IN 
        SELECT DISTINCT action, transaction_type, COUNT(*) as count
        FROM public.wallet_transactions
        GROUP BY action, transaction_type
        ORDER BY action, transaction_type
    LOOP
        RAISE NOTICE '   Action: % | Transaction Type: % | Count: %', 
            allowed_actions.action, allowed_actions.transaction_type, allowed_actions.count;
    END LOOP;
    
END $$;

-- 2. CHECK COLUMN DETAILS
-- =====================================================

SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'wallet_transactions' 
    AND column_name = 'action';

-- 3. COMPREHENSIVE DIAGNOSTIC AND FIX
-- =====================================================

DO $$
DECLARE
    target_user_id UUID;
    target_email TEXT := 'jeanlaurentkoterumutima@gmail.com';
    amount_to_add NUMERIC := 50000;
    current_balance NUMERIC := 0;
    new_balance NUMERIC := 0;
    constraint_def TEXT;
    transaction_success BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '🎯 STARTING COMPREHENSIVE DIAGNOSTIC AND FIX...';
    
    -- Find user by email
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = target_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION '❌ User not found: %', target_email;
    END IF;
    
    RAISE NOTICE '✅ User found: % (ID: %)', target_email, target_user_id;
    
    -- Get constraint definition
    SELECT pg_get_constraintdef(oid) INTO constraint_def
    FROM pg_constraint
    WHERE conrelid = 'public.wallet_transactions'::regclass 
    AND conname = 'wallet_transactions_action_check';
    
    RAISE NOTICE '📋 Action Constraint: %', constraint_def;
    
    -- Get current funding balance
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
    
    RAISE NOTICE '✅ Wallet balance updated successfully';
    
    -- Try different action values based on existing data
    RAISE NOTICE '🔄 Attempting transaction insertion with different actions...';
    
    -- Try 'admin_fund' (based on existing data)
    BEGIN
        INSERT INTO public.wallet_transactions (
            user_id, action, wallet_type, amount, asset, 
            transaction_type, status, currency, remarks, 
            balance, admin_email, processed_at
        ) VALUES (
            target_user_id, 'admin_fund', 'funding', amount_to_add, 'USDT',
            'deposit', 'completed', 'USDT', 'Admin added funds for testing',
            new_balance, 'admin@kryvex.com', NOW()
        );
        RAISE NOTICE '✅ Transaction inserted successfully with action "admin_fund"';
        transaction_success := TRUE;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Failed with "admin_fund": %', SQLERRM;
        
        -- Try 'credit'
        BEGIN
            INSERT INTO public.wallet_transactions (
                user_id, action, wallet_type, amount, asset, 
                transaction_type, status, currency, remarks, 
                balance, admin_email, processed_at
            ) VALUES (
                target_user_id, 'credit', 'funding', amount_to_add, 'USDT',
                'admin_funding', 'completed', 'USDT', 'Admin added funds for testing',
                new_balance, 'admin@kryvex.com', NOW()
            );
            RAISE NOTICE '✅ Transaction inserted successfully with action "credit"';
            transaction_success := TRUE;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Failed with "credit": %', SQLERRM;
            
            -- Try 'deposit'
            BEGIN
                INSERT INTO public.wallet_transactions (
                    user_id, action, wallet_type, amount, asset, 
                    transaction_type, status, currency, remarks, 
                    balance, admin_email, processed_at
                ) VALUES (
                    target_user_id, 'deposit', 'funding', amount_to_add, 'USDT',
                    'admin_funding', 'completed', 'USDT', 'Admin added funds for testing',
                    new_balance, 'admin@kryvex.com', NOW()
                );
                RAISE NOTICE '✅ Transaction inserted successfully with action "deposit"';
                transaction_success := TRUE;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '❌ Failed with "deposit": %', SQLERRM;
                
                -- Try 'funding'
                BEGIN
                    INSERT INTO public.wallet_transactions (
                        user_id, action, wallet_type, amount, asset, 
                        transaction_type, status, currency, remarks, 
                        balance, admin_email, processed_at
                    ) VALUES (
                        target_user_id, 'funding', 'funding', amount_to_add, 'USDT',
                        'admin_funding', 'completed', 'USDT', 'Admin added funds for testing',
                        new_balance, 'admin@kryvex.com', NOW()
                    );
                    RAISE NOTICE '✅ Transaction inserted successfully with action "funding"';
                    transaction_success := TRUE;
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE '❌ Failed with "funding": %', SQLERRM;
                    RAISE NOTICE '⚠️ All action values failed. Consider fixing the constraint.';
                END;
            END;
        END;
    END;
    
    -- Update profile account_balance
    UPDATE public.profiles
    SET account_balance = (
        SELECT COALESCE(SUM(balance), 0)
        FROM public.user_wallets
        WHERE user_id = target_user_id
    ), updated_at = NOW()
    WHERE user_id = target_user_id;
    
    RAISE NOTICE '✅ Profile account_balance updated';
    
    -- Final verification
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
    
    IF transaction_success THEN
        RAISE NOTICE '🎯 SUCCESS! Funds added and transaction recorded!';
    ELSE
        RAISE NOTICE '⚠️ Funds added but transaction recording failed. Consider fixing constraint.';
    END IF;
    
    RAISE NOTICE '🔄 The user should now see the updated balance on their dashboard.';
    
END $$;

-- 4. OPTIONAL: FIX THE CONSTRAINT (UNCOMMENT IF NEEDED)
-- =====================================================

/*
-- Uncomment these lines if you want to fix the constraint to allow more action values
DO $$
BEGIN
    RAISE NOTICE '🔧 FIXING CONSTRAINT TO ALLOW MORE ACTION VALUES...';
    
    -- Drop the existing constraint
    ALTER TABLE public.wallet_transactions 
    DROP CONSTRAINT IF EXISTS wallet_transactions_action_check;
    
    -- Add a more flexible constraint
    ALTER TABLE public.wallet_transactions 
    ADD CONSTRAINT wallet_transactions_action_check 
    CHECK (action IN ('credit', 'debit', 'deposit', 'withdrawal', 'transfer', 'funding', 'admin_fund'));
    
    RAISE NOTICE '✅ Constraint updated successfully!';
END $$;
*/
