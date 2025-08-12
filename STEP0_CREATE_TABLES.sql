-- STEP 0: Create required tables if they don't exist
-- Run this FIRST before any other scripts

DO $$
BEGIN
    -- Create profiles table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        CREATE TABLE public.profiles (
            user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT,
            first_name TEXT,
            last_name TEXT,
            kyc_level1_status TEXT DEFAULT 'pending',
            kyc_level2_status TEXT DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created profiles table';
    ELSE
        RAISE NOTICE '✅ profiles table already exists';
    END IF;

    -- Create user_roles table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
        CREATE TABLE public.user_roles (
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            role TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            PRIMARY KEY (user_id, role)
        );
        RAISE NOTICE '✅ Created user_roles table';
    ELSE
        RAISE NOTICE '✅ user_roles table already exists';
    END IF;

    -- Create user_wallets table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_wallets') THEN
        CREATE TABLE public.user_wallets (
            user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            trading_account JSONB DEFAULT '{}',
            funding_account JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created user_wallets table';
    ELSE
        RAISE NOTICE '✅ user_wallets table already exists';
    END IF;

    -- Create admin_actions table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_actions') THEN
        CREATE TABLE public.admin_actions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            admin_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            action_type TEXT NOT NULL,
            action_details TEXT,
            target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created admin_actions table';
    ELSE
        RAISE NOTICE '✅ admin_actions table already exists';
    END IF;

    -- Create app_role enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('user', 'admin', 'moderator');
        RAISE NOTICE '✅ Created app_role enum';
    ELSE
        RAISE NOTICE '✅ app_role enum already exists';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '📋 ALL REQUIRED TABLES CREATED/VERIFIED';
    RAISE NOTICE '=====================================';
    RAISE NOTICE '✅ profiles table: Ready';
    RAISE NOTICE '✅ user_roles table: Ready';
    RAISE NOTICE '✅ user_wallets table: Ready';
    RAISE NOTICE '✅ admin_actions table: Ready';
    RAISE NOTICE '✅ app_role enum: Ready';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 You can now run STEP1_ADD_ADMIN_COLUMN.sql';

END $$;
