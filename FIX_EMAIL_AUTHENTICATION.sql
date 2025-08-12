-- FIX EMAIL AUTHENTICATION CONFIGURATION
-- Run this in your Supabase SQL Editor to enable email authentication

-- 1. Check current authentication configuration
SELECT 'Current auth configuration' as info,
       (SELECT COUNT(*) FROM auth.users WHERE email = 'admin@kryvex.com') as admin_users,
       (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) as confirmed_users,
       (SELECT COUNT(*) FROM auth.users) as total_users;

-- 2. Enable email confirmation for existing admin user
UPDATE auth.users
SET email_confirmed_at = now(),
    updated_at = now()
WHERE email = 'admin@kryvex.com';

-- 3. Verify admin user is properly configured
SELECT 'Admin user verification' as info,
       id,
       email,
       email_confirmed_at,
       created_at,
       updated_at
FROM auth.users
WHERE email = 'admin@kryvex.com';

-- 4. Test password verification again
SELECT 'Password verification test' as test_type,
       CASE 
           WHEN crypt('Kryvex.@123', (SELECT encrypted_password FROM auth.users WHERE email = 'admin@kryvex.com')) = (SELECT encrypted_password FROM auth.users WHERE email = 'admin@kryvex.com')
           THEN 'Password is correct'
           ELSE 'Password is incorrect'
       END as password_status;

-- 5. Ensure admin role is assigned
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@kryvex.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 6. Verify admin role
SELECT 'Admin role verification' as info,
       ur.user_id,
       ur.role,
       u.email
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE u.email = 'admin@kryvex.com';

-- 7. Show final status
SELECT 'Email authentication fix complete' as status,
       'Admin user is now properly configured for email login' as message,
       'admin@kryvex.com' as email,
       'Kryvex.@123' as password;
