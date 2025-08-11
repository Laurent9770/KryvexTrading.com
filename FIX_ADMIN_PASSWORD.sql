-- FIX ADMIN USER PASSWORD
-- Run this in your Supabase SQL Editor to fix the admin password

-- 1. Check current admin user status
SELECT 'Current admin user status' as info,
       id,
       email,
       email_confirmed_at,
       created_at
FROM auth.users
WHERE email = 'admin@kryvex.com';

-- 2. Update admin user password to the correct one
UPDATE auth.users
SET encrypted_password = crypt('Kryvex.@123', gen_salt('bf')),
    email_confirmed_at = now(),
    updated_at = now()
WHERE email = 'admin@kryvex.com';

-- 3. Verify the password was updated
SELECT 'Password update verification' as info,
       id,
       email,
       email_confirmed_at,
       updated_at
FROM auth.users
WHERE email = 'admin@kryvex.com';

-- 4. Test the password hash
SELECT 'Password hash test' as info,
       crypt('Kryvex.@123', gen_salt('bf')) as new_hash,
       (SELECT encrypted_password FROM auth.users WHERE email = 'admin@kryvex.com') as stored_hash,
       crypt('Kryvex.@123', (SELECT encrypted_password FROM auth.users WHERE email = 'admin@kryvex.com')) as verification;

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

-- 7. Final verification
SELECT 'Final admin user verification' as summary,
       (SELECT COUNT(*) FROM auth.users WHERE email = 'admin@kryvex.com') as admin_users_count,
       (SELECT COUNT(*) FROM public.profiles WHERE email = 'admin@kryvex.com') as admin_profiles_count,
       (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin') as admin_roles_count;

-- 8. Show login credentials
SELECT 'Admin Login Credentials' as info,
       'admin@kryvex.com' as email,
       'Kryvex.@123' as password,
       'Password has been updated and verified' as status;
