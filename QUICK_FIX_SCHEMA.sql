-- QUICK FIX: Essential Tables for KYC and Profile System
-- Run this in Supabase SQL Editor to fix HTTP 406 errors

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create essential enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected', 'not_submitted', 'unverified');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table (CRITICAL - this is causing the 406 errors)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    date_of_birth DATE,
    country TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    
    -- KYC fields (essential for the KYC page)
    kyc_status kyc_status DEFAULT 'not_submitted',
    kyc_level INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    kyc_submitted_at TIMESTAMPTZ,
    kyc_approved_at TIMESTAMPTZ,
    kyc_documents JSONB DEFAULT '{}',
    
    -- User role and status
    role user_role DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    account_balance DECIMAL(20, 8) DEFAULT 0,
    
    -- Wallet balances (for wallet services)
    funding_wallet JSONB DEFAULT '{}',
    trading_wallet JSONB DEFAULT '{}',
    
    -- Trading preferences
    trade_outcome_mode TEXT DEFAULT 'default',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger for profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
    CREATE TRIGGER update_profiles_updated_at 
        BEFORE UPDATE ON profiles 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create RLS policies for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
DO $$ BEGIN
    CREATE POLICY "Users can view own profile" ON profiles
        FOR SELECT USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Policy: Users can update their own profile
DO $$ BEGIN
    CREATE POLICY "Users can update own profile" ON profiles
        FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Policy: Users can insert their own profile
DO $$ BEGIN
    CREATE POLICY "Users can insert own profile" ON profiles
        FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Policy: Admins can view all profiles (check role after table is created)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        CREATE POLICY "Admins can view all profiles" ON profiles
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE user_id = auth.uid() AND role = 'admin'
                )
            );
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Policy: Admins can update all profiles (check role after table is created)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        CREATE POLICY "Admins can update all profiles" ON profiles
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE user_id = auth.uid() AND role = 'admin'
                )
            );
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name, created_at)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New User'),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile
DO $$ BEGIN
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create kyc_submissions table (needed for KYC service)
CREATE TABLE IF NOT EXISTS kyc_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    status kyc_status DEFAULT 'pending',
    
    -- Level 1: Email verification
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMPTZ,
    
    -- Level 2: Identity verification
    full_name TEXT,
    date_of_birth DATE,
    country TEXT,
    id_type TEXT,
    id_number TEXT,
    
    -- Document URLs
    front_document_url TEXT,
    back_document_url TEXT,
    selfie_url TEXT,
    
    -- Verification details
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    admin_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for kyc_submissions
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;

-- KYC submission policies
DO $$ BEGIN
    CREATE POLICY "Users can view own KYC submissions" ON kyc_submissions
        FOR SELECT USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own KYC submissions" ON kyc_submissions
        FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own KYC submissions" ON kyc_submissions
        FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Admin policies for KYC (check role after table is created)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        CREATE POLICY "Admins can view all KYC submissions" ON kyc_submissions
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE user_id = auth.uid() AND role = 'admin'
                )
            );
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        CREATE POLICY "Admins can update all KYC submissions" ON kyc_submissions
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE user_id = auth.uid() AND role = 'admin'
                )
            );
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add updated_at trigger for kyc_submissions
DO $$ BEGIN
    CREATE TRIGGER update_kyc_submissions_updated_at 
        BEFORE UPDATE ON kyc_submissions 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Insert a default admin user profile (optional - for testing)
-- Replace 'your-user-id' with your actual auth user ID
-- You can find this in Supabase Dashboard > Authentication > Users

-- Success message
SELECT 'QUICK FIX SCHEMA APPLIED SUCCESSFULLY! The profiles table and KYC system are now ready.' as status;
