-- Add admin action logs table for audit trail
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_user_id UUID,
  target_table TEXT,
  target_id UUID,
  old_values JSONB,
  new_values JSONB,
  description TEXT NOT NULL,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add admin notifications table for sending messages to users
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  target_user_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT DEFAULT 'info' CHECK (notification_type IN ('info', 'warning', 'success', 'error')),
  is_broadcast BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add wallet transactions table for manual balance adjustments
CREATE TABLE IF NOT EXISTS public.wallet_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  admin_id UUID NOT NULL,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('add', 'subtract')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  reason TEXT NOT NULL,
  previous_balance NUMERIC NOT NULL,
  new_balance NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add user sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_token TEXT,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  logout_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all new tables
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_actions
CREATE POLICY "Admins can view all admin actions" 
ON public.admin_actions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert admin actions" 
ON public.admin_actions 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

-- RLS policies for admin_notifications
CREATE POLICY "Admins can manage notifications" 
ON public.admin_notifications 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their notifications" 
ON public.admin_notifications 
FOR SELECT 
USING (auth.uid() = target_user_id OR is_broadcast = true);

CREATE POLICY "Users can update their notification read status" 
ON public.admin_notifications 
FOR UPDATE 
USING (auth.uid() = target_user_id)
WITH CHECK (auth.uid() = target_user_id);

-- RLS policies for wallet_adjustments
CREATE POLICY "Admins can view all wallet adjustments" 
ON public.wallet_adjustments 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create wallet adjustments" 
ON public.wallet_adjustments 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

CREATE POLICY "Users can view their own wallet adjustments" 
ON public.wallet_adjustments 
FOR SELECT 
USING (auth.uid() = user_id);

-- RLS policies for user_sessions
CREATE POLICY "Admins can view all sessions" 
ON public.user_sessions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add some additional columns to profiles for admin control
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'blocked')),
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_id UUID,
  p_action_type TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_target_table TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_description TEXT DEFAULT '',
  p_ip_address INET DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  action_id UUID;
BEGIN
  INSERT INTO public.admin_actions (
    admin_id, action_type, target_user_id, target_table, target_id,
    old_values, new_values, description, ip_address
  ) VALUES (
    p_admin_id, p_action_type, p_target_user_id, p_target_table, p_target_id,
    p_old_values, p_new_values, p_description, p_ip_address
  ) RETURNING id INTO action_id;
  
  RETURN action_id;
END;
$$;