-- =============================================
-- FIX KYC DOCUMENTS TABLE
-- Create or fix kyc_documents table with proper relationships
-- =============================================

-- Step 1: Create kyc_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.kyc_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('passport', 'drivers_license', 'national_id', 'utility_bill', 'bank_statement')),
    document_number TEXT,
    file_path TEXT,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON public.kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON public.kyc_documents(status);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_document_type ON public.kyc_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_created_at ON public.kyc_documents(created_at);

-- Step 3: Enable RLS
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for kyc_documents
CREATE POLICY "Users can view own KYC documents" ON public.kyc_documents
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own KYC documents" ON public.kyc_documents
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own KYC documents" ON public.kyc_documents
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all KYC documents" ON public.kyc_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all KYC documents" ON public.kyc_documents
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Step 5: Grant permissions
GRANT ALL ON public.kyc_documents TO authenticated;

-- Step 6: Create function to get KYC documents with user info
CREATE OR REPLACE FUNCTION get_kyc_documents_with_user_info()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    document_type TEXT,
    document_number TEXT,
    file_path TEXT,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    status TEXT,
    rejection_reason TEXT,
    verified_by UUID,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    user_email TEXT,
    user_full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can view all KYC documents';
    END IF;

    RETURN QUERY
    SELECT 
        kd.id,
        kd.user_id,
        kd.document_type,
        kd.document_number,
        kd.file_path,
        kd.file_name,
        kd.file_size,
        kd.mime_type,
        kd.status,
        kd.rejection_reason,
        kd.verified_by,
        kd.verified_at,
        kd.created_at,
        kd.updated_at,
        p.email as user_email,
        p.full_name as user_full_name
    FROM public.kyc_documents kd
    LEFT JOIN public.profiles p ON kd.user_id = p.user_id
    ORDER BY kd.created_at DESC;
END;
$$;

-- Step 7: Create function for users to get their own KYC documents
CREATE OR REPLACE FUNCTION get_my_kyc_documents()
RETURNS TABLE (
    id UUID,
    document_type TEXT,
    document_number TEXT,
    file_path TEXT,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    status TEXT,
    rejection_reason TEXT,
    verified_by UUID,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kd.id,
        kd.document_type,
        kd.document_number,
        kd.file_path,
        kd.file_name,
        kd.file_size,
        kd.mime_type,
        kd.status,
        kd.rejection_reason,
        kd.verified_by,
        kd.verified_at,
        kd.created_at,
        kd.updated_at
    FROM public.kyc_documents kd
    WHERE kd.user_id = auth.uid()
    ORDER BY kd.created_at DESC;
END;
$$;

-- Step 8: Grant execute permissions
GRANT EXECUTE ON FUNCTION get_kyc_documents_with_user_info() TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_kyc_documents() TO authenticated;

-- Step 9: Create some sample KYC documents for testing
DO $$
DECLARE
    user_record RECORD;
BEGIN
    RAISE NOTICE '=== CREATING SAMPLE KYC DOCUMENTS ===';
    
    FOR user_record IN 
        SELECT u.id, p.email, p.full_name
        FROM auth.users u
        LEFT JOIN public.profiles p ON u.id = p.user_id
        WHERE p.email IS NOT NULL
        LIMIT 3
    LOOP
        -- Create sample KYC document for each user
        INSERT INTO public.kyc_documents (
            user_id,
            document_type,
            document_number,
            file_path,
            file_name,
            file_size,
            mime_type,
            status
        ) VALUES (
            user_record.id,
            'passport',
            'PASS' || substr(user_record.id::text, 1, 8),
            '/kyc/passport/' || user_record.id || '.pdf',
            'passport_' || user_record.email || '.pdf',
            1024000,
            'application/pdf',
            'pending'
        );
        
        RAISE NOTICE '✅ Created KYC document for: %', user_record.email;
    END LOOP;
    
    RAISE NOTICE '✅ Sample KYC documents created!';
END $$;

-- Step 10: Verification
DO $$
BEGIN
    RAISE NOTICE '=== KYC DOCUMENTS FIX COMPLETE ===';
    RAISE NOTICE '✅ kyc_documents table created with proper relationships';
    RAISE NOTICE '✅ RLS policies configured';
    RAISE NOTICE '✅ Admin and user functions created';
    RAISE NOTICE '✅ Sample data created for testing';
    RAISE NOTICE '✅ Ready for frontend testing';
END $$;
