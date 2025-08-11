-- SUPABASE CONNECTION TEST
-- Run this in your Supabase SQL Editor to verify basic functionality

-- 1. Test basic database connection
SELECT 'Database connection test' as test_type,
       current_database() as database_name,
       current_user as current_user,
       version() as postgres_version;

-- 2. Test auth schema access
SELECT 'Auth schema test' as test_type,
       (SELECT COUNT(*) FROM auth.users) as total_users,
       (SELECT COUNT(*) FROM auth.users WHERE email = 'admin@kryvex.com') as admin_users;

-- 3. Test public schema access
SELECT 'Public schema test' as test_type,
       (SELECT COUNT(*) FROM public.profiles) as total_profiles,
       (SELECT COUNT(*) FROM public.user_roles) as total_roles;

-- 4. Test admin user specifically
SELECT 'Admin user test' as test_type,
       u.id,
       u.email,
       u.email_confirmed_at,
       u.created_at,
       p.full_name,
       p.kyc_status,
       ur.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'admin@kryvex.com';

-- 5. Test has_role function
SELECT 'has_role function test' as test_type,
       public.has_role(
           (SELECT id FROM auth.users WHERE email = 'admin@kryvex.com'),
           'admin'
       ) as is_admin;

-- 6. Test password verification
SELECT 'Password verification test' as test_type,
       CASE 
           WHEN crypt('Kryvex.@123', (SELECT encrypted_password FROM auth.users WHERE email = 'admin@kryvex.com')) = (SELECT encrypted_password FROM auth.users WHERE email = 'admin@kryvex.com')
           THEN 'Password is correct'
           ELSE 'Password is incorrect'
       END as password_status;

-- 7. Show current environment info
SELECT 'Environment info' as info,
       'Supabase project is accessible' as status,
       current_timestamp as test_time;
