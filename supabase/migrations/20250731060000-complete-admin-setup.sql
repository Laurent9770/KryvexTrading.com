-- Complete Admin Setup Migration
-- This migration sets up all admin functionality in the correct order

-- 1. Drop existing objects to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage trading pairs" ON public.trading_pairs;
DROP POLICY IF EXISTS "Admins can view all KYC documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Admins can view all admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all trades" ON public.trades;
DROP POLICY IF EXISTS "Admins can update trades" ON public.trades;
DROP POLICY IF EXISTS "Admin actions are admin only" ON public.admin_actions;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can manage all withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can manage all deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admins can view admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Admins can create admin actions" ON public.admin_actions;

DROP FUNCTION IF EXISTS public.has_role(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_dashboard_stats() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_trading_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_kyc_status(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.adjust_user_balance(UUID, DECIMAL, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.process_withdrawal_request(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.process_deposit(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.promote_to_admin(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.demote_from_admin(TEXT) CASCADE;

-- 2. Ensure profiles table has all required columns
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check if role column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));
        RAISE NOTICE 'Added role column to profiles table';
    END IF;
    
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

-- 3. Ensure trades table has all required columns
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

-- 4. Create all required tables
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trading_account JSONB DEFAULT '{}',
  funding_account JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

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

-- 5. Enable RLS on all tables
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- 6. Create admin functions
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = has_role.user_id 
    AND profiles.role = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.has_role(user_id, 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalUsers', (SELECT COUNT(*) FROM public.profiles),
        'verifiedUsers', (SELECT COUNT(*) FROM public.profiles WHERE is_verified = true),
        'pendingKYC', (SELECT COUNT(*) FROM public.profiles WHERE kyc_status = 'pending'),
        'totalTrades', (SELECT COUNT(*) FROM public.trades),
        'completedTrades', (SELECT COUNT(*) FROM public.trades WHERE status = 'completed'),
        'winningTrades', (SELECT COUNT(*) FROM public.trades WHERE status = 'completed' AND result = 'win'),
        'totalBalance', (SELECT COALESCE(SUM(account_balance), 0) FROM public.profiles),
        'pendingDeposits', (SELECT COUNT(*) FROM public.deposits WHERE status = 'pending'),
        'pendingWithdrawals', (SELECT COUNT(*) FROM public.withdrawal_requests WHERE status = 'pending')
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_trading_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalTrades', (SELECT COUNT(*) FROM public.trades WHERE user_id = user_uuid),
        'completedTrades', (SELECT COUNT(*) FROM public.trades WHERE user_id = user_uuid AND status = 'completed'),
        'winningTrades', (SELECT COUNT(*) FROM public.trades WHERE user_id = user_uuid AND status = 'completed' AND result = 'win'),
        'totalProfit', (SELECT COALESCE(SUM(profit_loss), 0) FROM public.trades WHERE user_id = user_uuid AND status = 'completed'),
        'winRate', CASE 
            WHEN (SELECT COUNT(*) FROM public.trades WHERE user_id = user_uuid AND status = 'completed') > 0 
            THEN ROUND(
                (SELECT COUNT(*) FROM public.trades WHERE user_id = user_uuid AND status = 'completed' AND result = 'win')::DECIMAL / 
                (SELECT COUNT(*) FROM public.trades WHERE user_id = user_uuid AND status = 'completed')::DECIMAL * 100, 2
            )
            ELSE 0
        END
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_kyc_status(
    user_uuid UUID,
    new_status TEXT,
    admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.profiles 
    SET 
        kyc_status = new_status,
        is_verified = (new_status = 'approved'),
        updated_at = now()
    WHERE user_id = user_uuid;
    
    INSERT INTO public.admin_actions (
        admin_email,
        action_type,
        target_table,
        target_id,
        description,
        new_values
    ) VALUES (
        (SELECT email FROM auth.users WHERE id = auth.uid()),
        'kyc_status_update',
        'profiles',
        user_uuid::text,
        'KYC status updated to ' || new_status,
        json_build_object('kyc_status', new_status, 'admin_notes', admin_notes)
    );
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.adjust_user_balance(
    user_uuid UUID,
    amount DECIMAL(20, 8),
    operation TEXT,
    reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_balance DECIMAL(20, 8);
    new_balance DECIMAL(20, 8);
BEGIN
    SELECT account_balance INTO current_balance 
    FROM public.profiles 
    WHERE user_id = user_uuid;
    
    IF current_balance IS NULL THEN
        RETURN FALSE;
    END IF;
    
    IF operation = 'add' THEN
        new_balance := current_balance + amount;
    ELSIF operation = 'subtract' THEN
        new_balance := current_balance - amount;
        IF new_balance < 0 THEN
            RETURN FALSE;
        END IF;
    ELSE
        RETURN FALSE;
    END IF;
    
    UPDATE public.profiles 
    SET 
        account_balance = new_balance,
        updated_at = now()
    WHERE user_id = user_uuid;
    
    INSERT INTO public.admin_actions (
        admin_email,
        action_type,
        target_table,
        target_id,
        description,
        old_values,
        new_values
    ) VALUES (
        (SELECT email FROM auth.users WHERE id = auth.uid()),
        'balance_adjustment',
        'profiles',
        user_uuid::text,
        'Balance adjusted: ' || operation || ' ' || amount,
        json_build_object('old_balance', current_balance),
        json_build_object('new_balance', new_balance, 'operation', operation, 'amount', amount, 'reason', reason)
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.process_withdrawal_request(
    request_id UUID,
    new_status TEXT,
    admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    request_record RECORD;
BEGIN
    SELECT * INTO request_record 
    FROM public.withdrawal_requests 
    WHERE id = request_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    UPDATE public.withdrawal_requests 
    SET 
        status = new_status,
        processed_at = CASE WHEN new_status IN ('approved', 'rejected') THEN now() ELSE processed_at END,
        remarks = COALESCE(admin_notes, remarks)
    WHERE id = request_id;
    
    INSERT INTO public.admin_actions (
        admin_email,
        action_type,
        target_table,
        target_id,
        description,
        old_values,
        new_values
    ) VALUES (
        (SELECT email FROM auth.users WHERE id = auth.uid()),
        'withdrawal_processed',
        'withdrawal_requests',
        request_id::text,
        'Withdrawal request ' || new_status,
        json_build_object('old_status', request_record.status),
        json_build_object('new_status', new_status, 'admin_notes', admin_notes)
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.process_deposit(
    deposit_id UUID,
    new_status TEXT,
    admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    deposit_record RECORD;
BEGIN
    SELECT * INTO deposit_record 
    FROM public.deposits 
    WHERE id = deposit_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    UPDATE public.deposits 
    SET 
        status = new_status,
        processed_at = CASE WHEN new_status IN ('approved', 'rejected') THEN now() ELSE processed_at END,
        remarks = COALESCE(admin_notes, remarks)
    WHERE id = deposit_id;
    
    IF new_status = 'approved' AND deposit_record.status != 'approved' THEN
        PERFORM public.adjust_user_balance(
            deposit_record.user_id, 
            deposit_record.amount, 
            'add', 
            'Deposit approved: ' || deposit_id
        );
    END IF;
    
    INSERT INTO public.admin_actions (
        admin_email,
        action_type,
        target_table,
        target_id,
        description,
        old_values,
        new_values
    ) VALUES (
        (SELECT email FROM auth.users WHERE id = auth.uid()),
        'deposit_processed',
        'deposits',
        deposit_id::text,
        'Deposit ' || new_status,
        json_build_object('old_status', deposit_record.status),
        json_build_object('new_status', new_status, 'admin_notes', admin_notes)
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.profiles 
    SET 
        role = 'admin',
        is_verified = true,
        kyc_status = 'approved',
        updated_at = now()
    WHERE email = user_email;
    
    IF FOUND THEN
        RAISE NOTICE 'User % has been promoted to admin', user_email;
        RETURN TRUE;
    ELSE
        RAISE NOTICE 'User % not found in profiles table', user_email;
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.demote_from_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.profiles 
    SET 
        role = 'user',
        updated_at = now()
    WHERE email = user_email AND role = 'admin';
    
    IF FOUND THEN
        RAISE NOTICE 'User % has been demoted from admin', user_email;
        RETURN TRUE;
    ELSE
        RAISE NOTICE 'User % not found or is not an admin', user_email;
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create RLS policies
CREATE POLICY "Users can view their own wallet" ON public.user_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own withdrawal requests" ON public.withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawal requests" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own deposits" ON public.deposits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create deposits" ON public.deposits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can view all trades" ON public.trades
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update trades" ON public.trades
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can view all wallets" ON public.user_wallets
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage all withdrawal requests" ON public.withdrawal_requests
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage all deposits" ON public.deposits
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can view admin actions" ON public.admin_actions
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can create admin actions" ON public.admin_actions
  FOR INSERT WITH CHECK (public.is_admin());

-- 8. Create admin dashboard view
CREATE OR REPLACE VIEW public.admin_dashboard_view AS
SELECT 
    p.user_id,
    p.email,
    p.full_name,
    p.kyc_status,
    p.account_balance,
    p.is_verified,
    p.role,
    p.created_at,
    p.updated_at,
    COALESCE(ts.total_trades, 0) as total_trades,
    COALESCE(ts.completed_trades, 0) as completed_trades,
    COALESCE(ts.winning_trades, 0) as winning_trades,
    COALESCE(ts.win_rate, 0) as win_rate,
    COALESCE(ts.total_profit, 0) as total_profit,
    COALESCE(wr.pending_withdrawals, 0) as pending_withdrawals,
    COALESCE(d.pending_deposits, 0) as pending_deposits
FROM public.profiles p
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as total_trades,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_trades,
        COUNT(*) FILTER (WHERE status = 'completed' AND result = 'win') as winning_trades,
        CASE 
            WHEN COUNT(*) FILTER (WHERE status = 'completed') > 0 
            THEN ROUND(
                COUNT(*) FILTER (WHERE status = 'completed' AND result = 'win')::DECIMAL / 
                COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL * 100, 2
            )
            ELSE 0
        END as win_rate,
        COALESCE(SUM(profit_loss) FILTER (WHERE status = 'completed'), 0) as total_profit
    FROM public.trades 
    GROUP BY user_id
) ts ON p.user_id = ts.user_id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_withdrawals
    FROM public.withdrawal_requests 
    GROUP BY user_id
) wr ON p.user_id = wr.user_id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_deposits
    FROM public.deposits 
    GROUP BY user_id
) d ON p.user_id = d.user_id;

-- 9. Create admin users view
CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT 
    user_id,
    email,
    full_name,
    role,
    is_verified,
    kyc_status,
    created_at,
    updated_at
FROM public.profiles 
WHERE role = 'admin'
ORDER BY created_at DESC;

-- 10. Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_status ON public.profiles(kyc_status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_trades_user_id_status ON public.trades(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trades_result ON public.trades(result);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status_created ON public.withdrawal_requests(status, requested_at);
CREATE INDEX IF NOT EXISTS idx_deposits_status_created ON public.deposits(status, created_at);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON public.admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON public.deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_email ON public.admin_actions(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at);

-- 11. Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.user_wallets TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.withdrawal_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.deposits TO authenticated;
GRANT SELECT, INSERT ON public.admin_actions TO authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_trading_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_kyc_status(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_user_balance(UUID, DECIMAL, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_withdrawal_request(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_deposit(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_to_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.demote_from_admin(TEXT) TO authenticated;

GRANT SELECT ON public.admin_dashboard_view TO authenticated;
GRANT SELECT ON public.admin_users_view TO authenticated;

-- 12. Insert sample data
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

-- 13. Verify setup
DO $$
DECLARE
    admin_count INTEGER;
    user_count INTEGER;
    function_count INTEGER;
    policy_count INTEGER;
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
    SELECT COUNT(*) INTO user_count FROM public.profiles WHERE role = 'user';
    SELECT COUNT(*) INTO function_count FROM pg_proc WHERE proname IN ('has_role', 'is_admin', 'get_admin_dashboard_stats', 'update_kyc_status', 'adjust_user_balance');
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('user_wallets', 'withdrawal_requests', 'deposits', 'admin_actions');
    
    RAISE NOTICE '=== ADMIN SETUP VERIFICATION ===';
    RAISE NOTICE '- Admin users: %', admin_count;
    RAISE NOTICE '- Regular users: %', user_count;
    RAISE NOTICE '- Admin functions created: %', function_count;
    RAISE NOTICE '- RLS policies: %', policy_count;
    RAISE NOTICE '- Admin tables created: %', table_count;
    RAISE NOTICE 'Admin functionality is ready!';
END $$;
