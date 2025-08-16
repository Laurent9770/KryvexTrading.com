-- =====================================================
-- COMPREHENSIVE SYSTEM FIX FOR MOCK MONEY ENVIRONMENT
-- =====================================================
-- This migration fixes all issues to make the system fully functional
-- All funds and transactions are simulation/mock data for educational purposes only
-- =====================================================

-- 1. FIX ADMINS TABLE STRUCTURE
-- =====================================================

-- Fix admin_id default value issue
ALTER TABLE IF EXISTS public.admins 
ALTER COLUMN admin_id SET DEFAULT gen_random_uuid();

-- Ensure email is unique and indexed
CREATE UNIQUE INDEX IF NOT EXISTS admins_email_unique ON public.admins(email);

-- Add is_super_admin column for future scalability
ALTER TABLE IF EXISTS public.admins 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- 2. FIX IS_ADMIN FUNCTION AMBIGUITY
-- =====================================================

-- Drop conflicting functions
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(UUID) CASCADE;

-- Create single, simplified is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_id_param UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- If no user_id provided, check current user
    IF user_id_param IS NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        );
    ELSE
        -- Check specific user
        RETURN EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = user_id_param AND role = 'admin'
        );
    END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- 3. RELAX RLS POLICIES FOR MOCK ENVIRONMENT
-- =====================================================

-- Disable RLS on admin tables for mock environment
ALTER TABLE IF EXISTS public.admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_actions DISABLE ROW LEVEL SECURITY;

-- Drop overly restrictive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles (mock money)" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile (mock money)" ON public.profiles;

-- Create simplified policies for mock environment
CREATE POLICY "Mock environment - Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Mock environment - Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Mock environment - Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mock environment - Admins have full access" ON public.profiles
    FOR ALL USING (public.is_admin());

-- 4. FIX USER_WALLETS POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can update own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can update all wallets" ON public.user_wallets;

-- Create simplified policies
CREATE POLICY "Mock environment - Users can view own wallets" ON public.user_wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Mock environment - Users can update own wallets" ON public.user_wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Mock environment - Admins have full wallet access" ON public.user_wallets
    FOR ALL USING (public.is_admin());

-- 5. FIX WALLET_TRANSACTIONS POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins can insert all transactions" ON public.wallet_transactions;

-- Create simplified policies
CREATE POLICY "Mock environment - Users can view own transactions" ON public.wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Mock environment - Users can insert own transactions" ON public.wallet_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mock environment - Admins have full transaction access" ON public.wallet_transactions
    FOR ALL USING (public.is_admin());

-- 6. UPDATE ADMIN SEND MONEY FUNCTION
-- =====================================================

DROP FUNCTION IF EXISTS admin_send_money_to_user(TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT) CASCADE;

CREATE OR REPLACE FUNCTION admin_send_money_to_user(
    target_user_email_param TEXT,
    amount_param NUMERIC,
    currency_param TEXT DEFAULT 'USDT',
    wallet_type_param TEXT DEFAULT 'funding',
    description_param TEXT DEFAULT 'Admin funding',
    admin_notes_param TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    target_user_id UUID;
    admin_user_id UUID;
    current_balance NUMERIC;
    new_balance NUMERIC;
    wallet_record RECORD;
    transaction_id UUID;
    admin_action_id UUID;
    result JSONB;
BEGIN
    -- Validate admin access
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    -- Get current user (admin)
    admin_user_id := auth.uid();
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Find target user by email
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = target_user_email_param;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Target user not found: %', target_user_email_param;
    END IF;

    -- Validate amount
    IF amount_param <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    -- Start transaction
    BEGIN
        -- Get or create wallet record
        SELECT * INTO wallet_record
        FROM public.user_wallets
        WHERE user_id = target_user_id 
        AND wallet_type = wallet_type_param 
        AND asset = currency_param;
        
        IF NOT FOUND THEN
            -- Create new wallet record
            INSERT INTO public.user_wallets (user_id, wallet_type, asset, balance, created_at, updated_at)
            VALUES (target_user_id, wallet_type_param, currency_param, 0, NOW(), NOW())
            RETURNING * INTO wallet_record;
        END IF;

        current_balance := wallet_record.balance;
        new_balance := current_balance + amount_param;

        -- Update wallet balance
        UPDATE public.user_wallets
        SET balance = new_balance, updated_at = NOW()
        WHERE id = wallet_record.id;

        -- Create wallet transaction record
        INSERT INTO public.wallet_transactions (
            user_id, transaction_type, amount, currency, status, 
            wallet_type, description, admin_id, processed_at, created_at
        ) VALUES (
            target_user_id, 'admin_funding', amount_param, currency_param, 'completed',
            wallet_type_param, description_param, admin_user_id, NOW(), NOW()
        ) RETURNING id INTO transaction_id;

        -- Log admin action
        INSERT INTO public.admin_actions (
            admin_id, action_type, target_user_id, target_table, target_id,
            old_values, new_values, description, created_at
        ) VALUES (
            admin_user_id, 'wallet_fund', target_user_id, 'user_wallets', wallet_record.id,
            jsonb_build_object('previous_balance', current_balance),
            jsonb_build_object(
                'wallet_type', wallet_type_param,
                'amount', amount_param,
                'currency', currency_param,
                'new_balance', new_balance,
                'remarks', admin_notes_param
            ),
            format('Funded %s wallet with %s %s - %s', 
                   target_user_email_param, amount_param, currency_param, 
                   COALESCE(admin_notes_param, 'No notes')),
            NOW()
        ) RETURNING id INTO admin_action_id;

        -- Update profile account_balance (derived from wallet sum)
        UPDATE public.profiles
        SET account_balance = (
            SELECT COALESCE(SUM(balance), 0)
            FROM public.user_wallets
            WHERE user_id = target_user_id
        ), updated_at = NOW()
        WHERE user_id = target_user_id;

        -- Build result
        result := jsonb_build_object(
            'success', true,
            'transaction_id', transaction_id,
            'admin_action_id', admin_action_id,
            'target_user_email', target_user_email_param,
            'target_user_id', target_user_id,
            'amount', amount_param,
            'currency', currency_param,
            'wallet_type', wallet_type_param,
            'previous_balance', current_balance,
            'new_balance', new_balance,
            'description', description_param,
            'processed_at', NOW()
        );

        RETURN result;

    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback transaction
            RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
    END;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION admin_send_money_to_user(TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 7. UPDATE GET USER WALLET SUMMARY FUNCTION
-- =====================================================

DROP FUNCTION IF EXISTS get_user_wallet_summary(UUID) CASCADE;

CREATE OR REPLACE FUNCTION get_user_wallet_summary(user_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Check access (own data or admin)
    IF auth.uid() != user_id_param AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Get wallet summary from user_wallets table
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_wallet_summary(UUID) TO authenticated;

-- 8. UPDATE SYNC USER WALLET FUNCTION
-- =====================================================

DROP FUNCTION IF EXISTS sync_user_wallet_from_database(UUID) CASCADE;

CREATE OR REPLACE FUNCTION sync_user_wallet_from_database(user_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    wallet_data JSONB;
    result JSONB;
BEGIN
    -- Check access (own data or admin)
    IF auth.uid() != user_id_param AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION sync_user_wallet_from_database(UUID) TO authenticated;

-- 9. CREATE ADMIN DEDUCT MONEY FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION admin_deduct_money_from_user(
    target_user_email_param TEXT,
    amount_param NUMERIC,
    currency_param TEXT DEFAULT 'USDT',
    wallet_type_param TEXT DEFAULT 'funding',
    description_param TEXT DEFAULT 'Admin deduction',
    admin_notes_param TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    target_user_id UUID;
    admin_user_id UUID;
    current_balance NUMERIC;
    new_balance NUMERIC;
    wallet_record RECORD;
    transaction_id UUID;
    admin_action_id UUID;
    result JSONB;
BEGIN
    -- Validate admin access
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    -- Get current user (admin)
    admin_user_id := auth.uid();
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Find target user by email
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = target_user_email_param;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Target user not found: %', target_user_email_param;
    END IF;

    -- Validate amount
    IF amount_param <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    -- Start transaction
    BEGIN
        -- Get wallet record
        SELECT * INTO wallet_record
        FROM public.user_wallets
        WHERE user_id = target_user_id 
        AND wallet_type = wallet_type_param 
        AND asset = currency_param;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Wallet not found for user % with type % and asset %', 
                          target_user_email_param, wallet_type_param, currency_param;
        END IF;

        current_balance := wallet_record.balance;
        
        -- Check sufficient balance
        IF current_balance < amount_param THEN
            RAISE EXCEPTION 'Insufficient balance. Current: % %s, Required: % %s', 
                          current_balance, currency_param, amount_param, currency_param;
        END IF;

        new_balance := current_balance - amount_param;

        -- Update wallet balance
        UPDATE public.user_wallets
        SET balance = new_balance, updated_at = NOW()
        WHERE id = wallet_record.id;

        -- Create wallet transaction record
        INSERT INTO public.wallet_transactions (
            user_id, transaction_type, amount, currency, status, 
            wallet_type, description, admin_id, processed_at, created_at
        ) VALUES (
            target_user_id, 'admin_deduction', amount_param, currency_param, 'completed',
            wallet_type_param, description_param, admin_user_id, NOW(), NOW()
        ) RETURNING id INTO transaction_id;

        -- Log admin action
        INSERT INTO public.admin_actions (
            admin_id, action_type, target_user_id, target_table, target_id,
            old_values, new_values, description, created_at
        ) VALUES (
            admin_user_id, 'wallet_deduct', target_user_id, 'user_wallets', wallet_record.id,
            jsonb_build_object('previous_balance', current_balance),
            jsonb_build_object(
                'wallet_type', wallet_type_param,
                'amount', amount_param,
                'currency', currency_param,
                'new_balance', new_balance,
                'remarks', admin_notes_param
            ),
            format('Deducted %s %s from %s wallet - %s', 
                   amount_param, currency_param, target_user_email_param, 
                   COALESCE(admin_notes_param, 'No notes')),
            NOW()
        ) RETURNING id INTO admin_action_id;

        -- Update profile account_balance (derived from wallet sum)
        UPDATE public.profiles
        SET account_balance = (
            SELECT COALESCE(SUM(balance), 0)
            FROM public.user_wallets
            WHERE user_id = target_user_id
        ), updated_at = NOW()
        WHERE user_id = target_user_id;

        -- Build result
        result := jsonb_build_object(
            'success', true,
            'transaction_id', transaction_id,
            'admin_action_id', admin_action_id,
            'target_user_email', target_user_email_param,
            'target_user_id', target_user_id,
            'amount', amount_param,
            'currency', currency_param,
            'wallet_type', wallet_type_param,
            'previous_balance', current_balance,
            'new_balance', new_balance,
            'description', description_param,
            'processed_at', NOW()
        );

        RETURN result;

    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback transaction
            RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
    END;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION admin_deduct_money_from_user(TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 10. ENSURE ADMIN USERS EXIST
-- =====================================================

DO $$
DECLARE
    admin_emails TEXT[] := ARRAY[
        'kryvextrading@gmail.com',
        'admin@kryvex.com',
        'jeanlaurentkoterumutima@gmail.com'
    ];
    admin_email TEXT;
    admin_user_id UUID;
BEGIN
    FOR admin_email IN SELECT unnest(admin_emails)
    LOOP
        -- Get user ID
        SELECT id INTO admin_user_id
        FROM auth.users
        WHERE email = admin_email;
        
        IF admin_user_id IS NOT NULL THEN
            -- Ensure admin role exists
            INSERT INTO public.user_roles (user_id, role, created_at)
            VALUES (admin_user_id, 'admin', NOW())
            ON CONFLICT (user_id, role) DO NOTHING;
            
            -- Ensure admin record exists
            INSERT INTO public.admins (admin_id, user_id, email, is_super_admin, created_at, updated_at)
            VALUES (gen_random_uuid(), admin_user_id, admin_email, true, NOW(), NOW())
            ON CONFLICT (email) DO NOTHING;
            
            RAISE NOTICE 'Admin user ensured: %', admin_email;
        ELSE
            RAISE NOTICE 'User not found for admin: %', admin_email;
        END IF;
    END LOOP;
END $$;

-- 11. CREATE DEFAULT WALLETS FOR EXISTING USERS
-- =====================================================

DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id, email FROM auth.users
    LOOP
        -- Create default funding wallet if not exists
        INSERT INTO public.user_wallets (user_id, wallet_type, asset, balance, created_at, updated_at)
        VALUES (user_record.id, 'funding', 'USDT', 5000.00, NOW(), NOW())
        ON CONFLICT (user_id, wallet_type, asset) DO NOTHING;
        
        -- Create default trading wallets if not exist
        INSERT INTO public.user_wallets (user_id, wallet_type, asset, balance, created_at, updated_at)
        VALUES 
            (user_record.id, 'trading', 'USDT', 1000.00, NOW(), NOW()),
            (user_record.id, 'trading', 'BTC', 0.00, NOW(), NOW()),
            (user_record.id, 'trading', 'ETH', 0.00, NOW(), NOW())
        ON CONFLICT (user_id, wallet_type, asset) DO NOTHING;
        
        -- Update profile account_balance
        UPDATE public.profiles
        SET account_balance = (
            SELECT COALESCE(SUM(balance), 0)
            FROM public.user_wallets
            WHERE user_id = user_record.id
        ), updated_at = NOW()
        WHERE user_id = user_record.id;
        
        RAISE NOTICE 'Default wallets created for user: %', user_record.email;
    END LOOP;
END $$;

-- 12. TEST THE SYSTEM
-- =====================================================

DO $$
DECLARE
    test_user_id UUID;
    test_result JSONB;
BEGIN
    -- Get a test user
    SELECT id INTO test_user_id
    FROM auth.users
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test get_user_wallet_summary
        SELECT get_user_wallet_summary(test_user_id) INTO test_result;
        RAISE NOTICE '✅ get_user_wallet_summary test: %', test_result;
        
        -- Test sync_user_wallet_from_database
        SELECT sync_user_wallet_from_database(test_user_id) INTO test_result;
        RAISE NOTICE '✅ sync_user_wallet_from_database test: %', test_result;
    END IF;
END $$;

-- 13. FINAL VERIFICATION
-- =====================================================

DO $$
DECLARE
    admin_count INTEGER;
    wallet_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Count admins
    SELECT COUNT(*) INTO admin_count FROM public.admins;
    RAISE NOTICE '📊 Total admins: %', admin_count;
    
    -- Count wallets
    SELECT COUNT(*) INTO wallet_count FROM public.user_wallets;
    RAISE NOTICE '📊 Total wallet records: %', wallet_count;
    
    -- Count functions
    SELECT COUNT(*) INTO function_count 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('is_admin', 'admin_send_money_to_user', 'admin_deduct_money_from_user', 'get_user_wallet_summary', 'sync_user_wallet_from_database');
    RAISE NOTICE '📊 Total functions: %', function_count;
    
    RAISE NOTICE '🎉 SYSTEM FIX COMPLETE - All mock money functionality should now work!';
END $$;
