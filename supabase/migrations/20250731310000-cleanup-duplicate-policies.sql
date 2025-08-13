-- =============================================
-- CLEANUP DUPLICATE RLS POLICIES
-- This migration removes duplicate policies created during trading setup
-- =============================================

-- Drop duplicate policies on trades table
DROP POLICY IF EXISTS "Admins can update trades" ON public.trades;
DROP POLICY IF EXISTS "Allow authenticated users to view trades" ON public.trades;
DROP POLICY IF EXISTS "Allow trade read access" ON public.trades;
DROP POLICY IF EXISTS "Allow users to insert own trades" ON public.trades;
DROP POLICY IF EXISTS "Allow users to update own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can create trades" ON public.trades;

-- Keep only the essential policies:
-- - "Users can view own trades" (SELECT)
-- - "Users can insert own trades" (INSERT) 
-- - "Users can update own trades" (UPDATE)
-- - "Admins can view all trades" (SELECT)
-- - "Admins can manage all trades" (ALL)

RAISE NOTICE '✅ Cleaned up duplicate RLS policies on trades table';

-- Verify the cleanup
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('trades', 'trading_pairs')
AND schemaname = 'public'
ORDER BY tablename, policyname;
