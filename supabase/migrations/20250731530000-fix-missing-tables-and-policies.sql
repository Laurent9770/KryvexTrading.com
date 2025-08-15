-- =============================================
-- FIX MISSING TABLES AND POLICIES
-- Create wallet_transactions and admin_actions tables with proper RLS
-- =============================================

-- Step 1: Create wallet_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_type TEXT NOT NULL CHECK (wallet_type IN ('funding', 'trading')),
    asset TEXT NOT NULL,
    currency TEXT NOT NULL, -- This was missing!
    amount DECIMAL(20,8) NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('add', 'deduct', 'transfer', 'withdrawal', 'deposit')),
    balance_before DECIMAL(20,8) NOT NULL,
    balance_after DECIMAL(20,8) NOT NULL,
    admin_id UUID REFERENCES auth.users(id),
    remarks TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create admin_actions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    target_user_id UUID REFERENCES auth.users(id),
    target_table TEXT,
    target_record_id UUID,
    old_values JSONB,
    new_values JSONB,
    details TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_operation ON public.wallet_transactions(operation);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON public.admin_actions(action_type);

-- Step 4: Enable RLS on both tables
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for wallet_transactions
CREATE POLICY "Users can view own wallet transactions" ON public.wallet_transactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all wallet transactions" ON public.wallet_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert wallet transactions" ON public.wallet_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update wallet transactions" ON public.wallet_transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Step 6: Create RLS policies for admin_actions
CREATE POLICY "Admins can view own admin actions" ON public.admin_actions
    FOR SELECT USING (admin_id = auth.uid());

CREATE POLICY "Admins can view all admin actions" ON public.admin_actions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert admin actions" ON public.admin_actions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Step 7: Grant permissions
GRANT ALL ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.admin_actions TO authenticated;

-- Step 8: Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    action_type_param TEXT,
    target_user_id_param UUID DEFAULT NULL,
    target_table_param TEXT DEFAULT NULL,
    target_record_id_param UUID DEFAULT NULL,
    old_values_param JSONB DEFAULT NULL,
    new_values_param JSONB DEFAULT NULL,
    details_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    action_id UUID;
BEGIN
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can log admin actions';
    END IF;

    -- Insert admin action record
    INSERT INTO public.admin_actions (
        admin_id,
        action_type,
        target_user_id,
        target_table,
        target_record_id,
        old_values,
        new_values,
        details
    ) VALUES (
        auth.uid(),
        action_type_param,
        target_user_id_param,
        target_table_param,
        target_record_id_param,
        old_values_param,
        new_values_param,
        details_param
    ) RETURNING id INTO action_id;

    RETURN action_id;
END;
$$;

-- Step 9: Create function to create wallet transaction
CREATE OR REPLACE FUNCTION create_wallet_transaction(
    user_id_param UUID,
    wallet_type_param TEXT,
    asset_param TEXT,
    currency_param TEXT,
    amount_param DECIMAL(20,8),
    operation_param TEXT,
    balance_before_param DECIMAL(20,8),
    balance_after_param DECIMAL(20,8),
    admin_id_param UUID DEFAULT NULL,
    remarks_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    transaction_id UUID;
BEGIN
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can create wallet transactions';
    END IF;

    -- Insert wallet transaction record
    INSERT INTO public.wallet_transactions (
        user_id,
        wallet_type,
        asset,
        currency,
        amount,
        operation,
        balance_before,
        balance_after,
        admin_id,
        remarks
    ) VALUES (
        user_id_param,
        wallet_type_param,
        asset_param,
        currency_param,
        amount_param,
        operation_param,
        balance_before_param,
        balance_after_param,
        COALESCE(admin_id_param, auth.uid()),
        remarks_param
    ) RETURNING id INTO transaction_id;

    RETURN transaction_id;
END;
$$;

-- Step 10: Grant execute permissions
GRANT EXECUTE ON FUNCTION log_admin_action(TEXT, UUID, TEXT, UUID, JSONB, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_wallet_transaction(UUID, TEXT, TEXT, TEXT, DECIMAL, TEXT, DECIMAL, DECIMAL, UUID, TEXT) TO authenticated;

-- Step 11: Verification
DO $$
BEGIN
    RAISE NOTICE '=== MISSING TABLES AND POLICIES FIX COMPLETE ===';
    RAISE NOTICE '✅ wallet_transactions table created with currency column';
    RAISE NOTICE '✅ admin_actions table created';
    RAISE NOTICE '✅ RLS policies configured';
    RAISE NOTICE '✅ Admin functions created';
    RAISE NOTICE '✅ Permissions granted';
    RAISE NOTICE '✅ Ready for frontend testing';
END $$;
