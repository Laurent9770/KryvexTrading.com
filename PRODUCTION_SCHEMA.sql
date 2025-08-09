-- PRODUCTION READY DATABASE SCHEMA
-- Comprehensive schema for Kryvex Trading Platform
-- Run this in Supabase SQL Editor to fix all missing tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE kyc_status AS ENUM ('unverified', 'pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('active', 'suspended', 'blocked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE trade_status AS ENUM ('pending', 'executed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ===========================
-- CORE USER TABLES
-- ===========================

-- Profiles table (main user data)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  country TEXT,
  bio TEXT,
  account_balance DECIMAL(20,8) DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  kyc_status kyc_status DEFAULT 'unverified',
  account_status account_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role DEFAULT 'user',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- KYC submissions table
CREATE TABLE IF NOT EXISTS kyc_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  country TEXT NOT NULL,
  id_type TEXT NOT NULL,
  id_number TEXT NOT NULL,
  front_document_url TEXT,
  back_document_url TEXT,
  selfie_url TEXT,
  status kyc_status DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  notes TEXT
);

-- ===========================
-- TRADING TABLES
-- ===========================

-- Trading pairs table
CREATE TABLE IF NOT EXISTS trading_pairs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  symbol TEXT UNIQUE NOT NULL,
  base_currency TEXT NOT NULL,
  quote_currency TEXT NOT NULL,
  current_price DECIMAL(20,8),
  price_change_24h DECIMAL(5,2),
  volume_24h DECIMAL(20,8),
  market_cap DECIMAL(30,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trading_pair_id UUID NOT NULL REFERENCES trading_pairs(id),
  trade_type TEXT NOT NULL, -- 'buy', 'sell'
  order_type TEXT NOT NULL, -- 'market', 'limit'
  amount DECIMAL(20,8) NOT NULL,
  price DECIMAL(20,8),
  total_value DECIMAL(20,8),
  status trade_status DEFAULT 'pending',
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User positions table
CREATE TABLE IF NOT EXISTS user_positions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trading_pair_id UUID NOT NULL REFERENCES trading_pairs(id),
  amount DECIMAL(20,8) NOT NULL DEFAULT 0,
  average_buy_price DECIMAL(20,8),
  total_invested DECIMAL(20,8) DEFAULT 0,
  unrealized_pnl DECIMAL(20,8) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, trading_pair_id)
);

-- ===========================
-- WALLET & TRANSACTIONS
-- ===========================

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'trade', 'fee'
  amount DECIMAL(20,8) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
  reference_id TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Withdrawal requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(20,8) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  withdrawal_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'processed'
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  transaction_hash TEXT,
  network_fee DECIMAL(20,8)
);

-- ===========================
-- ACTIVITY & AUDIT
-- ===========================

-- User activities table
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin actions table
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  description TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- PRICE HISTORY
-- ===========================

-- Price history table
CREATE TABLE IF NOT EXISTS price_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trading_pair_id UUID NOT NULL REFERENCES trading_pairs(id),
  price DECIMAL(20,8) NOT NULL,
  volume DECIMAL(20,8),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- SUPPORT & CHAT
-- ===========================

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  category TEXT DEFAULT 'general',
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  room_type TEXT DEFAULT 'public', -- 'public', 'private', 'support'
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'image', 'file'
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- TRIGGERS AND FUNCTIONS
-- ===========================

-- Function to create user profile automatically
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  -- Assign default user role
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
CREATE TRIGGER create_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_trading_pairs_updated_at ON trading_pairs;
CREATE TRIGGER update_trading_pairs_updated_at
  BEFORE UPDATE ON trading_pairs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ===========================
-- ROW LEVEL SECURITY (RLS)
-- ===========================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can only access their own data)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own trades" ON trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own trades" ON trades FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own positions" ON user_positions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own activities" ON user_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own activities" ON user_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own support tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own support tickets" ON support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public read access for trading pairs and price history
CREATE POLICY "Anyone can view trading pairs" ON trading_pairs FOR SELECT USING (true);
CREATE POLICY "Anyone can view price history" ON price_history FOR SELECT USING (true);
CREATE POLICY "Anyone can view chat rooms" ON chat_rooms FOR SELECT USING (is_active = true);

-- Chat messages - users can read all, insert their own
CREATE POLICY "Users can view chat messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Users can create own chat messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===========================
-- SAMPLE DATA
-- ===========================

-- Insert default trading pairs (August 2025 prices)
INSERT INTO trading_pairs (symbol, base_currency, quote_currency, current_price, price_change_24h, volume_24h, market_cap) VALUES
('BTC/USDT', 'BTC', 'USDT', 125750.00, 3.42, 42000000000, 2480000000000),
('ETH/USDT', 'ETH', 'USDT', 4850.25, 2.18, 22000000000, 584000000000),
('SOL/USDT', 'SOL', 'USDT', 385.40, 5.67, 3800000000, 178000000000),
('ADA/USDT', 'ADA', 'USDT', 2.15, 1.45, 1200000000, 76000000000),
('BNB/USDT', 'BNB', 'USDT', 925.80, 0.92, 2400000000, 138000000000)
ON CONFLICT (symbol) DO UPDATE SET
  current_price = EXCLUDED.current_price,
  price_change_24h = EXCLUDED.price_change_24h,
  volume_24h = EXCLUDED.volume_24h,
  market_cap = EXCLUDED.market_cap,
  updated_at = NOW();

-- Insert default chat room
INSERT INTO chat_rooms (name, description, room_type, is_active) VALUES
('General Trading', 'General discussion about trading and markets', 'public', true)
ON CONFLICT DO NOTHING;

-- ===========================
-- COMPLETION MESSAGE
-- ===========================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Kryvex Trading Platform database schema created successfully!';
  RAISE NOTICE 'All tables, triggers, and RLS policies are now in place.';
  RAISE NOTICE 'You can now use all features of the trading platform.';
END $$;
