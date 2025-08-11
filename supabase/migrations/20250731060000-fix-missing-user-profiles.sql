-- Fix Missing User Profiles Migration
-- This migration creates profiles for users that exist in auth.users but not in public.profiles

-- First, let's ensure the handle_new_user trigger is properly set up
DO $$ 
BEGIN
    -- Drop and recreate the trigger to ensure it's working
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    
    -- Recreate the handle_new_user function
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
        -- Insert into profiles table
        INSERT INTO public.profiles (
            user_id,
            full_name,
            email,
            phone,
            country,
            kyc_level1_status,
            kyc_level2_status,
            account_status,
            funding_wallet,
            trading_wallet,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'phone', ''),
            COALESCE(NEW.raw_user_meta_data->>'country', ''),
            'unverified',
            'unverified',
            'active',
            0,
            0,
            NOW(),
            NOW()
        );
        
        -- Insert into user_roles table (default to 'user' role)
        INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
        VALUES (NEW.id, 'user', NOW(), NOW());
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- Create the trigger
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
        
    RAISE NOTICE 'handle_new_user trigger recreated successfully';
END $$;

-- Now, let's create profiles for any users that exist in auth.users but not in public.profiles
INSERT INTO public.profiles (
    user_id,
    full_name,
    email,
    phone,
    country,
    kyc_level1_status,
    kyc_level2_status,
    account_status,
    funding_wallet,
    trading_wallet,
    created_at,
    updated_at
)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email),
    au.email,
    COALESCE(au.raw_user_meta_data->>'phone', ''),
    COALESCE(au.raw_user_meta_data->>'country', ''),
    'unverified',
    'unverified',
    'active',
    0,
    0,
    au.created_at,
    NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Create user_roles for any users that don't have them
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
SELECT 
    au.id,
    'user',
    au.created_at,
    NOW()
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Log the results
DO $$
DECLARE
    profile_count INTEGER;
    role_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM public.profiles;
    SELECT COUNT(*) INTO role_count FROM public.user_roles;
    
    RAISE NOTICE 'Migration completed: % profiles, % user roles', profile_count, role_count;
END $$;
