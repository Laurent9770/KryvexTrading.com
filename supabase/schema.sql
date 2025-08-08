-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE account_status AS ENUM ('active', 'suspended', 'banned');
CREATE TYPE trade_type AS ENUM ('buy', 'sell');
CREATE TYPE trade_result AS ENUM ('pending', 'win', 'loss', 'draw');
CREATE TYPE trade_status AS ENUM ('open', 'closed', 'cancelled');
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'trade', 'fee', 'bonus');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    country TEXT,
    date_of_birth DATE,
    account_balance DECIMAL(20,8) DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    kyc_status kyc_status DEFAULT 'pending',
    account_status account_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    suspension_reason TEXT,
    suspended_until TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Create KYC submissions table
CREATE TABLE IF NOT EXISTS kyc_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_number TEXT NOT NULL,
    document_front_url TEXT,
    document_back_url TEXT,
    selfie_url TEXT,
    status kyc_status DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT
);

-- Create KYC documents table
CREATE TABLE IF NOT EXISTS kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT FALSE
);

-- Create trading_pairs table
CREATE TABLE IF NOT EXISTS trading_pairs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT UNIQUE NOT NULL,
    base_currency TEXT NOT NULL,
    quote_currency TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    min_order_size DECIMAL(20,8) DEFAULT 0,
    max_order_size DECIMAL(20,8) DEFAULT 999999999,
    price_precision INTEGER DEFAULT 8,
    quantity_precision INTEGER DEFAULT 8,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    trading_pair_id UUID REFERENCES trading_pairs(id),
    trading_pair_symbol TEXT NOT NULL,
    trade_type trade_type NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    total_value DECIMAL(20,8) NOT NULL,
    fee DECIMAL(20,8) DEFAULT 0,
    profit_loss DECIMAL(20,8) DEFAULT 0,
    result trade_result DEFAULT 'pending',
    status trade_status DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    admin_override BOOLEAN DEFAULT FALSE,
    admin_override_by UUID REFERENCES auth.users(id),
    admin_override_reason TEXT
);

-- Create wallet_balances table
CREATE TABLE IF NOT EXISTS wallet_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL,
    balance DECIMAL(20,8) DEFAULT 0,
    available_balance DECIMAL(20,8) DEFAULT 0,
    locked_balance DECIMAL(20,8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, currency)
);

-- Create deposits table
CREATE TABLE IF NOT EXISTS deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(20,8) NOT NULL,
    currency TEXT NOT NULL,
    payment_method TEXT,
    transaction_id TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT
);

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(20,8) NOT NULL,
    currency TEXT NOT NULL,
    wallet_address TEXT,
    payment_method TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    rejection_reason TEXT
);

-- Create staking_pools table
CREATE TABLE IF NOT EXISTS staking_pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    apy DECIMAL(5,2) NOT NULL,
    min_stake DECIMAL(20,8) NOT NULL,
    max_stake DECIMAL(20,8),
    total_staked DECIMAL(20,8) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staking_positions table
CREATE TABLE IF NOT EXISTS staking_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pool_id UUID REFERENCES staking_pools(id) ON DELETE CASCADE,
    amount DECIMAL(20,8) NOT NULL,
    apy_at_stake DECIMAL(5,2) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    total_earned DECIMAL(20,8) DEFAULT 0,
    last_claim_date TIMESTAMP WITH TIME ZONE
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'medium',
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Create support_messages table
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_activities table
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_actions table
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    target_user_id UUID REFERENCES auth.users(id),
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type transaction_type NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    currency TEXT NOT NULL,
    reference_id UUID,
    reference_type TEXT,
    description TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create wallet_adjustments table
CREATE TABLE IF NOT EXISTS wallet_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    adjustment_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    admin_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create price_history table for real-time price tracking
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    volume DECIMAL(20,8),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user_id ON kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_trading_pair_id ON trades(trading_pair_id);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_user_id ON wallet_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_staking_positions_user_id ON staking_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_price_history_symbol_timestamp ON price_history(symbol, timestamp);

-- Create functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_balances_updated_at BEFORE UPDATE ON wallet_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deposits_updated_at BEFORE UPDATE ON deposits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON withdrawals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile for new user
    INSERT INTO profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    
    -- Create user role (default to 'user')
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    -- Create default wallet balances
    INSERT INTO wallet_balances (user_id, currency, balance, available_balance)
    VALUES 
        (NEW.id, 'USD', 0, 0),
        (NEW.id, 'BTC', 0, 0),
        (NEW.id, 'ETH', 0, 0);
    
    -- Log user activity
    INSERT INTO user_activities (user_id, activity_type, description)
    VALUES (NEW.id, 'registration', 'User registered');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_activity_type TEXT,
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_activities (user_id, activity_type, description, metadata)
    VALUES (p_user_id, p_activity_type, p_description, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION has_role(
    _user_id UUID,
    _role user_role
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = _user_id AND role = _role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    p_admin_id UUID,
    p_action_type TEXT,
    p_target_user_id UUID DEFAULT NULL,
    p_description TEXT,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    action_id UUID;
BEGIN
    INSERT INTO admin_actions (admin_id, action_type, target_user_id, description, metadata)
    VALUES (p_admin_id, p_action_type, p_target_user_id, p_description, p_metadata)
    RETURNING id INTO action_id;
    
    RETURN action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to setup admin user
CREATE OR REPLACE FUNCTION setup_admin_user(
    p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- Update user role to admin
    INSERT INTO user_roles (user_id, role)
    VALUES (p_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Log admin setup
    PERFORM log_admin_action(p_user_id, 'admin_setup', p_user_id, 'User promoted to admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-setup admin for specific emails
CREATE OR REPLACE FUNCTION auto_setup_admin()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user email is in admin list
    IF NEW.email IN ('admin@kryvex.com', 'admin@test.com') THEN
        PERFORM setup_admin_user(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto admin setup
CREATE TRIGGER on_auth_user_admin_setup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION auto_setup_admin();

-- Insert initial data
INSERT INTO trading_pairs (symbol, base_currency, quote_currency, is_active, min_order_size, max_order_size) VALUES
('BTC/USDT', 'BTC', 'USDT', true, 0.001, 100),
('ETH/USDT', 'ETH', 'USDT', true, 0.01, 1000),
('BNB/USDT', 'BNB', 'USDT', true, 0.1, 10000),
('ADA/USDT', 'ADA', 'USDT', true, 1, 100000),
('SOL/USDT', 'SOL', 'USDT', true, 0.1, 10000)
ON CONFLICT (symbol) DO NOTHING;

INSERT INTO staking_pools (name, symbol, apy, min_stake) VALUES
('Bitcoin Staking Pool', 'BTC', 5.5, 0.01),
('Ethereum Staking Pool', 'ETH', 4.2, 0.1),
('USDT Staking Pool', 'USDT', 3.8, 100)
ON CONFLICT DO NOTHING;

-- Row Level Security (RLS) Policies

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view own roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- KYC submissions policies
CREATE POLICY "Users can view own KYC submissions" ON kyc_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own KYC submissions" ON kyc_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all KYC submissions" ON kyc_submissions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- KYC documents policies
CREATE POLICY "Users can view own KYC documents" ON kyc_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload own KYC documents" ON kyc_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all KYC documents" ON kyc_documents FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Trading pairs policies
CREATE POLICY "Anyone can view trading pairs" ON trading_pairs FOR SELECT USING (true);

-- Trades policies
CREATE POLICY "Users can view own trades" ON trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own trades" ON trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trades" ON trades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all trades" ON trades FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Wallet balances policies
CREATE POLICY "Users can view own wallet balances" ON wallet_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet balances" ON wallet_balances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all wallet balances" ON wallet_balances FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Deposits policies
CREATE POLICY "Users can view own deposits" ON deposits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own deposits" ON deposits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all deposits" ON deposits FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Withdrawals policies
CREATE POLICY "Users can view own withdrawals" ON withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own withdrawals" ON withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all withdrawals" ON withdrawals FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Staking pools policies
CREATE POLICY "Anyone can view staking pools" ON staking_pools FOR SELECT USING (true);

-- Staking positions policies
CREATE POLICY "Users can view own staking positions" ON staking_positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own staking positions" ON staking_positions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all staking positions" ON staking_positions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notification read status" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage notifications" ON notifications FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Support tickets policies
CREATE POLICY "Users can view own support tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own support tickets" ON support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own support tickets" ON support_tickets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all support tickets" ON support_tickets FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Support messages policies
CREATE POLICY "Users can view messages in own tickets" ON support_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM support_tickets WHERE id = support_messages.ticket_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create messages in own tickets" ON support_messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM support_tickets WHERE id = support_messages.ticket_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can view all support messages" ON support_messages FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User activities policies
CREATE POLICY "Users can view own activities" ON user_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all user activities" ON user_activities FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Admin actions policies
CREATE POLICY "Admins can view admin actions" ON admin_actions FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create admin actions" ON admin_actions FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admin notifications policies
CREATE POLICY "Admins can view admin notifications" ON admin_notifications FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update admin notifications" ON admin_notifications FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON transactions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User sessions policies
CREATE POLICY "Users can view own sessions" ON user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own sessions" ON user_sessions FOR ALL USING (auth.uid() = user_id);

-- Wallet adjustments policies
CREATE POLICY "Users can view own wallet adjustments" ON wallet_adjustments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can create wallet adjustments" ON wallet_adjustments FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Price history policies
CREATE POLICY "Anyone can view price history" ON price_history FOR SELECT USING (true);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
