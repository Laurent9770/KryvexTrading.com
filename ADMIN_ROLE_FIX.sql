-- ADMIN ROLE FIX
-- Run this in your Supabase SQL editor to ensure admin role is properly set

-- 1. Check if your user exists in auth.users
SELECT 'Auth user exists' as check_type, 
       id, email, created_at 
FROM auth.users 
WHERE email = 'jeanlaurentkoterumutima@gmail.com';

-- 2. Check if your profile exists
SELECT 'Profile exists' as check_type, 
       user_id, full_name, email, created_at 
FROM public.profiles 
WHERE user_id = '26123553-2931-4ed5-950e-2919ae8470ee';

-- 3. Check current user roles
SELECT 'Current roles' as check_type, 
       user_id, role, created_at 
FROM public.user_roles 
WHERE user_id = '26123553-2931-4ed5-950e-2919ae8470ee';

-- 4. Remove any existing roles and add admin role
DELETE FROM public.user_roles 
WHERE user_id = '26123553-2931-4ed5-950e-2919ae8470ee';

INSERT INTO public.user_roles (user_id, role)
VALUES ('26123553-2931-4ed5-950e-2919ae8470ee', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 5. Update profile to ensure admin status
UPDATE public.profiles 
SET 
    full_name = COALESCE(full_name, 'Admin User'),
    is_verified = true,
    kyc_status = 'approved',
    account_status = 'active'
WHERE user_id = '26123553-2931-4ed5-950e-2919ae8470ee';

-- 6. Verify the fix
SELECT 'Verification' as check_type, 
       ur.user_id, 
       ur.role, 
       p.full_name, 
       p.is_verified,
       p.kyc_status
FROM public.user_roles ur
JOIN public.profiles p ON ur.user_id = p.user_id
WHERE ur.user_id = '26123553-2931-4ed5-950e-2919ae8470ee';

-- 7. Test the has_role function
SELECT 'has_role test' as check_type,
       public.has_role('26123553-2931-4ed5-950e-2919ae8470ee', 'admin') as is_admin;
