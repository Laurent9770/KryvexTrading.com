-- =============================================
-- FIX USER WALLETS SCHEMA MIGRATION
-- =============================================

-- Step 1: Drop existing user_wallets table if it exists with wrong schema
DROP TABLE IF EXISTS public.user_wallets CASCADE;

-- Step 2: Recreate user_wallets table with correct schema
CREATE TABLE public.user_wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_type TEXT NOT NULL CHECK (wallet_type IN ('funding', 'trading')),
    asset TEXT NOT NULL,
    balance DECIMAL(20,8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, wallet_type, asset)
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_wallet_type ON public.user_wallets(wallet_type);
CREATE INDEX IF NOT EXISTS idx_user_wallets_asset ON public.user_wallets(asset);

-- Step 4: Create trigger for updated_at
DROP TRIGGER IF EXISTS update_user_wallets_updated_at ON public.user_wallets;
CREATE TRIGGER update_user_wallets_updated_at
    BEFORE UPDATE ON public.user_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Enable RLS
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can update all wallets" ON public.user_wallets;

-- Step 7: Create RLS policies
CREATE POLICY "Users can view own wallets" ON public.user_wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON public.user_wallets
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all wallets" ON public.user_wallets
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Step 8: Grant permissions
GRANT ALL ON public.user_wallets TO authenticated;

-- Step 9: Insert sample wallet data for existing users (optional)
INSERT INTO public.user_wallets (user_id, wallet_type, asset, balance)
SELECT 
    p.user_id,
    'trading' as wallet_type,
    'USDT' as asset,
    COALESCE(p.account_balance, 0) as balance
FROM public.profiles p
WHERE p.user_id IS NOT NULL
ON CONFLICT (user_id, wallet_type, asset) DO UPDATE SET
    balance = EXCLUDED.balance,
    updated_at = NOW();
