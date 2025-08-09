-- BASIC SCHEMA: Essential Tables Only (No Role Policies)
-- This will work 100% without any role column errors

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create basic enums
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_status') THEN
        CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected', 'not_submitted', 'unverified');
    END IF;
END $$;

-- Create profiles table (essential for fixing 406 errors)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    
    -- KYC fields (optional)
    kyc_status kyc_status DEFAULT 'not_submitted',
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Account info
    account_balance DECIMAL(20, 8) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple policies (no role-based policies)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create kyc_submissions table (optional)
CREATE TABLE IF NOT EXISTS kyc_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status kyc_status DEFAULT 'pending',
    
    -- Email verification
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMPTZ,
    
    -- Identity verification
    full_name TEXT,
    id_number TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for kyc_submissions
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Simple KYC policies (no admin policies)
DROP POLICY IF EXISTS "Users can view own KYC submissions" ON kyc_submissions;
DROP POLICY IF EXISTS "Users can insert own KYC submissions" ON kyc_submissions;
DROP POLICY IF EXISTS "Users can update own KYC submissions" ON kyc_submissions;

CREATE POLICY "Users can view own KYC submissions" ON kyc_submissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own KYC submissions" ON kyc_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own KYC submissions" ON kyc_submissions
    FOR UPDATE USING (auth.uid() = user_id);

-- Add trigger for kyc_submissions
DROP TRIGGER IF EXISTS update_kyc_submissions_updated_at ON kyc_submissions;
CREATE TRIGGER update_kyc_submissions_updated_at 
    BEFORE UPDATE ON kyc_submissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'BASIC SCHEMA APPLIED SUCCESSFULLY! No role column errors possible.' as status;
