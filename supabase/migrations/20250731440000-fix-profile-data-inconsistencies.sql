-- =============================================
-- FIX PROFILE DATA INCONSISTENCIES
-- This migration checks and fixes any data issues in profiles table
-- =============================================

-- Check current state of profiles table
DO $$
DECLARE
    total_profiles INTEGER;
    profiles_with_email INTEGER;
    profiles_with_user_id INTEGER;
    profiles_with_full_name INTEGER;
    profiles_with_kyc_status INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_profiles FROM public.profiles;
    SELECT COUNT(*) INTO profiles_with_email FROM public.profiles WHERE email IS NOT NULL AND email != '';
    SELECT COUNT(*) INTO profiles_with_user_id FROM public.profiles WHERE user_id IS NOT NULL;
    SELECT COUNT(*) INTO profiles_with_full_name FROM public.profiles WHERE full_name IS NOT NULL AND full_name != '';
    SELECT COUNT(*) INTO profiles_with_kyc_status FROM public.profiles WHERE kyc_status IS NOT NULL;
    
    RAISE NOTICE '=== PROFILES DATA CHECK ===';
    RAISE NOTICE 'Total profiles: %', total_profiles;
    RAISE NOTICE 'Profiles with email: %', profiles_with_email;
    RAISE NOTICE 'Profiles with user_id: %', profiles_with_user_id;
    RAISE NOTICE 'Profiles with full_name: %', profiles_with_full_name;
    RAISE NOTICE 'Profiles with kyc_status: %', profiles_with_kyc_status;
END $$;

-- Show all profiles with their data
SELECT 
    user_id,
    email,
    full_name,
    kyc_status,
    is_verified,
    account_balance,
    auto_generated,
    created_at,
    updated_at
FROM public.profiles 
ORDER BY created_at DESC;

-- Fix any profiles with missing email by getting it from auth.users
UPDATE public.profiles 
SET email = (
    SELECT email 
    FROM auth.users 
    WHERE auth.users.id = profiles.user_id
)
WHERE (email IS NULL OR email = '') 
AND user_id IS NOT NULL;

-- Fix any profiles with missing full_name by using email as fallback
UPDATE public.profiles 
SET full_name = COALESCE(full_name, email, 'Unknown User')
WHERE (full_name IS NULL OR full_name = '');

-- Fix any profiles with missing kyc_status
UPDATE public.profiles 
SET kyc_status = COALESCE(kyc_status, 'pending')
WHERE kyc_status IS NULL;

-- Fix any profiles with missing is_verified
UPDATE public.profiles 
SET is_verified = COALESCE(is_verified, false)
WHERE is_verified IS NULL;

-- Fix any profiles with missing account_balance
UPDATE public.profiles 
SET account_balance = COALESCE(account_balance, 0)
WHERE account_balance IS NULL;

-- Final verification
DO $$
DECLARE
    final_total_profiles INTEGER;
    final_profiles_with_email INTEGER;
    final_profiles_with_user_id INTEGER;
    final_profiles_with_full_name INTEGER;
    final_profiles_with_kyc_status INTEGER;
BEGIN
    SELECT COUNT(*) INTO final_total_profiles FROM public.profiles;
    SELECT COUNT(*) INTO final_profiles_with_email FROM public.profiles WHERE email IS NOT NULL AND email != '';
    SELECT COUNT(*) INTO final_profiles_with_user_id FROM public.profiles WHERE user_id IS NOT NULL;
    SELECT COUNT(*) INTO final_profiles_with_full_name FROM public.profiles WHERE full_name IS NOT NULL AND full_name != '';
    SELECT COUNT(*) INTO final_profiles_with_kyc_status FROM public.profiles WHERE kyc_status IS NOT NULL;
    
    RAISE NOTICE '=== FINAL PROFILES VERIFICATION ===';
    RAISE NOTICE 'Total profiles: %', final_total_profiles;
    RAISE NOTICE 'Profiles with email: %', final_profiles_with_email;
    RAISE NOTICE 'Profiles with user_id: %', final_profiles_with_user_id;
    RAISE NOTICE 'Profiles with full_name: %', final_profiles_with_full_name;
    RAISE NOTICE 'Profiles with kyc_status: %', final_profiles_with_kyc_status;
    
    IF final_total_profiles = final_profiles_with_email 
       AND final_total_profiles = final_profiles_with_user_id 
       AND final_total_profiles = final_profiles_with_full_name 
       AND final_total_profiles = final_profiles_with_kyc_status THEN
        RAISE NOTICE '✅ All profiles have complete data!';
    ELSE
        RAISE NOTICE '❌ Some profiles still have missing data!';
    END IF;
END $$;

-- Show final profiles data
SELECT 
    user_id,
    email,
    full_name,
    kyc_status,
    is_verified,
    account_balance,
    auto_generated,
    created_at
FROM public.profiles 
ORDER BY created_at DESC;
