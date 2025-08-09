-- =====================================================
-- KYC Document Storage Policies for Kryvex Trading
-- =====================================================

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'kyc-documents',
    'kyc-documents',
    false, -- Private bucket for security
    10485760, -- 10MB file size limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
  ),
  (
    'profile-images',
    'profile-images', 
    true, -- Public bucket for profile pictures
    5242880, -- 5MB file size limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- KYC Documents Bucket Policies
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload KYC documents to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all KYC documents" ON storage.objects;

-- 1. Users can upload KYC documents to their own folder
CREATE POLICY "Users can upload KYC documents to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND auth.uid() IS NOT NULL
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp', 'pdf')
);

-- 2. Users can view their own KYC documents
CREATE POLICY "Users can view own KYC documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Users can update their own KYC documents
CREATE POLICY "Users can update own KYC documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'kyc-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Users can delete their own KYC documents
CREATE POLICY "Users can delete own KYC documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'kyc-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Admins can view all KYC documents for verification
CREATE POLICY "Admins can view all KYC documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents'
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =====================================================
-- Profile Images Bucket Policies  
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile images" ON storage.objects;

-- 1. Users can upload profile images to their own folder
CREATE POLICY "Users can upload profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images'
  AND auth.uid() IS NOT NULL
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp')
);

-- 2. Anyone can view profile images (public bucket)
CREATE POLICY "Anyone can view profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

-- 3. Users can update their own profile images
CREATE POLICY "Users can update own profile images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Users can delete their own profile images
CREATE POLICY "Users can delete own profile images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- Helper Functions for File Management
-- =====================================================

-- Function to get file URL for authenticated users
CREATE OR REPLACE FUNCTION get_kyc_document_url(file_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  file_url text;
BEGIN
  -- Only allow users to get URLs for their own files
  IF (storage.foldername(file_path))[1] != auth.uid()::text THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Generate signed URL for private bucket
  SELECT storage.sign(file_path, 3600) INTO file_url; -- 1 hour expiry
  
  RETURN file_url;
END;
$$;

-- Function to clean up old KYC documents when new ones are uploaded
CREATE OR REPLACE FUNCTION cleanup_old_kyc_documents()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete old documents of the same type for the same user
  DELETE FROM storage.objects
  WHERE bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = (storage.foldername(NEW.name))[1]
    AND storage.filename(name) LIKE '%' || storage.extension(NEW.name)
    AND name != NEW.name
    AND created_at < NEW.created_at;
  
  RETURN NEW;
END;
$$;

-- Trigger to cleanup old documents
DROP TRIGGER IF EXISTS cleanup_kyc_documents_trigger ON storage.objects;
CREATE TRIGGER cleanup_kyc_documents_trigger
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'kyc-documents')
  EXECUTE FUNCTION cleanup_old_kyc_documents();

-- =====================================================
-- Grant necessary permissions
-- =====================================================

-- Grant usage on storage schema
GRANT USAGE ON SCHEMA storage TO authenticated, anon;

-- Grant permissions on storage.objects
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;

-- Grant permissions on storage.buckets
GRANT SELECT ON storage.buckets TO authenticated, anon;
