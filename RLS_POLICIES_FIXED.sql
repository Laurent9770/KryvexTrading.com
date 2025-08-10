-- RLS Policies for User-Specific Tables (Fixed Syntax)
-- Remove IF NOT EXISTS as it's not supported in all PostgreSQL versions

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_pairs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users view own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users view own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Public read access to trading pairs" ON public.trading_pairs;

-- Profiles Policy
CREATE POLICY "Users view own profiles" ON public.profiles
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Transactions Policy
CREATE POLICY "Users view own transactions" ON public.transactions
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Withdrawals Policy
CREATE POLICY "Users view own withdrawals" ON public.withdrawals
    FOR SELECT 
    USING (auth.uid() = user_id);

-- User Roles Policy
CREATE POLICY "Users view own roles" ON public.user_roles
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Trading Pairs Policy (public read access)
CREATE POLICY "Public read access to trading pairs" ON public.trading_pairs
    FOR SELECT 
    USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_pairs_symbol ON public.trading_pairs(symbol);

-- Grant permissions to authenticated users
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.transactions TO authenticated;
GRANT SELECT ON public.withdrawals TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.trading_pairs TO authenticated;

-- Grant permissions to anonymous users for public data
GRANT SELECT ON public.trading_pairs TO anon;

-- Verify existing policies
SELECT 
    'profiles' as table_name, 
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as policy_count
UNION ALL
SELECT 
    'transactions' as table_name, 
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'transactions') as policy_count
UNION ALL
SELECT 
    'withdrawals' as table_name, 
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'withdrawals') as policy_count
UNION ALL
SELECT 
    'user_roles' as table_name, 
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_roles') as policy_count
UNION ALL
SELECT 
    'trading_pairs' as table_name, 
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'trading_pairs') as policy_count;
