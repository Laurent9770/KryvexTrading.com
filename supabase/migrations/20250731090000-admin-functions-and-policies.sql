-- Admin Functions and Policies Migration
-- This migration sets up all necessary database objects for admin functionality

-- 1. Create admin role management function
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has admin role in profiles table
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = has_role.user_id 
    AND profiles.role = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.has_role(user_id, 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure profiles table has role column
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
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
END $$;

-- 4. Create admin dashboard statistics function
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

-- 5. Create function to get user trading statistics
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

-- 6. Create function to update KYC status
CREATE OR REPLACE FUNCTION public.update_kyc_status(
    user_uuid UUID,
    new_status TEXT,
    admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update KYC status
    UPDATE public.profiles 
    SET 
        kyc_status = new_status,
        is_verified = (new_status = 'approved'),
        updated_at = now()
    WHERE user_id = user_uuid;
    
    -- Log admin action
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

-- 7. Create function to adjust user balance
CREATE OR REPLACE FUNCTION public.adjust_user_balance(
    user_uuid UUID,
    amount DECIMAL(20, 8),
    operation TEXT, -- 'add' or 'subtract'
    reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_balance DECIMAL(20, 8);
    new_balance DECIMAL(20, 8);
BEGIN
    -- Get current balance
    SELECT account_balance INTO current_balance 
    FROM public.profiles 
    WHERE user_id = user_uuid;
    
    IF current_balance IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate new balance
    IF operation = 'add' THEN
        new_balance := current_balance + amount;
    ELSIF operation = 'subtract' THEN
        new_balance := current_balance - amount;
        IF new_balance < 0 THEN
            RETURN FALSE; -- Insufficient balance
        END IF;
    ELSE
        RETURN FALSE; -- Invalid operation
    END IF;
    
    -- Update balance
    UPDATE public.profiles 
    SET 
        account_balance = new_balance,
        updated_at = now()
    WHERE user_id = user_uuid;
    
    -- Log admin action
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

-- 8. Create function to approve/reject withdrawal requests
CREATE OR REPLACE FUNCTION public.process_withdrawal_request(
    request_id UUID,
    new_status TEXT,
    admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    request_record RECORD;
BEGIN
    -- Get withdrawal request details
    SELECT * INTO request_record 
    FROM public.withdrawal_requests 
    WHERE id = request_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update withdrawal request status
    UPDATE public.withdrawal_requests 
    SET 
        status = new_status,
        processed_at = CASE WHEN new_status IN ('approved', 'rejected') THEN now() ELSE processed_at END,
        remarks = COALESCE(admin_notes, remarks)
    WHERE id = request_id;
    
    -- Log admin action
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

-- 9. Create function to approve/reject deposits
CREATE OR REPLACE FUNCTION public.process_deposit(
    deposit_id UUID,
    new_status TEXT,
    admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    deposit_record RECORD;
BEGIN
    -- Get deposit details
    SELECT * INTO deposit_record 
    FROM public.deposits 
    WHERE id = deposit_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update deposit status
    UPDATE public.deposits 
    SET 
        status = new_status,
        processed_at = CASE WHEN new_status IN ('approved', 'rejected') THEN now() ELSE processed_at END,
        remarks = COALESCE(admin_notes, remarks)
    WHERE id = deposit_id;
    
    -- If approved, add to user balance
    IF new_status = 'approved' AND deposit_record.status != 'approved' THEN
        PERFORM public.adjust_user_balance(
            deposit_record.user_id, 
            deposit_record.amount, 
            'add', 
            'Deposit approved: ' || deposit_id
        );
    END IF;
    
    -- Log admin action
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

-- 10. Enhanced RLS policies for admin access

-- Profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

-- Trades policies
DROP POLICY IF EXISTS "Admins can view all trades" ON public.trades;
CREATE POLICY "Admins can view all trades" ON public.trades
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update trades" ON public.trades;
CREATE POLICY "Admins can update trades" ON public.trades
  FOR UPDATE USING (public.is_admin());

-- 11. Create admin dashboard view
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

-- 12. Grant permissions for admin functions
GRANT EXECUTE ON FUNCTION public.has_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_trading_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_kyc_status(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_user_balance(UUID, DECIMAL, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_withdrawal_request(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_deposit(UUID, TEXT, TEXT) TO authenticated;

-- Grant permissions for admin dashboard view
GRANT SELECT ON public.admin_dashboard_view TO authenticated;

-- 13. Create admin role for testing (optional - remove in production)
-- INSERT INTO public.profiles (user_id, email, full_name, role, is_verified, kyc_status)
-- VALUES (
--     '00000000-0000-0000-0000-000000000000', -- Replace with actual admin user ID
--     'admin@kryvex.com',
--     'Admin User',
--     'admin',
--     true,
--     'approved'
-- )
-- ON CONFLICT (user_id) DO UPDATE SET
--     role = 'admin',
--     is_verified = true,
--     kyc_status = 'approved';

-- 14. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_status ON public.profiles(kyc_status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_trades_user_id_status ON public.trades(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trades_result ON public.trades(result);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status_created ON public.withdrawal_requests(status, requested_at);
CREATE INDEX IF NOT EXISTS idx_deposits_status_created ON public.deposits(status, created_at);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON public.admin_actions(action_type);

-- 15. Verify the setup
DO $$
DECLARE
    admin_count INTEGER;
    user_count INTEGER;
    function_count INTEGER;
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
    SELECT COUNT(*) INTO user_count FROM public.profiles WHERE role = 'user';
    SELECT COUNT(*) INTO function_count FROM pg_proc WHERE proname IN ('has_role', 'is_admin', 'get_admin_dashboard_stats', 'update_kyc_status', 'adjust_user_balance');
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
    
    RAISE NOTICE 'Admin setup verification:';
    RAISE NOTICE '- Admin users: %', admin_count;
    RAISE NOTICE '- Regular users: %', user_count;
    RAISE NOTICE '- Admin functions created: %', function_count;
    RAISE NOTICE '- RLS policies: %', policy_count;
    RAISE NOTICE 'Admin functionality is ready!';
END $$;
