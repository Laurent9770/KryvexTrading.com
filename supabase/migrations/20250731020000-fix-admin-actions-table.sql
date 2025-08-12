-- Fix Admin Actions Table Migration
-- This migration drops and recreates the admin_actions table with correct structure

-- 1. Drop existing admin_actions table if it exists
DROP TABLE IF EXISTS public.admin_actions CASCADE;

-- 2. Create admin_actions table with correct structure
CREATE TABLE public.admin_actions (
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

-- 3. Enable RLS on admin_actions table
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- 4. Create basic RLS policy for admin_actions
CREATE POLICY "Admins can view admin actions" ON public.admin_actions
  FOR SELECT USING (true); -- We'll update this later when admin functions are created

CREATE POLICY "Admins can create admin actions" ON public.admin_actions
  FOR INSERT WITH CHECK (true); -- We'll update this later when admin functions are created

-- 5. Grant permissions
GRANT SELECT, INSERT ON public.admin_actions TO authenticated;

-- 6. Create index
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_email ON public.admin_actions(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON public.admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at);

-- 7. Verify the table was created correctly
DO $$
DECLARE
    col_name TEXT;
    col_type TEXT;
BEGIN
    RAISE NOTICE '=== ADMIN_ACTIONS TABLE CREATED ===';
    RAISE NOTICE 'Columns in admin_actions table:';
    
    FOR col_name, col_type IN 
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'admin_actions'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '- % (%)', col_name, col_type;
    END LOOP;
END $$;
