-- MANUAL PROFILE FIX
-- Run this in your Supabase SQL editor to create the missing profile for your user

-- First, let's check what columns exist in the profiles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check what columns exist in the user_roles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_roles' 
ORDER BY ordinal_position;

-- Check if the specific user exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE id = '26123553-2931-4ed5-950e-2919ae8470ee';

-- Check if profile already exists
SELECT * FROM public.profiles 
WHERE user_id = '26123553-2931-4ed5-950e-2919ae8470ee';

-- Create the missing profile (run this if the above query returns no results)
-- This will work regardless of whether KYC columns exist or not
INSERT INTO public.profiles (
    user_id,
    full_name,
    email,
    phone,
    country,
    account_status,
    created_at,
    updated_at
)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email),
    au.email,
    COALESCE(au.raw_user_meta_data->>'phone', ''),
    COALESCE(au.raw_user_meta_data->>'country', ''),
    'active',
    au.created_at,
    NOW()
FROM auth.users au
WHERE au.id = '26123553-2931-4ed5-950e-2919ae8470ee'
ON CONFLICT (user_id) DO NOTHING;

-- Create user role if it doesn't exist (using only existing columns)
INSERT INTO public.user_roles (user_id, role)
SELECT 
    au.id,
    'user'
FROM auth.users au
WHERE au.id = '26123553-2931-4ed5-950e-2919ae8470ee'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the profile was created
SELECT * FROM public.profiles 
WHERE user_id = '26123553-2931-4ed5-950e-2919ae8470ee';

-- Verify the role was created
SELECT * FROM public.user_roles 
WHERE user_id = '26123553-2931-4ed5-950e-2919ae8470ee';
