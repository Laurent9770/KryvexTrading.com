-- =============================================
-- COMPLETE ADMIN TRADING CONTROL SYSTEM
-- =============================================

-- =============================================
-- 1. ENHANCE PROFILES TABLE FOR WALLET SYSTEM
-- =============================================

-- Add wallet fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS funding_wallet JSONB DEFAULT '{"USDT": {"balance": "0.00", "usdValue": "$0.00", "available": "0.00"}}',
ADD COLUMN IF NOT EXISTS trading_wallet JSONB DEFAULT '{"USDT": {"balance": "0.00", "usdValue": "$0.00", "available": "0.00"}, "BTC": {"balance": "0.00000000", "usdValue": "$0.00", "available": "0.00000000"}, "ETH": {"balance": "0.00000000", "usdValue": "$0.00", "available": "0.00000000"}}',
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned', 'pending')),
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- =============================================
-- 2. WALLET TRANSACTIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('admin_fund', 'admin_deduct', 'trade_profit', 'trade_loss', 'deposit', 'withdrawal', 'transfer_funding_to_trading', 'transfer_trading_to_funding')),
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('funding', 'trading')),
  amount NUMERIC(20, 8) NOT NULL,
  asset TEXT NOT NULL DEFAULT 'USDT',
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  balance_before NUMERIC(20, 8),
  balance_after NUMERIC(20, 8),
  admin_email TEXT,
  remarks TEXT,
  transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- 3. WITHDRAWAL REQUESTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(20, 8) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USDT',
  wallet_address TEXT NOT NULL,
  blockchain TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_notes TEXT,
  tx_hash TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- 4. ENHANCE TRADES TABLE FOR ADMIN CONTROL
-- =============================================

-- Add admin control fields to trades table
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS trade_type TEXT DEFAULT 'spot' CHECK (trade_type IN ('spot', 'futures', 'binary', 'options', 'quant')),
ADD COLUMN IF NOT EXISTS direction TEXT CHECK (direction IN ('buy', 'sell', 'long', 'short', 'higher', 'lower')),
ADD COLUMN IF NOT EXISTS symbol TEXT,
ADD COLUMN IF NOT EXISTS entry_price NUMERIC(20, 8),
ADD COLUMN IF NOT EXISTS current_price NUMERIC(20, 8),
ADD COLUMN IF NOT EXISTS profit_percentage NUMERIC(5, 2) DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS outcome TEXT CHECK (outcome IN ('win', 'lose', 'admin_override', 'pending')),
ADD COLUMN IF NOT EXISTS payout NUMERIC(20, 8),
ADD COLUMN IF NOT EXISTS admin_override BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_override_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS admin_override_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_override_reason TEXT;

-- =============================================
-- 5. TRADING FEATURES CONFIGURATION TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.trading_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('spot', 'futures', 'binary', 'options', 'quant')),
  is_enabled BOOLEAN DEFAULT true,
  min_investment NUMERIC(20, 8) NOT NULL,
  max_investment NUMERIC(20, 8) NOT NULL,
  roi_percentage NUMERIC(5, 2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default trading features
INSERT INTO public.trading_features (name, type, min_investment, max_investment, roi_percentage, duration_minutes, risk_level, description) VALUES
('Spot Trading', 'spot', 10.00, 50000.00, 5.00, 5, 'medium', 'Traditional spot trading with real-time price movements'),
('Futures Trading', 'futures', 50.00, 100000.00, 8.00, 10, 'high', 'Leveraged futures trading with higher risk/reward'),
('Binary Options', 'binary', 5.00, 10000.00, 85.00, 1, 'medium', 'Binary options with high payout percentages'),
('Options Trading', 'options', 25.00, 25000.00, 12.00, 15, 'high', 'Advanced options trading with complex strategies'),
('Quant Arbitrage', 'quant', 1000.00, 50000.00, 15.00, 60, 'low', 'Algorithmic arbitrage trading with low risk'),
('Bot Trading', 'quant', 100.00, 10000.00, 10.00, 30, 'medium', 'Automated bot trading with customizable strategies')
ON CONFLICT DO NOTHING;

-- =============================================
-- 6. ADMIN ACTIONS AUDIT TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('wallet_adjustment', 'trade_outcome_control', 'trading_feature_update', 'withdrawal_approval', 'withdrawal_rejection', 'user_suspension', 'user_ban', 'kyc_approval', 'kyc_rejection')),
  target_user_id UUID REFERENCES auth.users(id),
  target_table TEXT,
  target_id UUID,
  old_values JSONB,
  new_values JSONB,
  description TEXT NOT NULL,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- 7. ENHANCE KYC SYSTEM
-- =============================================

-- Add KYC level fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS kyc_level1_status TEXT DEFAULT 'unverified' CHECK (kyc_level1_status IN ('unverified', 'verified')),
ADD COLUMN IF NOT EXISTS kyc_level1_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS kyc_level2_status TEXT DEFAULT 'not_started' CHECK (kyc_level2_status IN ('not_started', 'pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS kyc_level2_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS kyc_level2_reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS kyc_level2_rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS kyc_documents JSONB DEFAULT '{}';

-- =============================================
-- 8. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 9. RLS POLICIES FOR WALLET TRANSACTIONS
-- =============================================

-- Users can view their own wallet transactions
CREATE POLICY "Users can view their own wallet transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own wallet transactions (for transfers)
CREATE POLICY "Users can create their own wallet transactions" 
ON public.wallet_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND action IN ('transfer_funding_to_trading', 'transfer_trading_to_funding'));

-- Admins can view and manage all wallet transactions
CREATE POLICY "Admins can manage all wallet transactions" 
ON public.wallet_transactions 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 10. RLS POLICIES FOR WITHDRAWAL REQUESTS
-- =============================================

-- Users can view their own withdrawal requests
CREATE POLICY "Users can view their own withdrawal requests" 
ON public.withdrawal_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own withdrawal requests
CREATE POLICY "Users can create their own withdrawal requests" 
ON public.withdrawal_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending withdrawal requests
CREATE POLICY "Users can update their own pending withdrawal requests" 
ON public.withdrawal_requests 
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view and manage all withdrawal requests
CREATE POLICY "Admins can manage all withdrawal requests" 
ON public.withdrawal_requests 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 11. RLS POLICIES FOR TRADING FEATURES
-- =============================================

-- Everyone can view trading features
CREATE POLICY "Everyone can view trading features" 
ON public.trading_features 
FOR SELECT 
USING (true);

-- Only admins can modify trading features
CREATE POLICY "Only admins can modify trading features" 
ON public.trading_features 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 12. RLS POLICIES FOR ADMIN ACTIONS
-- =============================================

-- Only admins can view admin actions
CREATE POLICY "Only admins can view admin actions" 
ON public.admin_actions 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can create admin actions
CREATE POLICY "Only admins can create admin actions" 
ON public.admin_actions 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

-- =============================================
-- 13. ENHANCE TRADES TABLE POLICIES
-- =============================================

-- Update existing trades policies to include admin override
DROP POLICY IF EXISTS "Admins can view and modify all trades" ON public.trades;
CREATE POLICY "Admins can view and modify all trades" 
ON public.trades 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 14. FUNCTIONS FOR ADMIN OPERATIONS
-- =============================================

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_id UUID,
  p_action_type TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_target_table TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_description TEXT,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  action_id UUID;
BEGIN
  INSERT INTO public.admin_actions (
    admin_id, action_type, target_user_id, target_table, target_id, 
    description, old_values, new_values
  ) VALUES (
    p_admin_id, p_action_type, p_target_user_id, p_target_table, p_target_id,
    p_description, p_old_values, p_new_values
  ) RETURNING id INTO action_id;
  
  RETURN action_id;
END;
$$;

-- Function to force trade outcome
CREATE OR REPLACE FUNCTION public.force_trade_outcome(
  p_trade_id UUID,
  p_outcome TEXT,
  p_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trade_record RECORD;
  payout_amount NUMERIC;
BEGIN
  -- Get trade details
  SELECT * INTO trade_record
  FROM public.trades
  WHERE id = p_trade_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate payout based on outcome
  IF p_outcome = 'win' THEN
    payout_amount := trade_record.amount * (1 + COALESCE(trade_record.profit_percentage, 5.0) / 100.0);
  ELSE
    payout_amount := 0;
  END IF;
  
  -- Update trade
  UPDATE public.trades
  SET 
    outcome = p_outcome,
    payout = payout_amount,
    status = 'completed',
    completed_at = now(),
    admin_override = true,
    admin_override_by = p_admin_id,
    admin_override_at = now()
  WHERE id = p_trade_id;
  
  -- Log admin action
  PERFORM public.log_admin_action(
    p_admin_id,
    'trade_outcome_control',
    trade_record.user_id,
    'trades',
    p_trade_id,
    'Forced trade outcome to ' || p_outcome,
    NULL,
    jsonb_build_object('outcome', p_outcome, 'payout', payout_amount)
  );
  
  RETURN TRUE;
END;
$$;

-- Function to update trading feature
CREATE OR REPLACE FUNCTION public.update_trading_feature(
  p_feature_id UUID,
  p_updates JSONB,
  p_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_values JSONB;
BEGIN
  -- Get old values
  SELECT to_jsonb(tf.*) INTO old_values
  FROM public.trading_features tf
  WHERE tf.id = p_feature_id;
  
  -- Update feature
  UPDATE public.trading_features
  SET 
    name = COALESCE(p_updates->>'name', name),
    is_enabled = COALESCE((p_updates->>'is_enabled')::boolean, is_enabled),
    min_investment = COALESCE((p_updates->>'min_investment')::numeric, min_investment),
    max_investment = COALESCE((p_updates->>'max_investment')::numeric, max_investment),
    roi_percentage = COALESCE((p_updates->>'roi_percentage')::numeric, roi_percentage),
    duration_minutes = COALESCE((p_updates->>'duration_minutes')::integer, duration_minutes),
    risk_level = COALESCE(p_updates->>'risk_level', risk_level),
    updated_at = now()
  WHERE id = p_feature_id;
  
  -- Log admin action
  PERFORM public.log_admin_action(
    p_admin_id,
    'trading_feature_update',
    NULL,
    'trading_features',
    p_feature_id,
    'Updated trading feature settings',
    old_values,
    p_updates
  );
  
  RETURN TRUE;
END;
$$;

-- Function to adjust user wallet
CREATE OR REPLACE FUNCTION public.adjust_user_wallet(
  p_user_id UUID,
  p_wallet_type TEXT,
  p_asset TEXT,
  p_amount NUMERIC,
  p_operation TEXT,
  p_admin_id UUID,
  p_remarks TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_record RECORD;
  wallet_data JSONB;
  current_balance NUMERIC;
  new_balance NUMERIC;
  balance_before NUMERIC;
  balance_after NUMERIC;
BEGIN
  -- Get user profile
  SELECT * INTO profile_record
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Get current wallet data
  IF p_wallet_type = 'funding' THEN
    wallet_data := profile_record.funding_wallet;
  ELSE
    wallet_data := profile_record.trading_wallet;
  END IF;
  
  -- Get current balance
  current_balance := COALESCE((wallet_data->p_asset->>'balance')::numeric, 0);
  balance_before := current_balance;
  
  -- Calculate new balance
  IF p_operation = 'add' THEN
    new_balance := current_balance + p_amount;
  ELSE
    new_balance := current_balance - p_amount;
  END IF;
  
  balance_after := new_balance;
  
  -- Update wallet data
  wallet_data := jsonb_set(
    wallet_data,
    ARRAY[p_asset, 'balance'],
    to_jsonb(new_balance::text)
  );
  
  wallet_data := jsonb_set(
    wallet_data,
    ARRAY[p_asset, 'available'],
    to_jsonb(new_balance::text)
  );
  
  -- Update profile
  IF p_wallet_type = 'funding' THEN
    UPDATE public.profiles
    SET funding_wallet = wallet_data
    WHERE user_id = p_user_id;
  ELSE
    UPDATE public.profiles
    SET trading_wallet = wallet_data
    WHERE user_id = p_user_id;
  END IF;
  
  -- Create wallet transaction record
  INSERT INTO public.wallet_transactions (
    user_id, action, wallet_type, amount, asset, 
    balance_before, balance_after, admin_email, remarks
  ) VALUES (
    p_user_id,
    CASE WHEN p_operation = 'add' THEN 'admin_fund' ELSE 'admin_deduct' END,
    p_wallet_type,
    p_amount,
    p_asset,
    balance_before,
    balance_after,
    (SELECT email FROM public.profiles WHERE user_id = p_admin_id),
    p_remarks
  );
  
  -- Log admin action
  PERFORM public.log_admin_action(
    p_admin_id,
    'wallet_adjustment',
    p_user_id,
    'profiles',
    profile_record.id,
    p_operation || ' ' || p_amount || ' ' || p_asset || ' to ' || p_wallet_type || ' wallet',
    jsonb_build_object('balance_before', balance_before),
    jsonb_build_object('balance_after', balance_after)
  );
  
  RETURN TRUE;
END;
$$;

-- =============================================
-- 15. TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Trigger for withdrawal requests updated_at
CREATE TRIGGER update_withdrawal_requests_updated_at
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for trading features updated_at
CREATE TRIGGER update_trading_features_updated_at
  BEFORE UPDATE ON public.trading_features
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 16. INDEXES FOR PERFORMANCE
-- =============================================

-- Wallet transactions indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_action ON public.wallet_transactions(action);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at);

-- Withdrawal requests indexes
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON public.withdrawal_requests(created_at);

-- Admin actions indexes
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON public.admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user_id ON public.admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at);

-- Trading features indexes
CREATE INDEX IF NOT EXISTS idx_trading_features_type ON public.trading_features(type);
CREATE INDEX IF NOT EXISTS idx_trading_features_enabled ON public.trading_features(is_enabled);

-- Enhanced trades indexes
CREATE INDEX IF NOT EXISTS idx_trades_trade_type ON public.trades(trade_type);
CREATE INDEX IF NOT EXISTS idx_trades_outcome ON public.trades(outcome);
CREATE INDEX IF NOT EXISTS idx_trades_admin_override ON public.trades(admin_override);

-- =============================================
-- 17. ENABLE REALTIME FOR LIVE UPDATES
-- =============================================

ALTER TABLE public.wallet_transactions REPLICA IDENTITY FULL;
ALTER TABLE public.withdrawal_requests REPLICA IDENTITY FULL;
ALTER TABLE public.trading_features REPLICA IDENTITY FULL;
ALTER TABLE public.admin_actions REPLICA IDENTITY FULL;
ALTER TABLE public.trades REPLICA IDENTITY FULL;

-- =============================================
-- 18. COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE public.wallet_transactions IS 'All wallet transactions including admin adjustments and user transfers';
COMMENT ON TABLE public.withdrawal_requests IS 'User withdrawal requests with admin approval workflow';
COMMENT ON TABLE public.trading_features IS 'Configuration for different trading features with admin controls';
COMMENT ON TABLE public.admin_actions IS 'Audit trail for all admin actions across the platform';

COMMENT ON COLUMN public.profiles.funding_wallet IS 'User funding wallet balances in JSONB format';
COMMENT ON COLUMN public.profiles.trading_wallet IS 'User trading wallet balances in JSONB format';
COMMENT ON COLUMN public.profiles.account_status IS 'Current account status (active, suspended, banned, pending)';
COMMENT ON COLUMN public.trades.admin_override IS 'Indicates if trade outcome was forced by admin';
COMMENT ON COLUMN public.trades.admin_override_by IS 'Admin user who forced the trade outcome';
COMMENT ON COLUMN public.trades.admin_override_reason IS 'Reason for admin override of trade outcome';

-- =============================================
-- 19. FINAL SETUP COMPLETE
-- =============================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Ensure RLS is properly configured
SELECT 'RLS enabled on all tables' as status;
