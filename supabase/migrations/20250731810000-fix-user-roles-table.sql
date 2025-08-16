-- =====================================================
-- FIX USER_ROLES TABLE STRUCTURE
-- =====================================================
-- This migration fixes the user_roles table structure
-- =====================================================

-- 1. ENSURE USER_ROLES TABLE EXISTS WITH PROPER STRUCTURE
-- =====================================================

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ADD MISSING COLUMNS IF THEY DON'T EXIST
-- =====================================================

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_roles' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.user_roles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_roles' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE public.user_roles ADD COLUMN id UUID DEFAULT gen_random_uuid();
        ALTER TABLE public.user_roles ADD PRIMARY KEY (id);
    END IF;
END $$;

-- 3. ENSURE UNIQUE CONSTRAINT EXISTS
-- =====================================================

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_roles_user_id_role_key'
    ) THEN
        ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
    END IF;
END $$;

-- 4. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_created_at ON public.user_roles(created_at);

-- 5. ENABLE RLS AND SET PERMISSIONS
-- =====================================================

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- 6. CREATE RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create new policies
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roles" ON public.user_roles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 7. UPDATE EXISTING RECORDS
-- =====================================================

-- Update existing records to have updated_at timestamp
UPDATE public.user_roles 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- 8. VERIFICATION
-- =====================================================

DO $$
DECLARE
    column_count INTEGER;
    constraint_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Count columns
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles';
    
    RAISE NOTICE '📊 user_roles table has % columns', column_count;
    
    -- Count constraints
    SELECT COUNT(*) INTO constraint_count
    FROM pg_constraint 
    WHERE conrelid = 'public.user_roles'::regclass;
    
    RAISE NOTICE '📊 user_roles table has % constraints', constraint_count;
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'user_roles' 
    AND schemaname = 'public';
    
    RAISE NOTICE '📊 user_roles table has % indexes', index_count;
    
    RAISE NOTICE '✅ user_roles table structure fixed successfully!';
END $$;
