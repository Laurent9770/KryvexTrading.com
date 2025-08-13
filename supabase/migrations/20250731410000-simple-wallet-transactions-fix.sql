-- =============================================
-- SIMPLE WALLET TRANSACTIONS FIX
-- This migration simply adds missing columns to wallet_transactions table
-- =============================================

-- Add missing columns to wallet_transactions table
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'deposit';
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS wallet_type TEXT DEFAULT 'funding';
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS reference_id UUID;
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS reference_table TEXT;
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id);
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON public.wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON public.wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_type ON public.wallet_transactions(wallet_type);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own wallet transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can create own wallet transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins can view all wallet transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins can manage all wallet transactions" ON public.wallet_transactions;

-- Create RLS policies
CREATE POLICY "Users can view own wallet transactions" ON public.wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own wallet transactions" ON public.wallet_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallet transactions" ON public.wallet_transactions
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all wallet transactions" ON public.wallet_transactions
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_wallet_transactions_updated_at ON public.wallet_transactions;
CREATE TRIGGER update_wallet_transactions_updated_at
    BEFORE UPDATE ON public.wallet_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
