-- =====================================================
-- SEED ADMIN USER SCRIPT
-- =====================================================
-- Replace <ADMIN-UUID> with the actual UUID of the admin user
-- =====================================================

-- First, get the UUID of the user you want to make admin
-- You can find this in the Supabase dashboard under Authentication > Users
-- Or run: SELECT id, email FROM auth.users WHERE email = 'your-admin-email@example.com';

-- Example: Insert admin user (replace with actual UUID and email)
INSERT INTO public.admin_users(user_id, email) 
VALUES (
  '00000000-0000-0000-0000-000000000000', -- Replace with actual UUID
  'kryvextrading@gmail.com' -- Replace with actual admin email
) 
ON CONFLICT (user_id) DO NOTHING;

-- Verify the admin was created
SELECT 
  au.user_id,
  au.email,
  au.created_at,
  u.email as auth_email,
  u.created_at as user_created_at
FROM public.admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE au.email = 'kryvextrading@gmail.com';

-- Test the is_admin function
SELECT 
  public.is_admin('00000000-0000-0000-0000-000000000000') as is_admin_result;

-- Test the user_roles view
SELECT * FROM public.user_roles WHERE user_id = '00000000-0000-0000-0000-000000000000';
