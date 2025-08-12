-- =============================================
-- CLEANUP AND SETUP ADMIN DASHBOARD MIGRATION
-- =============================================

-- Step 1: Drop unnecessary tables and functions
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP TABLE IF EXISTS public.room_messages CASCADE;
DROP TABLE IF EXISTS public.room_participants CASCADE;
DROP TABLE IF EXISTS public.binance_orders CASCADE;
DROP TABLE IF EXISTS public.binance_accounts CASCADE;
DROP TABLE IF EXISTS public.trading_pairs CASCADE;
DROP TABLE IF EXISTS public.kyc_documents CASCADE;
DROP TABLE IF EXISTS public.withdrawals CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.spot_trades CASCADE;
DROP TABLE IF EXISTS public.futures_trades CASCADE;
DROP TABLE IF EXISTS public.options_trades CASCADE;
DROP TABLE IF EXISTS public.binary_trades CASCADE;
DROP TABLE IF EXISTS public.bot_subscriptions CASCADE;
DROP TABLE IF EXISTS public.quant_trades CASCADE;
DROP TABLE IF EXISTS public.staking_positions CASCADE;

-- Step 2: Drop unnecessary functions
DROP FUNCTION IF EXISTS update_rooms_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_room_messages_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_binance_orders_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_kyc_documents_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_withdrawals_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_transactions_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_spot_trades_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_futures_trades_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_options_trades_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_binary_trades_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_bot_subscriptions_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_quant_trades_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_staking_positions_updated_at() CASCADE;

-- Step 3: Ensure essential tables exist with correct structure

-- Profiles table (core user data)
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
    account_balance DECIMAL(20,8) DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User wallets table
CREATE TABLE IF NOT EXISTS public.user_wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_type TEXT NOT NULL CHECK (wallet_type IN ('funding', 'trading')),
    asset TEXT NOT NULL,
    balance DECIMAL(20,8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, wallet_type, asset)
);

-- Trades table (consolidated for all trading types)
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pair TEXT NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    profit_loss DECIMAL(20,8) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    result TEXT CHECK (result IN ('win', 'loss')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Withdrawal requests table
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(20,8) NOT NULL,
    currency TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    remarks TEXT
);

-- Deposit requests table
CREATE TABLE IF NOT EXISTS public.deposit_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(20,8) NOT NULL,
    currency TEXT NOT NULL,
    network TEXT,
    transaction_hash TEXT,
    proof_file TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id),
    remarks TEXT
);

-- Admin actions table (audit trail)
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_email TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_user_id UUID REFERENCES auth.users(id),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User trading modes table (simulation controls)
CREATE TABLE IF NOT EXISTS public.user_trading_modes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mode TEXT NOT NULL DEFAULT 'normal' CHECK (mode IN ('normal', 'force_win', 'force_loss', 'bot_80_win')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_deposit_requests_user_id ON public.deposit_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deposit_requests_status ON public.deposit_requests(status);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_email ON public.admin_actions(admin_email);
CREATE INDEX IF NOT EXISTS idx_user_trading_modes_user_id ON public.user_trading_modes(user_id);

-- Step 5: Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_user_wallets_updated_at ON public.user_wallets;
DROP TRIGGER IF EXISTS update_trades_updated_at ON public.trades;
DROP TRIGGER IF EXISTS update_user_trading_modes_updated_at ON public.user_trading_modes;

-- Create triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_wallets_updated_at
    BEFORE UPDATE ON public.user_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at
    BEFORE UPDATE ON public.trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_trading_modes_updated_at
    BEFORE UPDATE ON public.user_trading_modes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Create KYC table
CREATE TABLE IF NOT EXISTS public.kyc_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('passport', 'national_id', 'drivers_license', 'utility_bill')),
    document_number TEXT,
    document_file TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for KYC documents
DROP TRIGGER IF EXISTS update_kyc_documents_updated_at ON public.kyc_documents;
CREATE TRIGGER update_kyc_documents_updated_at
    BEFORE UPDATE ON public.kyc_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create KYC indexes
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON public.kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON public.kyc_documents(status);

-- Step 7: Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trading_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- Step 7: Create admin helper function
DROP FUNCTION IF EXISTS has_role(UUID, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION has_role(user_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.user_id = has_role.user_id 
        AND profiles.role = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create RLS policies

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can update all wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can insert wallets" ON public.user_wallets;

DROP POLICY IF EXISTS "Users can view own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can insert own trades" ON public.trades;
DROP POLICY IF EXISTS "Admins can view all trades" ON public.trades;
DROP POLICY IF EXISTS "Admins can update all trades" ON public.trades;

DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users can insert own withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update all withdrawal requests" ON public.withdrawal_requests;

DROP POLICY IF EXISTS "Users can view own deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Users can insert own deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Admins can view all deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Admins can update all deposit requests" ON public.deposit_requests;

DROP POLICY IF EXISTS "Admins can view all admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Admins can insert admin actions" ON public.admin_actions;

DROP POLICY IF EXISTS "Admins can view all trading modes" ON public.user_trading_modes;
DROP POLICY IF EXISTS "Admins can insert trading modes" ON public.user_trading_modes;
DROP POLICY IF EXISTS "Admins can update trading modes" ON public.user_trading_modes;
DROP POLICY IF EXISTS "Admins can delete trading modes" ON public.user_trading_modes;

DROP POLICY IF EXISTS "Users can view own KYC documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Users can insert own KYC documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Admins can view all KYC documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Admins can update all KYC documents" ON public.kyc_documents;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- User wallets policies
CREATE POLICY "Users can view own wallets" ON public.user_wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON public.user_wallets
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all wallets" ON public.user_wallets
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert wallets" ON public.user_wallets
    FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trades policies
CREATE POLICY "Users can view own trades" ON public.trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades" ON public.trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all trades" ON public.trades
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all trades" ON public.trades
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Withdrawal requests policies
CREATE POLICY "Users can view own withdrawal requests" ON public.withdrawal_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawal requests" ON public.withdrawal_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawal requests" ON public.withdrawal_requests
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all withdrawal requests" ON public.withdrawal_requests
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Deposit requests policies
CREATE POLICY "Users can view own deposit requests" ON public.deposit_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deposit requests" ON public.deposit_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all deposit requests" ON public.deposit_requests
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all deposit requests" ON public.deposit_requests
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Admin actions policies
CREATE POLICY "Admins can view all admin actions" ON public.admin_actions
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert admin actions" ON public.admin_actions
    FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- User trading modes policies
CREATE POLICY "Admins can view all trading modes" ON public.user_trading_modes
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert trading modes" ON public.user_trading_modes
    FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update trading modes" ON public.user_trading_modes
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete trading modes" ON public.user_trading_modes
    FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- KYC documents policies
CREATE POLICY "Users can view own KYC documents" ON public.kyc_documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own KYC documents" ON public.kyc_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all KYC documents" ON public.kyc_documents
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all KYC documents" ON public.kyc_documents
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Step 9: Create admin promotion/demotion functions
DROP FUNCTION IF EXISTS promote_to_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS demote_from_admin(UUID) CASCADE;

CREATE OR REPLACE FUNCTION promote_to_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.profiles 
    SET role = 'admin', updated_at = NOW()
    WHERE user_id = target_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION demote_from_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.profiles 
    SET role = 'user', updated_at = NOW()
    WHERE user_id = target_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Insert sample data for testing (optional)
INSERT INTO public.profiles (user_id, email, full_name, role, kyc_status, account_balance, is_verified)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin@kryvex.com', 'Admin User', 'admin', 'approved', 10000, true)
ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    kyc_status = EXCLUDED.kyc_status,
    account_balance = EXCLUDED.account_balance,
    is_verified = EXCLUDED.is_verified,
    updated_at = NOW();

-- Step 11: Create views for admin dashboard
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'user') as total_users,
    (SELECT COUNT(*) FROM public.trades) as total_trades,
    (SELECT COUNT(*) FROM public.withdrawal_requests WHERE status = 'pending') as pending_withdrawals,
    (SELECT COUNT(*) FROM public.deposit_requests WHERE status = 'pending') as pending_deposits,
    (SELECT COALESCE(SUM(amount), 0) FROM public.trades WHERE status = 'completed') as total_volume,
    (SELECT COALESCE(SUM(profit_loss), 0) FROM public.trades WHERE status = 'completed') as total_profit;

-- Grant permissions
GRANT SELECT ON admin_dashboard_stats TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_wallets TO authenticated;
GRANT ALL ON public.trades TO authenticated;
GRANT ALL ON public.withdrawal_requests TO authenticated;
GRANT ALL ON public.deposit_requests TO authenticated;
GRANT ALL ON public.admin_actions TO authenticated;
GRANT ALL ON public.user_trading_modes TO authenticated;
GRANT ALL ON public.kyc_documents TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
