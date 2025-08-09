-- KRYVEX TRADING PLATFORM - COMPLETE DATABASE SCHEMA
-- This file creates all required tables, RLS policies, triggers, and functions

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS AND CUSTOM TYPES
-- =====================================================

-- Drop existing types if they exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS kyc_status CASCADE;
DROP TYPE IF EXISTS trade_status CASCADE;
DROP TYPE IF EXISTS trade_type CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS withdrawal_status CASCADE;
DROP TYPE IF EXISTS deposit_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS support_ticket_status CASCADE;
DROP TYPE IF EXISTS support_ticket_priority CASCADE;

-- Create user role enum
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');

-- Create KYC status enum
CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected', 'not_submitted');

-- Create trade status enum
CREATE TYPE trade_status AS ENUM ('pending', 'executed', 'cancelled', 'failed');

-- Create trade type enum
CREATE TYPE trade_type AS ENUM ('buy', 'sell', 'limit', 'market', 'stop_loss');

-- Create transaction type enum
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'trade', 'fee', 'bonus', 'adjustment');

-- Create withdrawal status enum
CREATE TYPE withdrawal_status AS ENUM ('pending', 'approved', 'rejected', 'completed', 'cancelled');

-- Create deposit status enum
CREATE TYPE deposit_status AS ENUM ('pending', 'approved', 'rejected', 'completed', 'cancelled');

-- Create notification type enum
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'error', 'success', 'trade', 'kyc', 'admin');

-- Create support ticket status enum
CREATE TYPE support_ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- Create support ticket priority enum
CREATE TYPE support_ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    date_of_birth DATE,
    country TEXT,
    address TEXT,
    postal_code TEXT,
    account_balance DECIMAL(20,8) DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Profiles table (public profile info)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    twitter TEXT,
    linkedin TEXT,
    telegram TEXT,
    kyc_status kyc_status DEFAULT 'not_submitted',
    is_verified BOOLEAN DEFAULT false,
    account_balance DECIMAL(20,8) DEFAULT 0,
    total_traded DECIMAL(20,8) DEFAULT 0,
    profit_loss DECIMAL(20,8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'user',
    assigned_by UUID REFERENCES public.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- =====================================================
-- KYC TABLES
-- =====================================================

-- KYC submissions table
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_number TEXT,
    document_front_url TEXT,
    document_back_url TEXT,
    selfie_url TEXT,
    address_proof_url TEXT,
    status kyc_status DEFAULT 'pending',
    rejection_reason TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES public.users(id),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- KYC documents table
CREATE TABLE IF NOT EXISTS public.kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES public.kyc_submissions(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    status kyc_status DEFAULT 'pending',
    rejection_reason TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- TRADING TABLES
-- =====================================================

-- Trading pairs table
CREATE TABLE IF NOT EXISTS public.trading_pairs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT UNIQUE NOT NULL,
    base_currency TEXT NOT NULL,
    quote_currency TEXT NOT NULL,
    current_price DECIMAL(20,8),
    price_change_24h DECIMAL(10,4),
    volume_24h DECIMAL(20,8),
    market_cap DECIMAL(20,2),
    is_active BOOLEAN DEFAULT true,
    min_order_size DECIMAL(20,8) DEFAULT 0.00000001,
    max_order_size DECIMAL(20,8),
    price_precision INTEGER DEFAULT 8,
    quantity_precision INTEGER DEFAULT 8,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trades table
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    trading_pair_id UUID REFERENCES public.trading_pairs(id),
    symbol TEXT NOT NULL,
    trade_type trade_type NOT NULL,
    quantity DECIMAL(20,8) NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    total_value DECIMAL(20,8) NOT NULL,
    fee DECIMAL(20,8) DEFAULT 0,
    status trade_status DEFAULT 'pending',
    executed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Price history table
CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trading_pair_id UUID REFERENCES public.trading_pairs(id),
    symbol TEXT NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    volume DECIMAL(20,8),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    interval_type TEXT DEFAULT '1m', -- 1m, 5m, 15m, 1h, 4h, 1d
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- WALLET TABLES
-- =====================================================

-- Wallet balances table
CREATE TABLE IF NOT EXISTS public.wallet_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL,
    available_balance DECIMAL(20,8) DEFAULT 0,
    locked_balance DECIMAL(20,8) DEFAULT 0,
    total_balance DECIMAL(20,8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, currency)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    currency TEXT NOT NULL,
    balance_before DECIMAL(20,8),
    balance_after DECIMAL(20,8),
    reference_id UUID, -- Links to trades, deposits, withdrawals
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Deposits table
CREATE TABLE IF NOT EXISTS public.deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(20,8) NOT NULL,
    currency TEXT NOT NULL,
    payment_method TEXT,
    transaction_hash TEXT,
    wallet_address TEXT,
    status deposit_status DEFAULT 'pending',
    confirmation_count INTEGER DEFAULT 0,
    required_confirmations INTEGER DEFAULT 6,
    processed_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.users(id),
    rejection_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Withdrawals table
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(20,8) NOT NULL,
    currency TEXT NOT NULL,
    destination_address TEXT NOT NULL,
    transaction_hash TEXT,
    fee DECIMAL(20,8) DEFAULT 0,
    status withdrawal_status DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.users(id),
    rejection_reason TEXT,
    requires_kyc BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- STAKING TABLES
-- =====================================================

-- Staking pools table
CREATE TABLE IF NOT EXISTS public.staking_pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    token_symbol TEXT NOT NULL,
    apy_rate DECIMAL(5,2) NOT NULL,
    min_stake_amount DECIMAL(20,8) DEFAULT 0,
    max_stake_amount DECIMAL(20,8),
    lock_period_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    total_staked DECIMAL(20,8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User stakes table
CREATE TABLE IF NOT EXISTS public.user_stakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    pool_id UUID REFERENCES public.staking_pools(id) ON DELETE CASCADE,
    amount DECIMAL(20,8) NOT NULL,
    rewards_earned DECIMAL(20,8) DEFAULT 0,
    staked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    unstaked_at TIMESTAMP WITH TIME ZONE,
    last_reward_claim TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- COMMUNICATION TABLES
-- =====================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Support tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status support_ticket_status DEFAULT 'open',
    priority support_ticket_priority DEFAULT 'medium',
    assigned_to UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Support messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_staff_response BOOLEAN DEFAULT false,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Chat rooms table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    max_members INTEGER DEFAULT 100,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Chat room members table
CREATE TABLE IF NOT EXISTS public.chat_room_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(room_id, user_id)
);

-- =====================================================
-- ADMIN TABLES
-- =====================================================

-- Admin actions table
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    target_user_id UUID REFERENCES public.users(id),
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Settings table
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    admin_id UUID,
    action_type TEXT,
    target_user_id UUID DEFAULT NULL,
    description TEXT DEFAULT ''
)
RETURNS UUID AS $$
DECLARE
    action_id UUID;
BEGIN
    INSERT INTO public.admin_actions (admin_id, action_type, target_user_id, description)
    VALUES (admin_id, action_type, target_user_id, description)
    RETURNING id INTO action_id;
    
    RETURN action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION has_role(user_id UUID, required_role user_role)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_val user_role;
BEGIN
    SELECT role INTO user_role_val
    FROM public.user_roles
    WHERE user_roles.user_id = has_role.user_id;
    
    RETURN COALESCE(user_role_val, 'user'::user_role) = required_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate wallet total balance
CREATE OR REPLACE FUNCTION calculate_total_balance()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_balance = NEW.available_balance + NEW.locked_balance;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kyc_submissions_updated_at BEFORE UPDATE ON public.kyc_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kyc_documents_updated_at BEFORE UPDATE ON public.kyc_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trading_pairs_updated_at BEFORE UPDATE ON public.trading_pairs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON public.trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallet_balances_updated_at BEFORE UPDATE ON public.wallet_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deposits_updated_at BEFORE UPDATE ON public.deposits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON public.withdrawals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staking_pools_updated_at BEFORE UPDATE ON public.staking_pools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_stakes_updated_at BEFORE UPDATE ON public.user_stakes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON public.chat_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for wallet balance calculation
CREATE TRIGGER calculate_wallet_total_balance BEFORE INSERT OR UPDATE ON public.wallet_balances FOR EACH ROW EXECUTE FUNCTION calculate_total_balance();

-- =====================================================
-- CREATE INITIAL DATA
-- =====================================================

-- Insert default trading pairs
INSERT INTO public.trading_pairs (symbol, base_currency, quote_currency, current_price, is_active) VALUES
('BTC/USD', 'BTC', 'USD', 50000.00, true),
('ETH/USD', 'ETH', 'USD', 3000.00, true),
('BNB/USD', 'BNB', 'USD', 300.00, true),
('ADA/USD', 'ADA', 'USD', 1.50, true),
('SOL/USD', 'SOL', 'USD', 100.00, true),
('DOGE/USD', 'DOGE', 'USD', 0.25, true),
('XRP/USD', 'XRP', 'USD', 0.75, true),
('DOT/USD', 'DOT', 'USD', 25.00, true),
('AVAX/USD', 'AVAX', 'USD', 75.00, true),
('MATIC/USD', 'MATIC', 'USD', 1.25, true)
ON CONFLICT (symbol) DO NOTHING;

-- Insert default staking pools
INSERT INTO public.staking_pools (name, token_symbol, apy_rate, min_stake_amount, is_active) VALUES
('Bitcoin Staking Pool', 'BTC', 5.5, 0.01, true),
('Ethereum Staking Pool', 'ETH', 6.8, 0.1, true),
('Binance Coin Pool', 'BNB', 8.2, 1.0, true),
('Cardano Staking', 'ADA', 7.1, 100.0, true),
('Solana Staking', 'SOL', 9.5, 10.0, true)
ON CONFLICT DO NOTHING;

-- Insert default chat room
INSERT INTO public.chat_rooms (name, description, is_public) VALUES
('General Trading Discussion', 'Main room for trading discussions and market analysis', true)
ON CONFLICT DO NOTHING;

-- Insert default settings
INSERT INTO public.settings (key, value, description, is_public) VALUES
('platform_name', '"Kryvex Trading"', 'Platform display name', true),
('maintenance_mode', 'false', 'Whether platform is in maintenance mode', false),
('trading_enabled', 'true', 'Whether trading is enabled', true),
('withdrawal_enabled', 'true', 'Whether withdrawals are enabled', false),
('kyc_required_for_withdrawal', 'true', 'Whether KYC is required for withdrawals', true),
('max_withdrawal_amount', '10000', 'Maximum withdrawal amount without additional verification', false),
('default_trading_fee', '0.001', 'Default trading fee percentage', true),
('support_email', '"support@kryvextrading.com"', 'Support contact email', true)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- COMPREHENSIVE RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staking_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    -- Users policies
    DROP POLICY IF EXISTS "Users can view own record" ON public.users;
    DROP POLICY IF EXISTS "Users can update own record" ON public.users;
    DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
    DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
    
    -- Profiles policies
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
    
    -- User roles policies
    DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
    DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
    
    -- KYC policies
    DROP POLICY IF EXISTS "Users can view own KYC submissions" ON public.kyc_submissions;
    DROP POLICY IF EXISTS "Users can create own KYC submissions" ON public.kyc_submissions;
    DROP POLICY IF EXISTS "Users can update own pending KYC submissions" ON public.kyc_submissions;
    DROP POLICY IF EXISTS "Admins can view all KYC submissions" ON public.kyc_submissions;
    DROP POLICY IF EXISTS "Admins can update all KYC submissions" ON public.kyc_submissions;
    
    DROP POLICY IF EXISTS "Users can view own KYC documents" ON public.kyc_documents;
    DROP POLICY IF EXISTS "Users can create own KYC documents" ON public.kyc_documents;
    DROP POLICY IF EXISTS "Admins can view all KYC documents" ON public.kyc_documents;
    DROP POLICY IF EXISTS "Admins can update all KYC documents" ON public.kyc_documents;
    
    -- Trading policies
    DROP POLICY IF EXISTS "Anyone can view trading pairs" ON public.trading_pairs;
    DROP POLICY IF EXISTS "Admins can manage trading pairs" ON public.trading_pairs;
    
    DROP POLICY IF EXISTS "Users can view own trades" ON public.trades;
    DROP POLICY IF EXISTS "Users can create own trades" ON public.trades;
    DROP POLICY IF EXISTS "Users can update own pending trades" ON public.trades;
    DROP POLICY IF EXISTS "Admins can view all trades" ON public.trades;
    DROP POLICY IF EXISTS "Admins can update all trades" ON public.trades;
    
    DROP POLICY IF EXISTS "Anyone can view price history" ON public.price_history;
    DROP POLICY IF EXISTS "System can insert price history" ON public.price_history;
    
    -- Wallet policies
    DROP POLICY IF EXISTS "Users can view own wallet balances" ON public.wallet_balances;
    DROP POLICY IF EXISTS "Users can update own wallet balances" ON public.wallet_balances;
    DROP POLICY IF EXISTS "Admins can view all wallet balances" ON public.wallet_balances;
    DROP POLICY IF EXISTS "Admins can update all wallet balances" ON public.wallet_balances;
    
    DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
    DROP POLICY IF EXISTS "System can insert transactions" ON public.transactions;
    DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
    
    -- Deposit/Withdrawal policies
    DROP POLICY IF EXISTS "Users can view own deposits" ON public.deposits;
    DROP POLICY IF EXISTS "Users can create own deposits" ON public.deposits;
    DROP POLICY IF EXISTS "Admins can view all deposits" ON public.deposits;
    DROP POLICY IF EXISTS "Admins can update all deposits" ON public.deposits;
    
    DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawals;
    DROP POLICY IF EXISTS "Users can create own withdrawals" ON public.withdrawals;
    DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.withdrawals;
    DROP POLICY IF EXISTS "Admins can update all withdrawals" ON public.withdrawals;
    
    -- Staking policies
    DROP POLICY IF EXISTS "Anyone can view staking pools" ON public.staking_pools;
    DROP POLICY IF EXISTS "Admins can manage staking pools" ON public.staking_pools;
    
    DROP POLICY IF EXISTS "Users can view own stakes" ON public.user_stakes;
    DROP POLICY IF EXISTS "Users can manage own stakes" ON public.user_stakes;
    DROP POLICY IF EXISTS "Admins can view all stakes" ON public.user_stakes;
    
    -- Communication policies
    DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;
    
    DROP POLICY IF EXISTS "Users can view own support tickets" ON public.support_tickets;
    DROP POLICY IF EXISTS "Users can create own support tickets" ON public.support_tickets;
    DROP POLICY IF EXISTS "Users can update own support tickets" ON public.support_tickets;
    DROP POLICY IF EXISTS "Admins can view all support tickets" ON public.support_tickets;
    DROP POLICY IF EXISTS "Admins can update all support tickets" ON public.support_tickets;
    
    DROP POLICY IF EXISTS "Users can view messages for own tickets" ON public.support_messages;
    DROP POLICY IF EXISTS "Users can create messages for own tickets" ON public.support_messages;
    DROP POLICY IF EXISTS "Admins can view all support messages" ON public.support_messages;
    DROP POLICY IF EXISTS "Admins can create support messages" ON public.support_messages;
    
    -- Chat policies
    DROP POLICY IF EXISTS "Anyone can view public chat rooms" ON public.chat_rooms;
    DROP POLICY IF EXISTS "Authenticated users can create chat rooms" ON public.chat_rooms;
    DROP POLICY IF EXISTS "Room creators and admins can update rooms" ON public.chat_rooms;
    
    DROP POLICY IF EXISTS "Room members can view messages" ON public.chat_messages;
    DROP POLICY IF EXISTS "Room members can create messages" ON public.chat_messages;
    DROP POLICY IF EXISTS "Message authors can update own messages" ON public.chat_messages;
    
    DROP POLICY IF EXISTS "Room members can view membership" ON public.chat_room_members;
    DROP POLICY IF EXISTS "Users can join public rooms" ON public.chat_room_members;
    DROP POLICY IF EXISTS "Users can leave rooms" ON public.chat_room_members;
    
    -- Admin policies
    DROP POLICY IF EXISTS "Admins can view admin actions" ON public.admin_actions;
    DROP POLICY IF EXISTS "Admins can create admin actions" ON public.admin_actions;
    
    DROP POLICY IF EXISTS "Anyone can view public settings" ON public.settings;
    DROP POLICY IF EXISTS "Admins can view all settings" ON public.settings;
    DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
END $$;

-- Create comprehensive RLS policies

-- Users table policies
CREATE POLICY "Users can view own record" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own record" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Admins can update all users" ON public.users FOR UPDATE USING (has_role(auth.uid(), 'admin'::user_role));

-- Profiles table policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- User roles table policies
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- KYC submissions policies
CREATE POLICY "Users can view own KYC submissions" ON public.kyc_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own KYC submissions" ON public.kyc_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pending KYC submissions" ON public.kyc_submissions FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins can view all KYC submissions" ON public.kyc_submissions FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- KYC documents policies
CREATE POLICY "Users can view own KYC documents" ON public.kyc_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own KYC documents" ON public.kyc_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all KYC documents" ON public.kyc_documents FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Trading pairs policies
CREATE POLICY "Anyone can view trading pairs" ON public.trading_pairs FOR SELECT USING (true);
CREATE POLICY "Admins can manage trading pairs" ON public.trading_pairs FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Trades policies
CREATE POLICY "Users can view own trades" ON public.trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own trades" ON public.trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pending trades" ON public.trades FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins can view all trades" ON public.trades FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Price history policies
CREATE POLICY "Anyone can view price history" ON public.price_history FOR SELECT USING (true);
CREATE POLICY "System can insert price history" ON public.price_history FOR INSERT WITH CHECK (true); -- This should be restricted to service role in production

-- Wallet balances policies
CREATE POLICY "Users can view own wallet balances" ON public.wallet_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet balances" ON public.wallet_balances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all wallet balances" ON public.wallet_balances FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert transactions" ON public.transactions FOR INSERT WITH CHECK (true); -- This should be restricted to service role in production
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Deposits policies
CREATE POLICY "Users can view own deposits" ON public.deposits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own deposits" ON public.deposits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all deposits" ON public.deposits FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Withdrawals policies
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all withdrawals" ON public.withdrawals FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Staking pools policies
CREATE POLICY "Anyone can view staking pools" ON public.staking_pools FOR SELECT USING (true);
CREATE POLICY "Admins can manage staking pools" ON public.staking_pools FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- User stakes policies
CREATE POLICY "Users can view own stakes" ON public.user_stakes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own stakes" ON public.user_stakes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all stakes" ON public.user_stakes FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true); -- This should be restricted to service role in production
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Support tickets policies
CREATE POLICY "Users can view own support tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own support tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own support tickets" ON public.support_tickets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all support tickets" ON public.support_tickets FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Support messages policies
CREATE POLICY "Users can view messages for own tickets" ON public.support_messages 
FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM public.support_tickets 
        WHERE support_tickets.id = support_messages.ticket_id 
        AND support_tickets.user_id = auth.uid()
    )
);
CREATE POLICY "Users can create messages for own tickets" ON public.support_messages 
FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM public.support_tickets 
        WHERE support_tickets.id = ticket_id 
        AND support_tickets.user_id = auth.uid()
    )
);
CREATE POLICY "Admins can view all support messages" ON public.support_messages FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Chat rooms policies
CREATE POLICY "Anyone can view public chat rooms" ON public.chat_rooms FOR SELECT USING (is_public = true);
CREATE POLICY "Authenticated users can create chat rooms" ON public.chat_rooms FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Room creators and admins can update rooms" ON public.chat_rooms FOR UPDATE USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::user_role));

-- Chat messages policies
CREATE POLICY "Room members can view messages" ON public.chat_messages 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.chat_room_members 
        WHERE chat_room_members.room_id = chat_messages.room_id 
        AND chat_room_members.user_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public.chat_rooms 
        WHERE chat_rooms.id = chat_messages.room_id 
        AND chat_rooms.is_public = true
    )
);
CREATE POLICY "Room members can create messages" ON public.chat_messages 
FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (EXISTS (
        SELECT 1 FROM public.chat_room_members 
        WHERE chat_room_members.room_id = room_id 
        AND chat_room_members.user_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public.chat_rooms 
        WHERE chat_rooms.id = room_id 
        AND chat_rooms.is_public = true
    ))
);
CREATE POLICY "Message authors can update own messages" ON public.chat_messages FOR UPDATE USING (auth.uid() = user_id);

-- Chat room members policies
CREATE POLICY "Room members can view membership" ON public.chat_room_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can join public rooms" ON public.chat_room_members 
FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.chat_rooms 
        WHERE chat_rooms.id = room_id 
        AND chat_rooms.is_public = true
    )
);
CREATE POLICY "Users can leave rooms" ON public.chat_room_members FOR DELETE USING (auth.uid() = user_id);

-- Admin actions policies
CREATE POLICY "Admins can view admin actions" ON public.admin_actions FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Admins can create admin actions" ON public.admin_actions FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Settings policies
CREATE POLICY "Anyone can view public settings" ON public.settings FOR SELECT USING (is_public = true);
CREATE POLICY "Admins can view all settings" ON public.settings FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Admins can manage settings" ON public.settings FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- User-related indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- KYC indexes
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user_id ON public.kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_status ON public.kyc_submissions(status);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON public.kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_submission_id ON public.kyc_documents(submission_id);

-- Trading indexes
CREATE INDEX IF NOT EXISTS idx_trading_pairs_symbol ON public.trading_pairs(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON public.trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON public.trades(created_at);
CREATE INDEX IF NOT EXISTS idx_price_history_symbol ON public.price_history(symbol);
CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON public.price_history(timestamp);

-- Wallet indexes
CREATE INDEX IF NOT EXISTS idx_wallet_balances_user_id ON public.wallet_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON public.deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON public.deposits(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);

-- Staking indexes
CREATE INDEX IF NOT EXISTS idx_user_stakes_user_id ON public.user_stakes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stakes_pool_id ON public.user_stakes(pool_id);

-- Communication indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON public.support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_room_id ON public.chat_room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user_id ON public.chat_room_members(user_id);

-- Admin indexes
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user_id ON public.admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings(key);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.users IS 'Core user information extending auth.users';
COMMENT ON TABLE public.profiles IS 'Public user profiles with trading statistics';
COMMENT ON TABLE public.user_roles IS 'User role assignments for access control';
COMMENT ON TABLE public.kyc_submissions IS 'KYC verification submissions';
COMMENT ON TABLE public.kyc_documents IS 'Individual KYC document uploads';
COMMENT ON TABLE public.trading_pairs IS 'Available cryptocurrency trading pairs';
COMMENT ON TABLE public.trades IS 'User trading transactions';
COMMENT ON TABLE public.price_history IS 'Historical price data for trading pairs';
COMMENT ON TABLE public.wallet_balances IS 'User cryptocurrency wallet balances';
COMMENT ON TABLE public.transactions IS 'All financial transactions history';
COMMENT ON TABLE public.deposits IS 'Deposit requests and processing';
COMMENT ON TABLE public.withdrawals IS 'Withdrawal requests and processing';
COMMENT ON TABLE public.staking_pools IS 'Available staking pools and their parameters';
COMMENT ON TABLE public.user_stakes IS 'User staking positions and rewards';
COMMENT ON TABLE public.notifications IS 'System and user notifications';
COMMENT ON TABLE public.support_tickets IS 'Customer support tickets';
COMMENT ON TABLE public.support_messages IS 'Messages within support tickets';
COMMENT ON TABLE public.chat_rooms IS 'Chat rooms for community discussion';
COMMENT ON TABLE public.chat_messages IS 'Messages within chat rooms';
COMMENT ON TABLE public.chat_room_members IS 'Chat room membership tracking';
COMMENT ON TABLE public.admin_actions IS 'Admin action audit log';
COMMENT ON TABLE public.settings IS 'System configuration settings';

-- Completion message
SELECT 'Kryvex Trading Platform database schema created successfully!' as result;
