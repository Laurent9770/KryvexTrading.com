-- Clean up duplicate roles for admin user
DELETE FROM public.user_roles 
WHERE user_id = '50bd3a5c-1549-4ed1-8bd0-259e6b40eb02' AND role = 'user';

-- Update admin profile
UPDATE public.profiles 
SET 
    full_name = 'System Administrator',
    is_verified = true,
    kyc_status = 'approved'
WHERE user_id = '50bd3a5c-1549-4ed1-8bd0-259e6b40eb02';