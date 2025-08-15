-- =============================================
-- USER BALANCE MANAGEMENT SYSTEM
-- =============================================

-- Step 1: Create balance history table
CREATE TABLE IF NOT EXISTS public.balance_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_type TEXT NOT NULL,
    asset TEXT NOT NULL,
    previous_balance DECIMAL(20,8) NOT NULL,
    new_balance DECIMAL(20,8) NOT NULL,
    change_amount DECIMAL(20,8) NOT NULL,
    change_type TEXT NOT NULL CHECK (change_type IN ('admin_adjustment', 'deposit', 'withdrawal', 'trade', 'fee', 'bonus', 'correction')),
    reason TEXT,
    admin_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_balance_history_user_id ON public.balance_history(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_history_created_at ON public.balance_history(created_at);

-- Step 3: Enable RLS
ALTER TABLE public.balance_history ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
CREATE POLICY "Users can view own balance history" ON public.balance_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all balance history" ON public.balance_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert balance history" ON public.balance_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Step 5: Create function to update user balance
CREATE OR REPLACE FUNCTION update_user_balance(
    target_user_id UUID,
    wallet_type_param TEXT,
    asset_param TEXT,
    new_balance DECIMAL(20,8),
    change_type_param TEXT DEFAULT 'admin_adjustment',
    reason_param TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance DECIMAL(20,8);
    change_amount DECIMAL(20,8);
    result JSONB;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can update user balances';
    END IF;

    SELECT balance INTO current_balance
    FROM public.user_wallets
    WHERE user_id = target_user_id 
      AND wallet_type = wallet_type_param 
      AND asset = asset_param;

    IF current_balance IS NULL THEN
        INSERT INTO public.user_wallets (user_id, wallet_type, asset, balance)
        VALUES (target_user_id, wallet_type_param, asset_param, new_balance)
        ON CONFLICT (user_id, wallet_type, asset) DO UPDATE SET
            balance = new_balance,
            updated_at = NOW();
        current_balance := 0;
    ELSE
        UPDATE public.user_wallets
        SET balance = new_balance, updated_at = NOW()
        WHERE user_id = target_user_id 
          AND wallet_type = wallet_type_param 
          AND asset = asset_param;
    END IF;

    change_amount := new_balance - current_balance;

    INSERT INTO public.balance_history (
        user_id, wallet_type, asset, previous_balance, new_balance, 
        change_amount, change_type, reason, admin_id
    ) VALUES (
        target_user_id, wallet_type_param, asset_param, current_balance, new_balance,
        change_amount, change_type_param, reason_param, auth.uid()
    );

    result := jsonb_build_object(
        'success', true,
        'user_id', target_user_id,
        'wallet_type', wallet_type_param,
        'asset', asset_param,
        'previous_balance', current_balance,
        'new_balance', new_balance,
        'change_amount', change_amount,
        'change_type', change_type_param,
        'reason', reason_param,
        'admin_id', auth.uid(),
        'timestamp', NOW()
    );

    RETURN result;
END;
$$;

-- Step 6: Create admin view for all user balances
CREATE OR REPLACE VIEW admin_user_balances AS
SELECT 
    u.id as user_id,
    u.email,
    p.full_name,
    p.is_verified,
    p.kyc_status,
    COALESCE(p.account_status, 'active') as account_status,
    ur.role,
    uw.wallet_type,
    uw.asset,
    uw.balance,
    uw.updated_at as last_balance_update,
    u.created_at as user_created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.user_wallets uw ON u.id = uw.user_id
ORDER BY u.created_at DESC, uw.wallet_type, uw.asset;

-- Step 7: Create admin view for balance summary
CREATE OR REPLACE VIEW admin_balance_summary AS
SELECT 
    u.id as user_id,
    u.email,
    p.full_name,
    ur.role,
    COUNT(uw.id) as wallet_count,
    SUM(CASE WHEN uw.asset = 'USDT' THEN uw.balance ELSE 0 END) as total_usdt,
    SUM(CASE WHEN uw.asset = 'USD' THEN uw.balance ELSE 0 END) as total_usd,
    SUM(CASE WHEN uw.wallet_type = 'trading' THEN uw.balance ELSE 0 END) as trading_balance,
    SUM(CASE WHEN uw.wallet_type = 'funding' THEN uw.balance ELSE 0 END) as funding_balance,
    MAX(uw.updated_at) as last_activity,
    u.created_at as user_created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.user_wallets uw ON u.id = uw.user_id
GROUP BY u.id, u.email, p.full_name, ur.role, u.created_at
ORDER BY total_usdt DESC NULLS LAST;

-- Step 8: Grant permissions
GRANT ALL ON public.balance_history TO authenticated;
GRANT SELECT ON admin_user_balances TO authenticated;
GRANT SELECT ON admin_balance_summary TO authenticated;

-- Step 9: Note: Views don't need RLS policies, access control is handled at the application level

-- Step 10: Create function to get system balance statistics
CREATE OR REPLACE FUNCTION get_system_balance_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can view system statistics';
    END IF;

    SELECT jsonb_build_object(
        'total_users', (SELECT COUNT(*) FROM auth.users),
        'active_users', (SELECT COUNT(*) FROM public.profiles),
        'total_usdt_balance', (SELECT COALESCE(SUM(balance), 0) FROM public.user_wallets WHERE asset = 'USDT'),
        'total_usd_balance', (SELECT COALESCE(SUM(balance), 0) FROM public.user_wallets WHERE asset = 'USD'),
        'total_trading_balance', (SELECT COALESCE(SUM(balance), 0) FROM public.user_wallets WHERE wallet_type = 'trading'),
        'total_funding_balance', (SELECT COALESCE(SUM(balance), 0) FROM public.user_wallets WHERE wallet_type = 'funding'),
        'wallet_count', (SELECT COUNT(*) FROM public.user_wallets),
        'balance_history_count', (SELECT COUNT(*) FROM public.balance_history),
        'last_balance_update', (SELECT MAX(updated_at) FROM public.user_wallets),
        'last_balance_change', (SELECT MAX(created_at) FROM public.balance_history)
    ) INTO result;

    RETURN result;
END;
$$;
