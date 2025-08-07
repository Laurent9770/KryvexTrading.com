-- Fix existing tables to match actual database structure

-- First, let's check what tables exist and their structure
-- Then we'll add missing columns and create missing tables

-- Fix trading_pairs table if it exists but is missing columns
DO $$ 
BEGIN
    -- Check if trading_pairs table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'trading_pairs') THEN
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'trading_pairs' AND column_name = 'base_currency') THEN
            ALTER TABLE trading_pairs ADD COLUMN base_currency TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'trading_pairs' AND column_name = 'quote_currency') THEN
            ALTER TABLE trading_pairs ADD COLUMN quote_currency TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'trading_pairs' AND column_name = 'current_price') THEN
            ALTER TABLE trading_pairs ADD COLUMN current_price DECIMAL(20,8) DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'trading_pairs' AND column_name = 'change_24h') THEN
            ALTER TABLE trading_pairs ADD COLUMN change_24h DECIMAL(10,4) DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'trading_pairs' AND column_name = 'volume_24h') THEN
            ALTER TABLE trading_pairs ADD COLUMN volume_24h DECIMAL(20,8) DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'trading_pairs' AND column_name = 'is_active') THEN
            ALTER TABLE trading_pairs ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'trading_pairs' AND column_name = 'updated_at') THEN
            ALTER TABLE trading_pairs ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
    ELSE
        -- Create trading_pairs table if it doesn't exist
        CREATE TABLE trading_pairs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            symbol TEXT UNIQUE NOT NULL,
            base_currency TEXT NOT NULL,
            quote_currency TEXT NOT NULL,
            current_price DECIMAL(20,8) DEFAULT 0,
            change_24h DECIMAL(10,4) DEFAULT 0,
            volume_24h DECIMAL(20,8) DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trades table if it doesn't exist
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trading_pair_id UUID REFERENCES trading_pairs(id),
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  amount DECIMAL(20,8) NOT NULL,
  price DECIMAL(20,8) NOT NULL,
  total_value DECIMAL(20,8) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  result TEXT CHECK (result IN ('win', 'loss', 'draw')),
  profit_loss DECIMAL(20,8) DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  forced_outcome BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create kyc_submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS kyc_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('level1', 'level2')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  documents JSONB,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT
);

-- Create staking_pools table if it doesn't exist
CREATE TABLE IF NOT EXISTS staking_pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  apy DECIMAL(5,2) DEFAULT 0,
  min_stake DECIMAL(20,8) DEFAULT 0,
  max_stake DECIMAL(20,8),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staking_positions table if it doesn't exist
CREATE TABLE IF NOT EXISTS staking_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pool_id UUID REFERENCES staking_pools(id),
  amount DECIMAL(20,8) NOT NULL,
  apy_at_stake DECIMAL(5,2),
  staked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unstaked_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unstaked'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_pairs_symbol ON trading_pairs(symbol);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user_id ON kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_staking_positions_user_id ON staking_positions(user_id);

-- Enable RLS on all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_positions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Anyone can view trading pairs" ON trading_pairs;
DROP POLICY IF EXISTS "Users can view own trades" ON trades;
DROP POLICY IF EXISTS "Users can create own trades" ON trades;
DROP POLICY IF EXISTS "Users can view own activities" ON user_activities;
DROP POLICY IF EXISTS "Users can create own activities" ON user_activities;
DROP POLICY IF EXISTS "Users can view own KYC submissions" ON kyc_submissions;
DROP POLICY IF EXISTS "Users can create own KYC submissions" ON kyc_submissions;
DROP POLICY IF EXISTS "Anyone can view staking pools" ON staking_pools;
DROP POLICY IF EXISTS "Users can view own staking positions" ON staking_positions;
DROP POLICY IF EXISTS "Users can create own staking positions" ON staking_positions;

-- Create RLS policies
CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view trading pairs" ON trading_pairs
  FOR SELECT USING (true);

CREATE POLICY "Users can view own trades" ON trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own trades" ON trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own activities" ON user_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activities" ON user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own KYC submissions" ON kyc_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own KYC submissions" ON kyc_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view staking pools" ON staking_pools
  FOR SELECT USING (true);

CREATE POLICY "Users can view own staking positions" ON staking_positions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own staking positions" ON staking_positions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update existing trading pairs with proper data
UPDATE trading_pairs 
SET 
  base_currency = CASE 
    WHEN symbol = 'BTC/USDT' THEN 'BTC'
    WHEN symbol = 'ETH/USDT' THEN 'ETH'
    WHEN symbol = 'SOL/USDT' THEN 'SOL'
    WHEN symbol = 'ADA/USDT' THEN 'ADA'
    ELSE 'UNKNOWN'
  END,
  quote_currency = 'USDT',
  current_price = CASE 
    WHEN symbol = 'BTC/USDT' THEN 45000.00
    WHEN symbol = 'ETH/USDT' THEN 3000.00
    WHEN symbol = 'SOL/USDT' THEN 100.00
    WHEN symbol = 'ADA/USDT' THEN 0.50
    ELSE 0
  END,
  change_24h = CASE 
    WHEN symbol = 'BTC/USDT' THEN 2.5
    WHEN symbol = 'ETH/USDT' THEN -1.2
    WHEN symbol = 'SOL/USDT' THEN 5.8
    WHEN symbol = 'ADA/USDT' THEN -0.8
    ELSE 0
  END,
  volume_24h = CASE 
    WHEN symbol = 'BTC/USDT' THEN 1000000.00
    WHEN symbol = 'ETH/USDT' THEN 500000.00
    WHEN symbol = 'SOL/USDT' THEN 200000.00
    WHEN symbol = 'ADA/USDT' THEN 100000.00
    ELSE 0
  END
WHERE symbol IN ('BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT');

-- Insert sample trading pairs if they don't exist
INSERT INTO trading_pairs (symbol, base_currency, quote_currency, current_price, change_24h, volume_24h) 
VALUES 
  ('BTC/USDT', 'BTC', 'USDT', 45000.00, 2.5, 1000000.00),
  ('ETH/USDT', 'ETH', 'USDT', 3000.00, -1.2, 500000.00),
  ('SOL/USDT', 'SOL', 'USDT', 100.00, 5.8, 200000.00),
  ('ADA/USDT', 'ADA', 'USDT', 0.50, -0.8, 100000.00)
ON CONFLICT (symbol) DO NOTHING;

-- Insert sample staking pools if they don't exist
INSERT INTO staking_pools (name, symbol, apy, min_stake) 
VALUES 
  ('Bitcoin Staking', 'BTC', 5.5, 0.001),
  ('Ethereum Staking', 'ETH', 4.2, 0.01),
  ('USDT Staking', 'USDT', 3.8, 100)
ON CONFLICT (symbol) DO NOTHING; 