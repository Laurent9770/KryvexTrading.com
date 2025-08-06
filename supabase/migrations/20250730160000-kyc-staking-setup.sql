-- KYC Submissions Table
CREATE TABLE IF NOT EXISTS kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  data JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staking Pools Table
CREATE TABLE IF NOT EXISTS staking_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  token TEXT NOT NULL,
  apy DECIMAL(10, 4) NOT NULL,
  min_stake DECIMAL(20, 8) NOT NULL,
  max_stake DECIMAL(20, 8) NOT NULL,
  total_staked DECIMAL(20, 8) DEFAULT 0,
  total_rewards DECIMAL(20, 8) DEFAULT 0,
  lock_period INTEGER NOT NULL, -- in days
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staking Positions Table
CREATE TABLE IF NOT EXISTS staking_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pool_id UUID NOT NULL REFERENCES staking_pools(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  apy DECIMAL(10, 4) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  rewards DECIMAL(20, 8) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  lock_period INTEGER NOT NULL, -- in days
  last_claim_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user_id ON kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_status ON kyc_submissions(status);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_level ON kyc_submissions(level);
CREATE INDEX IF NOT EXISTS idx_staking_pools_status ON staking_pools(status);
CREATE INDEX IF NOT EXISTS idx_staking_pools_token ON staking_pools(token);
CREATE INDEX IF NOT EXISTS idx_staking_positions_user_id ON staking_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_staking_positions_pool_id ON staking_positions(pool_id);
CREATE INDEX IF NOT EXISTS idx_staking_positions_status ON staking_positions(status);

-- RLS Policies for kyc_submissions
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view own KYC submissions" ON kyc_submissions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own submissions
CREATE POLICY "Users can create own KYC submissions" ON kyc_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only admins can update or delete submissions
CREATE POLICY "Only admins can manage KYC submissions" ON kyc_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for staking_pools
ALTER TABLE staking_pools ENABLE ROW LEVEL SECURITY;

-- Everyone can view active pools
CREATE POLICY "Everyone can view active staking pools" ON staking_pools
  FOR SELECT USING (status = 'active');

-- Only admins can manage pools
CREATE POLICY "Only admins can manage staking pools" ON staking_pools
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for staking_positions
ALTER TABLE staking_positions ENABLE ROW LEVEL SECURITY;

-- Users can view their own positions
CREATE POLICY "Users can view own staking positions" ON staking_positions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own positions
CREATE POLICY "Users can create own staking positions" ON staking_positions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own positions
CREATE POLICY "Users can update own staking positions" ON staking_positions
  FOR UPDATE USING (auth.uid() = user_id);

-- Only admins can delete positions
CREATE POLICY "Only admins can delete staking positions" ON staking_positions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_kyc_submissions_updated_at
  BEFORE UPDATE ON kyc_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staking_pools_updated_at
  BEFORE UPDATE ON staking_pools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staking_positions_updated_at
  BEFORE UPDATE ON staking_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to log KYC activity
CREATE OR REPLACE FUNCTION log_kyc_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_user_id,
    details
  ) VALUES (
    COALESCE(NEW.reviewed_by, NEW.user_id),
    'kyc_submission',
    NEW.user_id,
    jsonb_build_object(
      'submission_id', NEW.id,
      'level', NEW.level,
      'status', NEW.status,
      'action', CASE 
        WHEN TG_OP = 'INSERT' THEN 'created'
        WHEN TG_OP = 'UPDATE' THEN 'updated'
        ELSE 'deleted'
      END
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log KYC activity
CREATE TRIGGER log_kyc_activity_trigger
  AFTER INSERT OR UPDATE OR DELETE ON kyc_submissions
  FOR EACH ROW
  EXECUTE FUNCTION log_kyc_activity();

-- Function to log staking activity
CREATE OR REPLACE FUNCTION log_staking_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_user_id,
    details
  ) VALUES (
    NEW.user_id,
    'staking_position',
    NEW.user_id,
    jsonb_build_object(
      'position_id', NEW.id,
      'pool_id', NEW.pool_id,
      'amount', NEW.amount,
      'token', NEW.token,
      'action', CASE 
        WHEN TG_OP = 'INSERT' THEN 'staked'
        WHEN TG_OP = 'UPDATE' THEN 'updated'
        ELSE 'deleted'
      END
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log staking activity
CREATE TRIGGER log_staking_activity_trigger
  AFTER INSERT OR UPDATE OR DELETE ON staking_positions
  FOR EACH ROW
  EXECUTE FUNCTION log_staking_activity();

-- Insert default staking pools
INSERT INTO staking_pools (id, name, token, apy, min_stake, max_stake, lock_period, status) VALUES
  ('pool-btc-1', 'Bitcoin Staking Pool', 'BTC', 8.5, 0.001, 100, 30, 'active'),
  ('pool-eth-1', 'Ethereum Staking Pool', 'ETH', 7.2, 0.01, 1000, 30, 'active'),
  ('pool-usdt-1', 'USDT Staking Pool', 'USDT', 5.0, 100, 1000000, 7, 'active'),
  ('pool-usdc-1', 'USDC Staking Pool', 'USDC', 4.8, 100, 1000000, 7, 'active')
ON CONFLICT (id) DO NOTHING; 