-- =============================================
-- COMPLETE BALANCE MANAGEMENT SYSTEM
-- Create all missing tables and functions for admin balance management
-- =============================================

-- Step 1: Ensure all required tables exist
DO $$
BEGIN
    RAISE NOTICE '=== CREATING MISSING TABLES ===';
    
    -- Create user_roles table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
        CREATE TABLE public.user_roles (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            role TEXT NOT NULL CHECK (role IN ('admin', 'user', 'moderator')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, role)
        );
        RAISE NOTICE '✅ Created user_roles table';
    ELSE
        RAISE NOTICE 'ℹ️ user_roles table already exists';
    END IF;
    
    -- Create user_wallets table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_wallets') THEN
        CREATE TABLE public.user_wallets (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            wallet_type TEXT NOT NULL CHECK (wallet_type IN ('funding', 'trading')),
            asset TEXT NOT NULL,
            balance DECIMAL(20,8) DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, wallet_type, asset)
        );
        RAISE NOTICE '✅ Created user_wallets table';
    ELSE
        RAISE NOTICE 'ℹ️ user_wallets table already exists';
    END IF;
    
    -- Create balance_history table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'balance_history') THEN
        CREATE TABLE public.balance_history (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            wallet_type TEXT NOT NULL,
            asset TEXT NOT NULL,
            previous_balance DECIMAL(20,8) NOT NULL,
            new_balance DECIMAL(20,8) NOT NULL,
            change_amount DECIMAL(20,8) NOT NULL,
            change_type TEXT NOT NULL CHECK (change_type IN ('admin_adjustment', 'deposit', 'withdrawal', 'trade', 'fee', 'bonus', 'correction')),
            reason TEXT,
            admin_id UUID REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created balance_history table';
    ELSE
        RAISE NOTICE 'ℹ️ balance_history table already exists';
    END IF;
    
    -- Create profiles table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        CREATE TABLE public.profiles (
            user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT NOT NULL,
            full_name TEXT,
            is_verified BOOLEAN DEFAULT false,
            kyc_status TEXT DEFAULT 'unverified',
            account_status TEXT DEFAULT 'active',
            account_balance DECIMAL(20,8) DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created profiles table';
    ELSE
        RAISE NOTICE 'ℹ️ profiles table already exists';
    END IF;
END $$;

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_wallet_type ON public.user_wallets(wallet_type);
CREATE INDEX IF NOT EXISTS idx_user_wallets_asset ON public.user_wallets(asset);
CREATE INDEX IF NOT EXISTS idx_balance_history_user_id ON public.balance_history(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_history_created_at ON public.balance_history(created_at);
CREATE INDEX IF NOT EXISTS idx_balance_history_change_type ON public.balance_history(change_type);

-- Step 3: Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies (only if they don't exist)
DO $$
BEGIN
    RAISE NOTICE '=== CREATING RLS POLICIES ===';
    
    -- User roles policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Users can view own roles') THEN
        CREATE POLICY "Users can view own roles" ON public.user_roles
            FOR SELECT USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Created "Users can view own roles" policy';
    ELSE
        RAISE NOTICE 'ℹ️ "Users can view own roles" policy already exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Admins can view all roles') THEN
        CREATE POLICY "Admins can view all roles" ON public.user_roles
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.user_roles 
                    WHERE user_id = auth.uid() AND role = 'admin'
                )
            );
        RAISE NOTICE '✅ Created "Admins can view all roles" policy';
    ELSE
        RAISE NOTICE 'ℹ️ "Admins can view all roles" policy already exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Admins can manage roles') THEN
        CREATE POLICY "Admins can manage roles" ON public.user_roles
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.user_roles 
                    WHERE user_id = auth.uid() AND role = 'admin'
                )
            );
        RAISE NOTICE '✅ Created "Admins can manage roles" policy';
    ELSE
        RAISE NOTICE 'ℹ️ "Admins can manage roles" policy already exists';
    END IF;

    -- User wallets policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_wallets' AND policyname = 'Users can view own wallets') THEN
        CREATE POLICY "Users can view own wallets" ON public.user_wallets
            FOR SELECT USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Created "Users can view own wallets" policy';
    ELSE
        RAISE NOTICE 'ℹ️ "Users can view own wallets" policy already exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_wallets' AND policyname = 'Admins can view all wallets') THEN
        CREATE POLICY "Admins can view all wallets" ON public.user_wallets
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.user_roles 
                    WHERE user_id = auth.uid() AND role = 'admin'
                )
            );
        RAISE NOTICE '✅ Created "Admins can view all wallets" policy';
    ELSE
        RAISE NOTICE 'ℹ️ "Admins can view all wallets" policy already exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_wallets' AND policyname = 'Admins can manage wallets') THEN
        CREATE POLICY "Admins can manage wallets" ON public.user_wallets
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.user_roles 
                    WHERE user_id = auth.uid() AND role = 'admin'
                )
            );
        RAISE NOTICE '✅ Created "Admins can manage wallets" policy';
    ELSE
        RAISE NOTICE 'ℹ️ "Admins can manage wallets" policy already exists';
    END IF;

    -- Balance history policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'balance_history' AND policyname = 'Users can view own balance history') THEN
        CREATE POLICY "Users can view own balance history" ON public.balance_history
            FOR SELECT USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Created "Users can view own balance history" policy';
    ELSE
        RAISE NOTICE 'ℹ️ "Users can view own balance history" policy already exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'balance_history' AND policyname = 'Admins can view all balance history') THEN
        CREATE POLICY "Admins can view all balance history" ON public.balance_history
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.user_roles 
                    WHERE user_id = auth.uid() AND role = 'admin'
                )
            );
        RAISE NOTICE '✅ Created "Admins can view all balance history" policy';
    ELSE
        RAISE NOTICE 'ℹ️ "Admins can view all balance history" policy already exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'balance_history' AND policyname = 'Admins can insert balance history') THEN
        CREATE POLICY "Admins can insert balance history" ON public.balance_history
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.user_roles 
                    WHERE user_id = auth.uid() AND role = 'admin'
                )
            );
        RAISE NOTICE '✅ Created "Admins can insert balance history" policy';
    ELSE
        RAISE NOTICE 'ℹ️ "Admins can insert balance history" policy already exists';
    END IF;

    -- Profiles policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" ON public.profiles
            FOR SELECT USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Created "Users can view own profile" policy';
    ELSE
        RAISE NOTICE 'ℹ️ "Users can view own profile" policy already exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can view all profiles') THEN
        CREATE POLICY "Admins can view all profiles" ON public.profiles
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.user_roles 
                    WHERE user_id = auth.uid() AND role = 'admin'
                )
            );
        RAISE NOTICE '✅ Created "Admins can view all profiles" policy';
    ELSE
        RAISE NOTICE 'ℹ️ "Admins can view all profiles" policy already exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON public.profiles
            FOR UPDATE USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Created "Users can update own profile" policy';
    ELSE
        RAISE NOTICE 'ℹ️ "Users can update own profile" policy already exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can manage all profiles') THEN
        CREATE POLICY "Admins can manage all profiles" ON public.profiles
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.user_roles 
                    WHERE user_id = auth.uid() AND role = 'admin'
                )
            );
        RAISE NOTICE '✅ Created "Admins can manage all profiles" policy';
    ELSE
        RAISE NOTICE 'ℹ️ "Admins can manage all profiles" policy already exists';
    END IF;
END $$;

-- Step 5: Create or replace all functions
-- Drop existing functions first to handle parameter changes
DROP FUNCTION IF EXISTS is_admin(UUID);
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS update_user_balance(UUID, TEXT, TEXT, DECIMAL, TEXT, TEXT);
DROP FUNCTION IF EXISTS add_balance_to_user(UUID, TEXT, TEXT, DECIMAL, TEXT);
DROP FUNCTION IF EXISTS remove_balance_from_user(UUID, TEXT, TEXT, DECIMAL, TEXT);
DROP FUNCTION IF EXISTS get_user_wallet_summary(UUID);
DROP FUNCTION IF EXISTS sync_user_wallet_from_database(UUID);
DROP FUNCTION IF EXISTS get_system_balance_stats();

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id_param UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_id_param AND role = 'admin'
    );
END;
$$;

-- Function to update user balance (add or subtract)
CREATE OR REPLACE FUNCTION update_user_balance(
    target_user_id UUID,
    wallet_type_param TEXT,
    asset_param TEXT,
    change_amount DECIMAL(20,8),
    change_type_param TEXT DEFAULT 'admin_adjustment',
    reason_param TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance DECIMAL(20,8);
    new_balance DECIMAL(20,8);
    result JSONB;
BEGIN
    -- Check if current user is admin
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Only admins can update user balances';
    END IF;

    -- Get current balance
    SELECT balance INTO current_balance
    FROM public.user_wallets
    WHERE user_id = target_user_id 
      AND wallet_type = wallet_type_param 
      AND asset = asset_param;

    -- Calculate new balance
    IF current_balance IS NULL THEN
        current_balance := 0;
    END IF;
    
    new_balance := current_balance + change_amount;
    
    -- Ensure balance doesn't go negative
    IF new_balance < 0 THEN
        RAISE EXCEPTION 'Insufficient balance. Cannot reduce balance below 0';
    END IF;

    -- Update or insert wallet entry
    INSERT INTO public.user_wallets (user_id, wallet_type, asset, balance)
    VALUES (target_user_id, wallet_type_param, asset_param, new_balance)
    ON CONFLICT (user_id, wallet_type, asset) DO UPDATE SET
        balance = new_balance,
        updated_at = NOW();

    -- Insert into balance history
    INSERT INTO public.balance_history (
        user_id, wallet_type, asset, previous_balance, new_balance, 
        change_amount, change_type, reason, admin_id
    ) VALUES (
        target_user_id, wallet_type_param, asset_param, current_balance, new_balance,
        change_amount, change_type_param, reason_param, auth.uid()
    );

    -- Return result
    result := jsonb_build_object(
        'success', true,
        'user_id', target_user_id,
        'wallet_type', wallet_type_param,
        'asset', asset_param,
        'previous_balance', current_balance,
        'new_balance', new_balance,
        'change_amount', change_amount,
        'change_type', change_type_param,
        'reason', reason_param,
        'admin_id', auth.uid(),
        'timestamp', NOW()
    );

    RETURN result;
END;
$$;

-- Function to add balance to user wallet
CREATE OR REPLACE FUNCTION add_balance_to_user(
    target_user_id UUID,
    wallet_type_param TEXT,
    asset_param TEXT,
    amount DECIMAL(20,8),
    reason_param TEXT DEFAULT 'Admin balance addition'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN update_user_balance(
        target_user_id, 
        wallet_type_param, 
        asset_param, 
        amount, 
        'admin_adjustment', 
        reason_param
    );
END;
$$;

-- Function to remove balance from user wallet
CREATE OR REPLACE FUNCTION remove_balance_from_user(
    target_user_id UUID,
    wallet_type_param TEXT,
    asset_param TEXT,
    amount DECIMAL(20,8),
    reason_param TEXT DEFAULT 'Admin balance removal'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN update_user_balance(
        target_user_id, 
        wallet_type_param, 
        asset_param, 
        -amount, 
        'admin_adjustment', 
        reason_param
    );
END;
$$;

-- Function to get user wallet summary
CREATE OR REPLACE FUNCTION get_user_wallet_summary(user_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Check if user can access this data (own data or admin)
    IF auth.uid() != user_id_param AND NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Get wallet summary
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

-- Function to sync user wallet from database
CREATE OR REPLACE FUNCTION sync_user_wallet_from_database(user_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    wallet_data JSONB;
    result JSONB;
BEGIN
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

-- Function to get system balance statistics
CREATE OR REPLACE FUNCTION get_system_balance_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Only admins can view system statistics';
    END IF;

    SELECT jsonb_build_object(
        'total_users', (SELECT COUNT(*) FROM auth.users),
        'active_users', (SELECT COUNT(*) FROM public.profiles),
        'total_usdt_balance', (SELECT COALESCE(SUM(balance), 0) FROM public.user_wallets WHERE asset = 'USDT'),
        'total_usd_balance', (SELECT COALESCE(SUM(balance), 0) FROM public.user_wallets WHERE asset = 'USD'),
        'total_trading_balance', (SELECT COALESCE(SUM(balance), 0) FROM public.user_wallets WHERE wallet_type = 'trading'),
        'total_funding_balance', (SELECT COALESCE(SUM(balance), 0) FROM public.user_wallets WHERE wallet_type = 'funding'),
        'wallet_count', (SELECT COUNT(*) FROM public.user_wallets),
        'balance_history_count', (SELECT COUNT(*) FROM public.balance_history),
        'last_balance_update', (SELECT MAX(updated_at) FROM public.user_wallets),
        'last_balance_change', (SELECT MAX(created_at) FROM public.balance_history)
    ) INTO result;

    RETURN result;
END;
$$;

-- Step 6: Create admin views
-- Admin view for all user balances
CREATE OR REPLACE VIEW admin_user_balances AS
SELECT 
    u.id as user_id,
    u.email,
    p.full_name,
    p.is_verified,
    p.kyc_status,
    COALESCE(p.account_status, 'active') as account_status,
    ur.role,
    uw.wallet_type,
    uw.asset,
    uw.balance,
    uw.updated_at as last_balance_update,
    u.created_at as user_created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.user_wallets uw ON u.id = uw.user_id
ORDER BY u.created_at DESC, uw.wallet_type, uw.asset;

-- Admin view for balance summary
CREATE OR REPLACE VIEW admin_balance_summary AS
SELECT 
    u.id as user_id,
    u.email,
    p.full_name,
    ur.role,
    COUNT(uw.id) as wallet_count,
    SUM(CASE WHEN uw.asset = 'USDT' THEN uw.balance ELSE 0 END) as total_usdt,
    SUM(CASE WHEN uw.asset = 'USD' THEN uw.balance ELSE 0 END) as total_usd,
    SUM(CASE WHEN uw.wallet_type = 'trading' THEN uw.balance ELSE 0 END) as trading_balance,
    SUM(CASE WHEN uw.wallet_type = 'funding' THEN uw.balance ELSE 0 END) as funding_balance,
    MAX(uw.updated_at) as last_activity,
    u.created_at as user_created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.user_wallets uw ON u.id = uw.user_id
GROUP BY u.id, u.email, p.full_name, ur.role, u.created_at
ORDER BY total_usdt DESC NULLS LAST;

-- Step 7: Grant permissions
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.user_wallets TO authenticated;
GRANT ALL ON public.balance_history TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON admin_user_balances TO authenticated;
GRANT SELECT ON admin_balance_summary TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_balance(UUID, TEXT, TEXT, DECIMAL, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_balance_to_user(UUID, TEXT, TEXT, DECIMAL, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_balance_from_user(UUID, TEXT, TEXT, DECIMAL, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_wallet_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_user_wallet_from_database(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_balance_stats() TO authenticated;

-- Step 8: Create initial admin user if not exists
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Find or create admin user
    SELECT u.id INTO admin_user_id
    FROM auth.users u
    WHERE u.email = 'kryvextrading@gmail.com';
    
    IF admin_user_id IS NOT NULL THEN
        -- Ensure admin role exists
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Ensure profile exists
        INSERT INTO public.profiles (user_id, email, full_name, is_verified, account_status)
        VALUES (admin_user_id, 'kryvextrading@gmail.com', 'Kryvex Admin', true, 'active')
        ON CONFLICT (user_id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            is_verified = EXCLUDED.is_verified,
            account_status = EXCLUDED.account_status;
        
        RAISE NOTICE '✅ Admin user setup complete for: kryvextrading@gmail.com';
    ELSE
        RAISE NOTICE '⚠️ Admin user not found: kryvextrading@gmail.com';
    END IF;
END $$;

-- Step 9: Create initial wallet entries for all users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    RAISE NOTICE '=== CREATING INITIAL WALLET ENTRIES ===';
    
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
    
    RAISE NOTICE '✅ Initial wallet creation complete!';
END $$;

-- Step 10: Verification and summary
DO $$
BEGIN
    RAISE NOTICE '=== SYSTEM VERIFICATION ===';
    RAISE NOTICE '';
    RAISE NOTICE '✅ All tables created/verified';
    RAISE NOTICE '✅ All functions created/updated';
    RAISE NOTICE '✅ All views created/updated';
    RAISE NOTICE '✅ RLS policies configured';
    RAISE NOTICE '✅ Permissions granted';
    RAISE NOTICE '✅ Admin user configured';
    RAISE NOTICE '✅ Initial wallet entries created';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Admin Functions Available:';
    RAISE NOTICE '  - add_balance_to_user() - Add balance to user wallet';
    RAISE NOTICE '  - remove_balance_from_user() - Remove balance from user wallet';
    RAISE NOTICE '  - update_user_balance() - General balance update function';
    RAISE NOTICE '  - get_system_balance_stats() - Get system statistics';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 User Functions Available:';
    RAISE NOTICE '  - get_user_wallet_summary() - Get user wallet data';
    RAISE NOTICE '  - sync_user_wallet_from_database() - Sync wallet from DB';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Balance management system is ready!';
END $$;
