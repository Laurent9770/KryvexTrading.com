-- Kryvex Trading Platform Database Schema
-- This schema uses Supabase exclusively for all backend functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- AUTHENTICATION & USER MANAGEMENT
-- =============================================

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    username TEXT UNIQUE,
    phone TEXT,
    country TEXT DEFAULT 'United States',
    avatar_url TEXT,
    bio TEXT,
    account_balance DECIMAL(20,8) DEFAULT 0.00000000,
    is_verified BOOLEAN DEFAULT FALSE,
    kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
    account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles for admin functionality
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- =============================================
-- KYC VERIFICATION SYSTEM
-- =============================================

-- KYC submissions table
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    country TEXT NOT NULL,
    id_type TEXT NOT NULL CHECK (id_type IN ('passport', 'drivers_license', 'national_id')),
    id_number TEXT NOT NULL,
    front_url TEXT,
    back_url TEXT,
    selfie_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- TRADING SYSTEM
-- =============================================

-- Trading pairs table
CREATE TABLE IF NOT EXISTS public.trading_pairs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    symbol TEXT UNIQUE NOT NULL,
    base_currency TEXT NOT NULL,
    quote_currency TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    min_order_size DECIMAL(20,8) DEFAULT 0.00000001,
    max_order_size DECIMAL(20,8) DEFAULT 1000000.00000000,
    price_precision INTEGER DEFAULT 8,
    quantity_precision INTEGER DEFAULT 8,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User trades table
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    trading_pair_id UUID REFERENCES public.trading_pairs(id) ON DELETE CASCADE NOT NULL,
    trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
    amount DECIMAL(20,8) NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    total_value DECIMAL(20,8) NOT NULL,
    fee DECIMAL(20,8) DEFAULT 0,
    profit_loss DECIMAL(20,8) DEFAULT 0,
    result TEXT DEFAULT 'pending' CHECK (result IN ('pending', 'win', 'loss', 'draw')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- User wallet balances
CREATE TABLE IF NOT EXISTS public.wallet_balances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    currency TEXT NOT NULL,
    balance DECIMAL(20,8) DEFAULT 0.00000000,
    available_balance DECIMAL(20,8) DEFAULT 0.00000000,
    locked_balance DECIMAL(20,8) DEFAULT 0.00000000,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, currency)
);

-- =============================================
-- FINANCIAL OPERATIONS
-- =============================================

-- Deposits table
CREATE TABLE IF NOT EXISTS public.deposits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    currency TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    transaction_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Withdrawal requests table
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    currency TEXT NOT NULL,
    wallet_address TEXT,
    bank_details JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- STAKING SYSTEM
-- =============================================

-- Staking pools table
CREATE TABLE IF NOT EXISTS public.staking_pools (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    currency TEXT NOT NULL,
    apy DECIMAL(5,2) NOT NULL,
    min_stake DECIMAL(20,8) NOT NULL,
    max_stake DECIMAL(20,8),
    total_staked DECIMAL(20,8) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User staking positions
CREATE TABLE IF NOT EXISTS public.staking_positions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    pool_id UUID REFERENCES public.staking_pools(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    apy_at_stake DECIMAL(5,2) NOT NULL,
    rewards_earned DECIMAL(20,8) DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unstaking', 'completed')),
    staked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unstaked_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- ACTIVITY & NOTIFICATIONS
-- =============================================

-- User activity log
CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SUPPORT SYSTEM
-- =============================================

-- Support tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support ticket messages
CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    is_staff_reply BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- REAL-TIME PRICE DATA
-- =============================================

-- Crypto price history
CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    symbol TEXT NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    volume_24h DECIMAL(20,8),
    change_24h DECIMAL(10,4),
    market_cap DECIMAL(20,2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staking_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staking_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );

-- KYC policies
CREATE POLICY "Users can view own KYC submissions" ON public.kyc_submissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own KYC submissions" ON public.kyc_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all KYC submissions" ON public.kyc_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );

-- Trading pairs policies (public read)
CREATE POLICY "Anyone can view trading pairs" ON public.trading_pairs
    FOR SELECT USING (is_active = true);

-- Trades policies
CREATE POLICY "Users can view own trades" ON public.trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own trades" ON public.trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Wallet balances policies
CREATE POLICY "Users can view own wallet balances" ON public.wallet_balances
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet balances" ON public.wallet_balances
    FOR UPDATE USING (auth.uid() = user_id);

-- Deposits policies
CREATE POLICY "Users can view own deposits" ON public.deposits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own deposits" ON public.deposits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Withdrawal requests policies
CREATE POLICY "Users can view own withdrawal requests" ON public.withdrawal_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own withdrawal requests" ON public.withdrawal_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Staking policies
CREATE POLICY "Anyone can view staking pools" ON public.staking_pools
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own staking positions" ON public.staking_positions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own staking positions" ON public.staking_positions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Activity policies
CREATE POLICY "Users can view own activities" ON public.user_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activities" ON public.user_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Support tickets policies
CREATE POLICY "Users can view own support tickets" ON public.support_tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own support tickets" ON public.support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all support tickets" ON public.support_tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );

-- Price history policies (public read)
CREATE POLICY "Anyone can view price history" ON public.price_history
    FOR SELECT USING (true);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for profiles table
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for support tickets table
CREATE TRIGGER update_support_tickets_updated_at 
    BEFORE UPDATE ON public.support_tickets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to log user activities
CREATE OR REPLACE FUNCTION public.log_user_activity(
    p_user_id UUID,
    p_activity_type TEXT,
    p_description TEXT,
    p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_activities (user_id, activity_type, description, metadata)
    VALUES (p_user_id, p_activity_type, p_description, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert default trading pairs
INSERT INTO public.trading_pairs (symbol, base_currency, quote_currency, min_order_size, max_order_size) VALUES
('BTC/USDT', 'BTC', 'USDT', 0.00000001, 1000.00000000),
('ETH/USDT', 'ETH', 'USDT', 0.00000001, 10000.00000000),
('SOL/USDT', 'SOL', 'USDT', 0.00000001, 100000.00000000),
('ADA/USDT', 'ADA', 'USDT', 0.00000001, 1000000.00000000),
('DOT/USDT', 'DOT', 'USDT', 0.00000001, 100000.00000000)
ON CONFLICT (symbol) DO NOTHING;

-- Insert default staking pools
INSERT INTO public.staking_pools (name, currency, apy, min_stake, max_stake) VALUES
('USDT Staking Pool', 'USDT', 8.50, 100.00000000, 100000.00000000),
('BTC Staking Pool', 'BTC', 5.20, 0.00100000, 100.00000000),
('ETH Staking Pool', 'ETH', 6.80, 0.01, 1000.00000000)
ON CONFLICT DO NOTHING;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON public.trades(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_user_id ON public.wallet_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON public.deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user_id ON public.kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_price_history_symbol ON public.price_history(symbol);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON public.price_history(recorded_at);
