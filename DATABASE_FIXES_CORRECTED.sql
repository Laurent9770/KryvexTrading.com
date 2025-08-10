-- =====================================================
-- DATABASE FIXES FOR KRYVEX TRADING PLATFORM (CORRECTED)
-- =====================================================
-- This script fixes the PostgREST schema exposure issues and missing tables

-- 1. Ensure public schema is properly exposed
-- This is typically done in Supabase dashboard, but we'll verify the setup

-- 2. Fix the profiles table structure to match what the frontend expects
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    country TEXT,
    account_balance DECIMAL(20,8) DEFAULT 0.0,
    is_verified BOOLEAN DEFAULT FALSE,
    kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
    account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned')),
    avatar_url TEXT,
    username TEXT,
    funding_wallet JSONB DEFAULT '{}',
    trading_wallet JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create missing wallet-related tables that the frontend expects
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('fund', 'withdraw', 'deduct', 'admin_fund', 'admin_deduct')),
    wallet_type TEXT NOT NULL CHECK (wallet_type IN ('funding', 'trading')),
    amount DECIMAL(20,8) NOT NULL,
    asset TEXT NOT NULL DEFAULT 'USDT',
    performed_by UUID REFERENCES auth.users(id),
    remarks TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
    balance DECIMAL(20,8),
    admin_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create enhanced transactions table with all expected fields
DROP TABLE IF EXISTS public.transactions CASCADE;

CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'fee', 'fund', 'deduct')),
    amount DECIMAL(20,8) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USDT',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    reference_id TEXT,
    description TEXT,
    action TEXT,
    wallet_type TEXT,
    performed_by UUID REFERENCES auth.users(id),
    remarks TEXT,
    balance DECIMAL(20,8),
    admin_email TEXT,
    username TEXT,
    asset TEXT DEFAULT 'USDT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create enhanced withdrawals table
DROP TABLE IF EXISTS public.withdrawals CASCADE;

CREATE TABLE public.withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(20,8) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USDT',
    wallet_address TEXT,
    blockchain TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    admin_notes TEXT,
    processed_by UUID REFERENCES auth.users(id),
    tx_hash TEXT,
    processed_date TIMESTAMP WITH TIME ZONE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create or update trading_pairs table with correct column names
DROP TABLE IF EXISTS public.trading_pairs CASCADE;

CREATE TABLE public.trading_pairs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT UNIQUE NOT NULL,
    base_currency TEXT NOT NULL,
    quote_currency TEXT NOT NULL,
    current_price DECIMAL(20,8) DEFAULT 0.0,
    price_change_24h DECIMAL(20,8) DEFAULT 0.0,
    volume_24h DECIMAL(20,8) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_pairs ENABLE ROW LEVEL SECURITY;

-- 8. Create comprehensive RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public read access" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 9. Create RLS policies for wallet_transactions
CREATE POLICY "Users can view own wallet transactions" ON public.wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallet transactions" ON public.wallet_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert wallet transactions" ON public.wallet_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 10. Create RLS policies for transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all transactions" ON public.transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 11. Create RLS policies for withdrawals
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawals" ON public.withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawals" ON public.withdrawals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all withdrawals" ON public.withdrawals
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 12. Create RLS policies for trading_pairs
CREATE POLICY "Anyone can view trading pairs" ON public.trading_pairs
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage trading pairs" ON public.trading_pairs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 13. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_trading_pairs_symbol ON public.trading_pairs(symbol);

-- 14. Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
DROP TRIGGER IF EXISTS update_withdrawals_updated_at ON public.withdrawals;
DROP TRIGGER IF EXISTS update_trading_pairs_updated_at ON public.trading_pairs;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_withdrawals_updated_at
    BEFORE UPDATE ON public.withdrawals
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_trading_pairs_updated_at
    BEFORE UPDATE ON public.trading_pairs
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- 15. Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name, username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
    );
    
    -- Assign default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 17. Grant necessary permissions (without postgrest role)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.trading_pairs TO anon;

-- 18. Insert sample data for testing (with correct column names)
INSERT INTO public.trading_pairs (symbol, base_currency, quote_currency, current_price, price_change_24h, volume_24h) VALUES
('BTC/USDT', 'BTC', 'USDT', 45000.00, 2.5, 1000000.00),
('ETH/USDT', 'ETH', 'USDT', 3000.00, -1.2, 500000.00),
('ADA/USDT', 'ADA', 'USDT', 0.50, 5.0, 100000.00)
ON CONFLICT (symbol) DO NOTHING;

-- 19. Verification queries
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM public.profiles
UNION ALL
SELECT 'wallet_transactions' as table_name, COUNT(*) as row_count FROM public.wallet_transactions
UNION ALL
SELECT 'transactions' as table_name, COUNT(*) as row_count FROM public.transactions
UNION ALL
SELECT 'withdrawals' as table_name, COUNT(*) as row_count FROM public.withdrawals
UNION ALL
SELECT 'trading_pairs' as table_name, COUNT(*) as row_count FROM public.trading_pairs;

-- 20. Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'wallet_transactions', 'transactions', 'withdrawals', 'trading_pairs')
ORDER BY tablename, policyname;
