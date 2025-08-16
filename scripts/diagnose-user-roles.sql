-- =====================================================
-- DIAGNOSE USER_ROLES ISSUE
-- =====================================================
-- Run this to see what user_roles currently is
-- =====================================================

-- Check if user_roles exists and what type it is
SELECT 
  schemaname,
  tablename,
  tabletype
FROM pg_tables 
WHERE tablename = 'user_roles' AND schemaname = 'public';

-- Check if it's a view
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views 
WHERE viewname = 'user_roles' AND schemaname = 'public';

-- Check if it's a function
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'user_roles' AND n.nspname = 'public';

-- Check all objects with user_roles name
SELECT 
  n.nspname as schema_name,
  c.relname as object_name,
  c.relkind as object_type,
  CASE c.relkind
    WHEN 'r' THEN 'table'
    WHEN 'v' THEN 'view'
    WHEN 'f' THEN 'foreign table'
    WHEN 'S' THEN 'sequence'
    WHEN 'c' THEN 'composite type'
    WHEN 't' THEN 'TOAST table'
    WHEN 'p' THEN 'partitioned table'
    ELSE 'other'
  END as object_type_name
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'user_roles' AND n.nspname = 'public';

-- Check for any functions with user_roles in the name
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%user_roles%' AND n.nspname = 'public';
