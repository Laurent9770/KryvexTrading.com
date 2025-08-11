-- =============================================
-- COMPLETE DATABASE INTEGRATION MIGRATION
-- =============================================
-- This migration ensures all tables, policies, and functions
-- are properly configured for the enhanced Supabase client

-- =============================================
-- 1. ENSURE ALL TABLES EXIST WITH PROPER STRUCTURE
-- =============================================

-- Profiles table with enhanced wallet system
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  country TEXT,
  avatar_url TEXT,
  username TEXT UNIQUE,
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned', 'pending')),
  kyc_level1_status TEXT DEFAULT 'unverified' CHECK (kyc_level1_status IN ('unverified', 'verified', 'pending')),
  kyc_level2_status TEXT DEFAULT 'unverified' CHECK (kyc_level2_status IN ('unverified', 'pending', 'approved', 'rejected')),
  funding_wallet JSONB DEFAULT '{"USDT": {"balance": "0.00", "usdValue": "$0.00", "available": "0.00"}}',
  trading_wallet JSONB DEFAULT '{"USDT": {"balance": "0.00", "usdValue": "$0.00", "available": "0.00"}, "BTC": {"balance": "0.00000000", "usdValue": "$0.00", "available": "0.00000000"}, "ETH": {"balance": "0.00000000", "usdValue": "$0.00", "available": "0.00000000"}}',
  last_login TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- KYC documents table
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('passport', 'drivers_license', 'national_id')),
  document_front_url TEXT NOT NULL,
  document_back_url TEXT,
  selfie_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Wallet transactions table
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

-- Withdrawal requests table
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

-- Trades table with enhanced fields
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_type TEXT NOT NULL DEFAULT 'spot' CHECK (trade_type IN ('spot', 'futures', 'binary', 'options', 'quant', 'bot', 'staking')),
  direction TEXT CHECK (direction IN ('buy', 'sell', 'long', 'short', 'higher', 'lower')),
  symbol TEXT,
  amount NUMERIC(20, 8) NOT NULL,
  entry_price NUMERIC(20, 8),
  current_price NUMERIC(20, 8),
  profit_percentage NUMERIC(5, 2) DEFAULT 5.0,
  duration_minutes INTEGER DEFAULT 5,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'cancelled')),
  outcome TEXT CHECK (outcome IN ('win', 'lose', 'admin_override', 'pending')),
  payout NUMERIC(20, 8),
  admin_override BOOLEAN DEFAULT false,
  admin_override_by UUID REFERENCES auth.users(id),
  admin_override_at TIMESTAMP WITH TIME ZONE,
  admin_override_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Trading features configuration table
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

-- Admin actions audit table
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  target_table TEXT,
  target_id UUID,
  old_values JSONB,
  new_values JSONB,
  description TEXT NOT NULL,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Deposits table
CREATE TABLE IF NOT EXISTS public.deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  network TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  deposit_address TEXT NOT NULL,
  transaction_hash TEXT,
  proof_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- 2. INSERT DEFAULT DATA
-- =============================================

-- Insert default trading features
INSERT INTO public.trading_features (name, type, min_investment, max_investment, roi_percentage, duration_minutes, description) VALUES
('Day 1 Arbitrage', 'quant', 1000.00, 29999.00, 5.0, 1440, '1-day arbitrage trading strategy'),
('Day 3 Arbitrage', 'quant', 1000.00, 29999.00, 15.0, 4320, '3-day arbitrage trading strategy'),
('Day 7 Arbitrage', 'quant', 1000.00, 29999.00, 35.0, 10080, '7-day arbitrage trading strategy'),
('Binary Options', 'binary', 10.00, 1000.00, 80.0, 5, 'High-frequency binary options trading'),
('Spot Trading', 'spot', 50.00, 5000.00, 2.0, 1, 'Real-time spot trading'),
('Futures Trading', 'futures', 100.00, 10000.00, 10.0, 60, 'Leveraged futures trading')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 3. CREATE NECESSARY FUNCTIONS
-- =============================================

-- Function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_id UUID,
  p_action_type TEXT,
  p_description TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_target_table TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_action_id UUID;
BEGIN
  INSERT INTO public.admin_actions (
    admin_id, action_type, description, target_user_id, 
    target_table, target_id, old_values, new_values
  ) VALUES (
    p_admin_id, p_action_type, p_description, p_target_user_id,
    p_target_table, p_target_id, p_old_values, p_new_values
  ) RETURNING id INTO v_action_id;
  
  RETURN v_action_id;
END;
$$;

-- Function to force trade outcomes
CREATE OR REPLACE FUNCTION public.force_trade_outcome(
  p_trade_id UUID,
  p_outcome TEXT,
  p_admin_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trade RECORD;
  v_user_id UUID;
  v_amount NUMERIC;
  v_profit NUMERIC;
BEGIN
  -- Get trade details
  SELECT * INTO v_trade FROM public.trades WHERE id = p_trade_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trade not found';
  END IF;
  
  v_user_id := v_trade.user_id;
  v_amount := v_trade.amount;
  
  -- Calculate profit based on outcome
  IF p_outcome = 'win' THEN
    v_profit := v_amount * (v_trade.profit_percentage / 100.0);
  ELSE
    v_profit := 0;
  END IF;
  
  -- Update trade
  UPDATE public.trades SET
    outcome = p_outcome,
    payout = CASE WHEN p_outcome = 'win' THEN v_amount + v_profit ELSE 0 END,
    admin_override = true,
    admin_override_by = p_admin_id,
    admin_override_at = now(),
    admin_override_reason = p_reason,
    status = 'completed',
    completed_at = now()
  WHERE id = p_trade_id;
  
  -- Update user wallet
  IF p_outcome = 'win' THEN
    UPDATE public.profiles SET
      trading_wallet = jsonb_set(
        trading_wallet,
        '{USDT,balance}',
        to_jsonb((trading_wallet->'USDT'->>'balance')::numeric + v_amount + v_profit)
      )
    WHERE user_id = v_user_id;
  END IF;
  
  -- Log admin action
  PERFORM public.log_admin_action(
    p_admin_id,
    'force_trade_outcome',
    format('Forced trade %s to %s outcome', p_trade_id, p_outcome),
    v_user_id,
    'trades',
    p_trade_id,
    jsonb_build_object('outcome', v_trade.outcome),
    jsonb_build_object('outcome', p_outcome, 'payout', v_profit)
  );
  
  RETURN true;
END;
$$;

-- Function to adjust user wallet
CREATE OR REPLACE FUNCTION public.adjust_user_wallet(
  p_user_id UUID,
  p_wallet_type TEXT,
  p_amount NUMERIC,
  p_action TEXT,
  p_admin_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_balance NUMERIC;
  v_new_balance NUMERIC;
  v_wallet_field TEXT;
BEGIN
  -- Determine wallet field
  v_wallet_field := CASE p_wallet_type 
    WHEN 'funding' THEN 'funding_wallet'
    WHEN 'trading' THEN 'trading_wallet'
    ELSE 'funding_wallet'
  END;
  
  -- Get current balance
  SELECT (profiles.v_wallet_field->'USDT'->>'balance')::numeric INTO v_old_balance
  FROM public.profiles WHERE user_id = p_user_id;
  
  -- Calculate new balance
  IF p_action = 'add' THEN
    v_new_balance := v_old_balance + p_amount;
  ELSE
    v_new_balance := v_old_balance - p_amount;
  END IF;
  
  -- Update wallet
  UPDATE public.profiles SET
    v_wallet_field = jsonb_set(
      v_wallet_field,
      '{USDT,balance}',
      to_jsonb(v_new_balance)
    )
  WHERE user_id = p_user_id;
  
  -- Log wallet transaction
  INSERT INTO public.wallet_transactions (
    user_id, action, wallet_type, amount, asset, 
    balance_before, balance_after, admin_email, remarks
  ) VALUES (
    p_user_id, 
    CASE p_action WHEN 'add' THEN 'admin_fund' ELSE 'admin_deduct' END,
    p_wallet_type, p_amount, 'USDT', v_old_balance, v_new_balance,
    (SELECT email FROM auth.users WHERE id = p_admin_id),
    p_reason
  );
  
  -- Log admin action
  PERFORM public.log_admin_action(
    p_admin_id,
    'adjust_wallet',
    format('Adjusted %s wallet by %s %s', p_wallet_type, p_action, p_amount),
    p_user_id,
    'profiles',
    p_user_id,
    jsonb_build_object('balance', v_old_balance),
    jsonb_build_object('balance', v_new_balance)
  );
  
  RETURN true;
END;
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- =============================================
-- 4. CREATE TRIGGERS
-- =============================================

-- Trigger for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_withdrawal_requests_updated_at
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trading_features_updated_at
  BEFORE UPDATE ON public.trading_features
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deposits_updated_at
  BEFORE UPDATE ON public.deposits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. CREATE RLS POLICIES
-- =============================================

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- KYC documents policies
CREATE POLICY "Users can view their own KYC documents" ON public.kyc_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can submit their own KYC documents" ON public.kyc_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending KYC documents" ON public.kyc_documents
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all KYC documents" ON public.kyc_documents
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Wallet transactions policies
CREATE POLICY "Users can view their own wallet transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallet transactions" ON public.wallet_transactions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Withdrawal requests policies
CREATE POLICY "Users can view their own withdrawal requests" ON public.withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own withdrawal requests" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all withdrawal requests" ON public.withdrawal_requests
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trades policies
CREATE POLICY "Users can view their own trades" ON public.trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trades" ON public.trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view and modify all trades" ON public.trades
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trading features policies
CREATE POLICY "Everyone can view trading features" ON public.trading_features
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify trading features" ON public.trading_features
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Admin actions policies
CREATE POLICY "Admins can view all admin actions" ON public.admin_actions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Deposits policies
CREATE POLICY "Users can view their own deposits" ON public.deposits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deposits" ON public.deposits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all deposits" ON public.deposits
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications" ON public.notifications
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON public.kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON public.kyc_documents(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_action ON public.wallet_transactions(action);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_trade_type ON public.trades(trade_type);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_outcome ON public.trades(outcome);
CREATE INDEX IF NOT EXISTS idx_trading_features_type ON public.trading_features(type);
CREATE INDEX IF NOT EXISTS idx_trading_features_enabled ON public.trading_features(is_enabled);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON public.admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON public.deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON public.deposits(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- =============================================
-- 8. ENABLE REAL-TIME FOR LIVE UPDATES
-- =============================================

ALTER TABLE public.wallet_transactions REPLICA IDENTITY FULL;
ALTER TABLE public.withdrawal_requests REPLICA IDENTITY FULL;
ALTER TABLE public.trades REPLICA IDENTITY FULL;
ALTER TABLE public.trading_features REPLICA IDENTITY FULL;
ALTER TABLE public.admin_actions REPLICA IDENTITY FULL;
ALTER TABLE public.deposits REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.kyc_documents REPLICA IDENTITY FULL;

-- =============================================
-- 9. GRANT NECESSARY PERMISSIONS
-- =============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =============================================
-- 10. FINAL SETUP COMPLETE
-- =============================================

-- Add comments for documentation
COMMENT ON TABLE public.profiles IS 'User profiles with wallet balances and KYC status';
COMMENT ON TABLE public.user_roles IS 'User role assignments (admin/user)';
COMMENT ON TABLE public.kyc_documents IS 'KYC document submissions and verification';
COMMENT ON TABLE public.wallet_transactions IS 'All wallet-related transactions and adjustments';
COMMENT ON TABLE public.withdrawal_requests IS 'User withdrawal requests with admin approval';
COMMENT ON TABLE public.trades IS 'All trading activities across different types';
COMMENT ON TABLE public.trading_features IS 'Configurable trading features and limits';
COMMENT ON TABLE public.admin_actions IS 'Audit trail for all admin actions';
COMMENT ON TABLE public.deposits IS 'User deposit requests with proof uploads';
COMMENT ON TABLE public.notifications IS 'User notifications and system messages';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Database integration migration completed successfully';
  RAISE NOTICE 'All tables, policies, functions, and triggers are now configured';
  RAISE NOTICE 'Supabase client should now work properly with all features';
END;
$$;
