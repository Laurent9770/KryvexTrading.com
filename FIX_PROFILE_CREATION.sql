-- FIX PROFILE CREATION ISSUE
-- Run this in your Supabase SQL Editor to fix missing user profiles

-- 1. Check current state
SELECT 'Current state check' as info,
       (SELECT COUNT(*) FROM auth.users) as total_users,
       (SELECT COUNT(*) FROM public.profiles) as total_profiles,
       (SELECT COUNT(*) FROM auth.users WHERE email = 'admin@kryvex.com') as admin_users,
       (SELECT COUNT(*) FROM public.profiles WHERE email = 'admin@kryvex.com') as admin_profiles;

-- 2. Create missing profiles for all users without profiles
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT u.id, u.email, u.raw_user_meta_data
        FROM auth.users u
        LEFT JOIN public.profiles p ON u.id = p.user_id
        WHERE p.user_id IS NULL
    LOOP
        -- Extract full name from user metadata
        DECLARE
            full_name TEXT := 'User';
        BEGIN
            IF user_record.raw_user_meta_data IS NOT NULL AND user_record.raw_user_meta_data ? 'full_name' THEN
                full_name := user_record.raw_user_meta_data->>'full_name';
            END IF;
            
            -- Create profile for this user
            INSERT INTO public.profiles (
                user_id,
                email,
                full_name,
                phone,
                country,
                account_balance,
                is_verified,
                kyc_status,
                account_status,
                funding_wallet,
                trading_wallet,
                created_at,
                updated_at
            ) VALUES (
                user_record.id,
                user_record.email,
                COALESCE(full_name, 'User'),
                '+1234567890',
                'United States',
                1000.00,
                true,
                'approved',
                'active',
                '{"USDT": {"balance": "1000.00", "usdValue": "$1000.00", "available": "1000.00"}}'::jsonb,
                '{"USDT": {"balance": "1000.00000000", "usdValue": "$1000.00", "available": "1000.00000000"}, "BTC": {"balance": "0.00000000", "usdValue": "$0.00", "available": "0.00000000"}, "ETH": {"balance": "0.00000000", "usdValue": "$0.00", "available": "0.00000000"}}'::jsonb,
                now(),
                now()
            );
            
            RAISE NOTICE 'Created profile for user: % (%)', user_record.email, user_record.id;
        END;
    END LOOP;
END $$;

-- 3. Create a trigger to automatically create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Extract full name from user metadata
    DECLARE
        full_name TEXT := 'User';
    BEGIN
        IF NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data ? 'full_name' THEN
            full_name := NEW.raw_user_meta_data->>'full_name';
        END IF;
        
        -- Create profile for new user
        INSERT INTO public.profiles (
            user_id,
            email,
            full_name,
            phone,
            country,
            account_balance,
            is_verified,
            kyc_status,
            account_status,
            funding_wallet,
            trading_wallet,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            NEW.email,
            COALESCE(full_name, 'User'),
            '+1234567890',
            'United States',
            1000.00,
            true,
            'approved',
            'active',
            '{"USDT": {"balance": "1000.00", "usdValue": "$1000.00", "available": "1000.00"}}'::jsonb,
            '{"USDT": {"balance": "1000.00000000", "usdValue": "$1000.00", "available": "1000.00000000"}, "BTC": {"balance": "0.00000000", "usdValue": "$0.00", "available": "0.00000000"}, "ETH": {"balance": "0.00000000", "usdValue": "$0.00", "available": "0.00000000"}}'::jsonb,
            now(),
            now()
        );
        
        RAISE NOTICE 'Auto-created profile for new user: % (%)', NEW.email, NEW.id;
    END;
    
    RETURN NEW;
END;
$$;

-- 4. Create the trigger (if it doesn't exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 5. Verify all users now have profiles
SELECT 'Profile verification' as info,
       u.id,
       u.email,
       u.created_at,
       p.full_name,
       p.kyc_status,
       p.account_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
ORDER BY u.created_at;

-- 6. Check for any remaining users without profiles
SELECT 'Users without profiles' as info,
       COUNT(*) as count
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL;

-- 7. Final verification
SELECT 'Profile creation fix complete' as status,
       'All users should now have profiles' as message,
       'Auto-profile creation enabled for new users' as note;
