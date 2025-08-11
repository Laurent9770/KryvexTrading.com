-- =============================================
-- CREATE KRYVEX ADMIN ACCOUNT
-- =============================================

-- Create admin user account
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Check if admin account already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@kryvex.com') THEN
    RAISE NOTICE 'Admin account already exists';
    RETURN;
  END IF;

  -- Insert admin user into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@kryvex.com',
    crypt('Kryvex.@123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Kryvex Admin"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO admin_user_id;

  -- Create admin profile
  INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    account_status,
    username,
    funding_wallet,
    trading_wallet,
    kyc_level1_status,
    kyc_level2_status
  ) VALUES (
    admin_user_id,
    'admin@kryvex.com',
    'Kryvex Admin',
    'active',
    'admin',
    '{"USDT": {"balance": "1000000.00", "usdValue": "$1000000.00", "available": "1000000.00"}}',
    '{"USDT": {"balance": "1000000.00", "usdValue": "$1000000.00", "available": "1000000.00"}, "BTC": {"balance": "100.00000000", "usdValue": "$6754321.00", "available": "100.00000000"}, "ETH": {"balance": "1000.00000000", "usdValue": "$2580750.00", "available": "1000.00000000"}}',
    'verified',
    'approved'
  );

  -- Assign admin role
  INSERT INTO public.user_roles (
    user_id,
    role
  ) VALUES (
    admin_user_id,
    'admin'
  );

  RAISE NOTICE 'Admin account created successfully with ID: %', admin_user_id;
END $$;

-- =============================================
-- ADMIN ACCOUNT DETAILS
-- =============================================
-- Email: admin@kryvex.com
-- Password: Kryvex.@123
-- Role: admin
-- Status: active
-- KYC: verified & approved
-- Funding Wallet: $1,000,000 USDT
-- Trading Wallet: $1,000,000 USDT + 100 BTC + 1000 ETH
-- =============================================
