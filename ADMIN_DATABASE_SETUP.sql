-- ADMIN DASHBOARD DATABASE SETUP
-- Comprehensive setup for all admin features
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types if they don't exist
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

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'trade', 'bonus', 'fee');
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
-- WALLET & TRANSACTIONS
-- ===========================

-- User wallet balances
CREATE TABLE IF NOT EXISTS wallet_balances (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  balance DECIMAL(20,8) DEFAULT 0,
  locked_balance DECIMAL(20,8) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, currency)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  currency TEXT NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  fee DECIMAL(20,8) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  reference_id TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Withdrawal requests
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  fee DECIMAL(20,8) DEFAULT 0,
  wallet_address TEXT,
  bank_details JSONB,
  status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- TRADING TABLES
-- ===========================

-- Trading pairs
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
  pair_symbol TEXT NOT NULL,
  trade_type TEXT NOT NULL, -- 'spot', 'futures'
  direction TEXT NOT NULL, -- 'buy', 'sell'
  amount DECIMAL(20,8) NOT NULL,
  price DECIMAL(20,8) NOT NULL,
  total_value DECIMAL(20,8) NOT NULL,
  fee DECIMAL(20,8) DEFAULT 0,
  status trade_status DEFAULT 'pending',
  result TEXT, -- 'win', 'lose', 'draw'
  profit_loss DECIMAL(20,8) DEFAULT 0,
  leverage INTEGER DEFAULT 1,
  duration INTEGER, -- in seconds
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- ADMIN & AUDIT TABLES
-- ===========================

-- Admin actions log
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  target_table TEXT,
  target_id TEXT,
  old_values JSONB,
  new_values JSONB,
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activities
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- CHAT & SUPPORT
-- ===========================

-- Chat rooms
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'general', -- 'general', 'support', 'admin'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'file', 'system'
  file_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  assigned_to UUID REFERENCES auth.users(id),
  category TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- ===========================
-- FUNCTIONS & TRIGGERS
-- ===========================

-- Create user profile trigger
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
CREATE TRIGGER create_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_trading_pairs_updated_at
  BEFORE UPDATE ON trading_pairs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION has_admin_role(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to promote user to admin
CREATE OR REPLACE FUNCTION promote_to_admin(user_uuid UUID, admin_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the promoting user is an admin
  IF NOT has_admin_role(admin_uuid) THEN
    RAISE EXCEPTION 'Only admins can promote users';
  END IF;
  
  -- Insert admin role
  INSERT INTO user_roles (user_id, role, assigned_by)
  VALUES (user_uuid, 'admin', admin_uuid)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to demote admin
CREATE OR REPLACE FUNCTION demote_from_admin(user_uuid UUID, admin_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the demoting user is an admin
  IF NOT has_admin_role(admin_uuid) THEN
    RAISE EXCEPTION 'Only admins can demote users';
  END IF;
  
  -- Remove admin role
  DELETE FROM user_roles 
  WHERE user_id = user_uuid AND role = 'admin';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin action
CREATE OR REPLACE FUNCTION log_admin_action(
  admin_uuid UUID,
  action_type TEXT,
  target_user_uuid UUID DEFAULT NULL,
  target_table TEXT DEFAULT NULL,
  target_id TEXT DEFAULT NULL,
  old_values JSONB DEFAULT NULL,
  new_values JSONB DEFAULT NULL,
  description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  action_id UUID;
BEGIN
  INSERT INTO admin_actions (
    admin_id, action_type, target_user_id, target_table, 
    target_id, old_values, new_values, description
  ) VALUES (
    admin_uuid, action_type, target_user_uuid, target_table,
    target_id, old_values, new_values, description
  ) RETURNING id INTO action_id;
  
  RETURN action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role::TEXT INTO user_role
  FROM user_roles
  WHERE user_id = user_uuid
  ORDER BY assigned_at DESC
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate total balance
CREATE OR REPLACE FUNCTION calculate_total_balance(user_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  total DECIMAL := 0;
BEGIN
  SELECT COALESCE(SUM(balance), 0) INTO total
  FROM wallet_balances
  WHERE user_id = user_uuid;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================
-- ROW LEVEL SECURITY (RLS)
-- ===========================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (has_admin_role(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (has_admin_role(auth.uid()));

-- User roles policies
CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON user_roles
  FOR SELECT USING (has_admin_role(auth.uid()));

CREATE POLICY "Admins can manage roles" ON user_roles
  FOR ALL USING (has_admin_role(auth.uid()));

-- KYC submissions policies
CREATE POLICY "Users can view own KYC submissions" ON kyc_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own KYC submissions" ON kyc_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all KYC submissions" ON kyc_submissions
  FOR SELECT USING (has_admin_role(auth.uid()));

CREATE POLICY "Admins can update KYC submissions" ON kyc_submissions
  FOR UPDATE USING (has_admin_role(auth.uid()));

-- Wallet balances policies
CREATE POLICY "Users can view own wallet" ON wallet_balances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON wallet_balances
  FOR SELECT USING (has_admin_role(auth.uid()));

CREATE POLICY "Admins can update wallets" ON wallet_balances
  FOR UPDATE USING (has_admin_role(auth.uid()));

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON transactions
  FOR SELECT USING (has_admin_role(auth.uid()));

-- Trades policies
CREATE POLICY "Users can view own trades" ON trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades" ON trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all trades" ON trades
  FOR SELECT USING (has_admin_role(auth.uid()));

CREATE POLICY "Admins can update trades" ON trades
  FOR UPDATE USING (has_admin_role(auth.uid()));

-- Admin actions policies
CREATE POLICY "Admins can view admin actions" ON admin_actions
  FOR SELECT USING (has_admin_role(auth.uid()));

CREATE POLICY "Admins can insert admin actions" ON admin_actions
  FOR INSERT WITH CHECK (has_admin_role(auth.uid()));

-- Chat policies
CREATE POLICY "Users can view chat rooms" ON chat_rooms
  FOR SELECT USING (true);

CREATE POLICY "Users can view chat messages" ON chat_messages
  FOR SELECT USING (true);

CREATE POLICY "Users can insert chat messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Support tickets policies
CREATE POLICY "Users can view own tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets" ON support_tickets
  FOR SELECT USING (has_admin_role(auth.uid()));

CREATE POLICY "Admins can update tickets" ON support_tickets
  FOR UPDATE USING (has_admin_role(auth.uid()));

-- ===========================
-- INITIAL DATA
-- ===========================

-- Insert default chat rooms
INSERT INTO chat_rooms (name, type) VALUES
  ('General Support', 'general'),
  ('Admin Channel', 'admin'),
  ('Trading Support', 'support')
ON CONFLICT DO NOTHING;

-- Insert some trading pairs
INSERT INTO trading_pairs (symbol, base_currency, quote_currency, current_price, is_active) VALUES
  ('BTC/USDT', 'BTC', 'USDT', 45000.00, true),
  ('ETH/USDT', 'ETH', 'USDT', 3000.00, true),
  ('BNB/USDT', 'BNB', 'USDT', 350.00, true),
  ('ADA/USDT', 'ADA', 'USDT', 0.50, true),
  ('DOT/USDT', 'DOT', 'USDT', 7.50, true)
ON CONFLICT (symbol) DO NOTHING;

-- ===========================
-- VERIFICATION
-- ===========================

-- Verify tables were created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN (
    'profiles', 'user_roles', 'kyc_submissions', 'wallet_balances',
    'transactions', 'withdrawal_requests', 'trading_pairs', 'trades',
    'admin_actions', 'user_activities', 'chat_rooms', 'chat_messages',
    'support_tickets'
  )
ORDER BY table_name;

-- Verify functions were created
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'create_user_profile', 'update_updated_at', 'has_admin_role',
    'promote_to_admin', 'demote_from_admin', 'log_admin_action',
    'get_user_role', 'calculate_total_balance'
  )
ORDER BY routine_name;

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'user_roles', 'kyc_submissions', 'wallet_balances',
    'transactions', 'withdrawal_requests', 'trading_pairs', 'trades',
    'admin_actions', 'user_activities', 'chat_rooms', 'chat_messages',
    'support_tickets'
  )
ORDER BY tablename;

PRINT '✅ Admin database setup completed successfully!';
PRINT '📊 Tables created: 13';
PRINT '🔧 Functions created: 8';
PRINT '🔒 RLS policies created: 25+';
PRINT '📝 Initial data inserted';
PRINT '';
PRINT '🎯 Next steps:';
PRINT '1. Create admin user using SIMPLE_ADMIN_SETUP.sql';
PRINT '2. Test admin dashboard functionality';
PRINT '3. Verify all admin features work correctly';
