-- Create user_trading_modes table for simulation controls
CREATE TABLE IF NOT EXISTS public.user_trading_modes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mode TEXT NOT NULL DEFAULT 'normal' CHECK (mode IN ('normal', 'force_win', 'force_loss', 'bot_80_win')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Add RLS policies
ALTER TABLE public.user_trading_modes ENABLE ROW LEVEL SECURITY;

-- Admins can view all trading modes
CREATE POLICY "Admins can view all trading modes" ON public.user_trading_modes
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Admins can insert trading modes
CREATE POLICY "Admins can insert trading modes" ON public.user_trading_modes
    FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins can update trading modes
CREATE POLICY "Admins can update trading modes" ON public.user_trading_modes
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Admins can delete trading modes
CREATE POLICY "Admins can delete trading modes" ON public.user_trading_modes
    FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_trading_modes_user_id ON public.user_trading_modes(user_id);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_trading_modes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_trading_modes_updated_at
    BEFORE UPDATE ON public.user_trading_modes
    FOR EACH ROW
    EXECUTE FUNCTION update_user_trading_modes_updated_at();
