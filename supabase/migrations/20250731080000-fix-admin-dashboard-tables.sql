-- Fix Admin Dashboard Tables Migration
-- This migration ensures all required tables exist for the admin dashboard

-- 1. Ensure profiles table has all required columns
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check if kyc_status column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'kyc_status'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected'));
        RAISE NOTICE 'Added kyc_status column to profiles table';
    END IF;
    
    -- Check if account_balance column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'account_balance'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN account_balance DECIMAL(20, 8) DEFAULT 0;
        RAISE NOTICE 'Added account_balance column to profiles table';
    END IF;
    
    -- Check if is_verified column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_verified'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_verified column to profiles table';
    END IF;
END $$;

-- 2. Ensure trades table has all required columns
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check if result column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'trades' 
        AND column_name = 'result'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.trades ADD COLUMN result TEXT CHECK (result IN ('pending', 'win', 'loss', 'draw'));
        RAISE NOTICE 'Added result column to trades table';
    END IF;
    
    -- Check if profit_loss column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'trades' 
        AND column_name = 'profit_loss'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.trades ADD COLUMN profit_loss DECIMAL(20, 8) DEFAULT 0;
        RAISE NOTICE 'Added profit_loss column to trades table';
    END IF;
    
    -- Check if completed_at column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'trades' 
        AND column_name = 'completed_at'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.trades ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added completed_at column to trades table';
    END IF;
END $$;

-- 3. Create user_wallets table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trading_account JSONB DEFAULT '{}',
  funding_account JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create withdrawal_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(20, 8) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USDT',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  remarks TEXT
);

-- 5. Create deposits table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(20, 8) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USDT',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  proof_file TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  remarks TEXT
);

-- 6. Create admin_actions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_table TEXT,
  target_id TEXT,
  description TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Enable RLS on new tables
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for new tables
-- User wallets policies
CREATE POLICY "Users can view their own wallet" ON public.user_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON public.user_wallets
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Withdrawal requests policies
CREATE POLICY "Users can view their own withdrawal requests" ON public.withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawal requests" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all withdrawal requests" ON public.withdrawal_requests
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Deposits policies
CREATE POLICY "Users can view their own deposits" ON public.deposits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create deposits" ON public.deposits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all deposits" ON public.deposits
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Admin actions policies (only admins can access)
CREATE POLICY "Admins can view admin actions" ON public.admin_actions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create admin actions" ON public.admin_actions
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON public.deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON public.deposits(status);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_email ON public.admin_actions(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at);

-- 10. Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.user_wallets TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.withdrawal_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.deposits TO authenticated;
GRANT SELECT, INSERT ON public.admin_actions TO authenticated;

-- 11. Create trigger for updated_at on user_wallets
CREATE TRIGGER update_user_wallets_updated_at
  BEFORE UPDATE ON public.user_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Insert some sample data for testing
INSERT INTO public.user_wallets (user_id, trading_account, funding_account)
SELECT 
  p.user_id,
  '{"USDT": {"balance": "0.00", "usdValue": "$0.00", "available": "0.00"}, "BTC": {"balance": "0.00000000", "usdValue": "$0.00", "available": "0.00000000"}, "ETH": {"balance": "0.00000000", "usdValue": "$0.00", "available": "0.00000000"}}'::jsonb,
  '{"USDT": {"balance": "0.00", "usdValue": "$0.00", "available": "0.00"}}'::jsonb
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_wallets uw WHERE uw.user_id = p.user_id
)
ON CONFLICT (user_id) DO NOTHING;

-- 13. Verify the setup
DO $$
DECLARE
    profiles_count INTEGER;
    trades_count INTEGER;
    wallets_count INTEGER;
    withdrawal_requests_count INTEGER;
    deposits_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profiles_count FROM public.profiles;
    SELECT COUNT(*) INTO trades_count FROM public.trades;
    SELECT COUNT(*) INTO wallets_count FROM public.user_wallets;
    SELECT COUNT(*) INTO withdrawal_requests_count FROM public.withdrawal_requests;
    SELECT COUNT(*) INTO deposits_count FROM public.deposits;
    
    RAISE NOTICE 'Setup verification:';
    RAISE NOTICE '- Profiles: %', profiles_count;
    RAISE NOTICE '- Trades: %', trades_count;
    RAISE NOTICE '- User wallets: %', wallets_count;
    RAISE NOTICE '- Withdrawal requests: %', withdrawal_requests_count;
    RAISE NOTICE '- Deposits: %', deposits_count;
END $$;
