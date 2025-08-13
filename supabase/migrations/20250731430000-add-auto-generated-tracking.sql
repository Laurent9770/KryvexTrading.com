-- =============================================
-- ADD AUTO-GENERATED TRACKING
-- This migration adds tracking for system-created entries
-- =============================================

-- Add auto_generated column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false;

-- Add auto_generated column to user_wallets table
ALTER TABLE public.user_wallets ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false;

-- Add auto_generated column to user_roles table
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false;

-- Update existing entries to mark them as auto-generated if they were created by our migration
UPDATE public.profiles 
SET auto_generated = true 
WHERE created_at = updated_at 
AND auto_generated = false;

UPDATE public.user_wallets 
SET auto_generated = true 
WHERE created_at = updated_at 
AND auto_generated = false;

UPDATE public.user_roles 
SET auto_generated = true 
WHERE created_at = updated_at 
AND auto_generated = false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_auto_generated ON public.profiles(auto_generated);
CREATE INDEX IF NOT EXISTS idx_user_wallets_auto_generated ON public.user_wallets(auto_generated);
CREATE INDEX IF NOT EXISTS idx_user_roles_auto_generated ON public.user_roles(auto_generated);

-- Show summary of auto-generated entries
DO $$
DECLARE
    profiles_auto_count INTEGER;
    wallets_auto_count INTEGER;
    roles_auto_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profiles_auto_count FROM public.profiles WHERE auto_generated = true;
    SELECT COUNT(*) INTO wallets_auto_count FROM public.user_wallets WHERE auto_generated = true;
    SELECT COUNT(*) INTO roles_auto_count FROM public.user_roles WHERE auto_generated = true;
    
    RAISE NOTICE '=== AUTO-GENERATED ENTRIES SUMMARY ===';
    RAISE NOTICE 'Auto-generated profiles: %', profiles_auto_count;
    RAISE NOTICE 'Auto-generated wallets: %', wallets_auto_count;
    RAISE NOTICE 'Auto-generated roles: %', roles_auto_count;
    RAISE NOTICE '✅ Auto-generated tracking added successfully!';
END $$;

-- Show sample of auto-generated vs user-created entries
SELECT 
    'profiles' as table_name,
    auto_generated,
    COUNT(*) as count
FROM public.profiles 
GROUP BY auto_generated
UNION ALL
SELECT 
    'user_wallets' as table_name,
    auto_generated,
    COUNT(*) as count
FROM public.user_wallets 
GROUP BY auto_generated
UNION ALL
SELECT 
    'user_roles' as table_name,
    auto_generated,
    COUNT(*) as count
FROM public.user_roles 
GROUP BY auto_generated
ORDER BY table_name, auto_generated;
