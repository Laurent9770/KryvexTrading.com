-- =============================================
-- FIX AMBIGUOUS COLUMN REFERENCE
-- Fix the wallet_type parameter conflict in get_user_wallet_balance function
-- =============================================

-- Fix the get_user_wallet_balance function to resolve ambiguous column reference
CREATE OR REPLACE FUNCTION get_user_wallet_balance(
    target_user_email TEXT DEFAULT NULL,
    wallet_type_param TEXT DEFAULT NULL,
    currency_param TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    target_user_id UUID;
    result JSONB;
    wallet_data JSONB;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- If no target email provided, use current user
    IF target_user_email IS NULL THEN
        target_user_id := current_user_id;
    ELSE
        -- Get target user ID
        SELECT id INTO target_user_id 
        FROM auth.users 
        WHERE email = target_user_email;
        
        IF target_user_id IS NULL THEN
            RAISE EXCEPTION 'Target user not found: %', target_user_email;
        END IF;
        
        -- Check if current user can view this user's balance
        IF current_user_id != target_user_id AND 
           NOT EXISTS (
               SELECT 1 FROM public.user_roles 
               WHERE user_id = current_user_id AND role = 'admin'
           ) THEN
            RAISE EXCEPTION 'Unauthorized to view this user''s balance';
        END IF;
    END IF;
    
    -- Build wallet data with explicit table aliases to avoid ambiguity
    SELECT jsonb_agg(
        jsonb_build_object(
            'wallet_type', uw.wallet_type,
            'asset', uw.asset,
            'balance', uw.balance,
            'updated_at', uw.updated_at
        )
    ) INTO wallet_data
    FROM public.user_wallets uw
    WHERE uw.user_id = target_user_id
    AND (wallet_type_param IS NULL OR uw.wallet_type = wallet_type_param)
    AND (currency_param IS NULL OR uw.asset = currency_param);
    
    -- Get user info
    SELECT jsonb_build_object(
        'user_id', target_user_id,
        'email', u.email,
        'full_name', p.full_name,
        'account_balance', COALESCE(p.account_balance, 0),
        'wallets', COALESCE(wallet_data, '[]'::jsonb),
        'total_balance_usd', (
            SELECT COALESCE(SUM(balance), 0)
            FROM public.user_wallets
            WHERE user_id = target_user_id AND asset = 'USD'
        ),
        'last_updated', (
            SELECT MAX(updated_at)
            FROM public.user_wallets
            WHERE user_id = target_user_id
        )
    ) INTO result
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.user_id
    WHERE u.id = target_user_id;
    
    RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_wallet_balance(TEXT, TEXT, TEXT) TO authenticated;

-- Test the fixed function
DO $$
DECLARE
    test_result JSONB;
BEGIN
    RAISE NOTICE '=== TESTING FIXED get_user_wallet_balance FUNCTION ===';
    
    -- Test the function
    SELECT get_user_wallet_balance() INTO test_result;
    RAISE NOTICE '✅ get_user_wallet_balance test: %', test_result;
    
    RAISE NOTICE '✅ Ambiguous column reference fixed successfully!';
END $$;
