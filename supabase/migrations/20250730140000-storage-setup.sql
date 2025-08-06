-- ==================== STORAGE BUCKETS SETUP ====================

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for profile avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-avatars', 'profile-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for trade screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('trade-screenshots', 'trade-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for support attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('support-attachments', 'support-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- ==================== KYC DOCUMENTS POLICIES ====================

-- Users can upload their own KYC documents
CREATE POLICY "Users can upload their own KYC documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can view their own KYC documents
CREATE POLICY "Users can view their own KYC documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can view all KYC documents
CREATE POLICY "Admins can view all KYC documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'kyc-documents' AND has_role(auth.uid(), 'admin'::app_role));

-- Users can update their own KYC documents
CREATE POLICY "Users can update their own KYC documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own KYC documents
CREATE POLICY "Users can delete their own KYC documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ==================== PROFILE AVATARS POLICIES ====================

-- Users can upload their own profile avatars
CREATE POLICY "Users can upload their own profile avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profile-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Anyone can view profile avatars (public bucket)
CREATE POLICY "Anyone can view profile avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-avatars');

-- Users can update their own profile avatars
CREATE POLICY "Users can update their own profile avatars" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'profile-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own profile avatars
CREATE POLICY "Users can delete their own profile avatars" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'profile-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ==================== TRADE SCREENSHOTS POLICIES ====================

-- Users can upload their own trade screenshots
CREATE POLICY "Users can upload their own trade screenshots" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'trade-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can view their own trade screenshots
CREATE POLICY "Users can view their own trade screenshots" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'trade-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can view all trade screenshots
CREATE POLICY "Admins can view all trade screenshots" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'trade-screenshots' AND has_role(auth.uid(), 'admin'::app_role));

-- Users can update their own trade screenshots
CREATE POLICY "Users can update their own trade screenshots" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'trade-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own trade screenshots
CREATE POLICY "Users can delete their own trade screenshots" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'trade-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ==================== SUPPORT ATTACHMENTS POLICIES ====================

-- Users can upload their own support attachments
CREATE POLICY "Users can upload their own support attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'support-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can view their own support attachments
CREATE POLICY "Users can view their own support attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'support-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can view all support attachments
CREATE POLICY "Admins can view all support attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'support-attachments' AND has_role(auth.uid(), 'admin'::app_role));

-- Users can update their own support attachments
CREATE POLICY "Users can update their own support attachments" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'support-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own support attachments
CREATE POLICY "Users can delete their own support attachments" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'support-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ==================== STORAGE FUNCTIONS ====================

-- Function to get user storage usage
CREATE OR REPLACE FUNCTION get_user_storage_usage(user_id UUID)
RETURNS TABLE (
  bucket_id TEXT,
  file_count BIGINT,
  total_size BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.bucket_id,
    COUNT(*) as file_count,
    COALESCE(SUM(o.metadata->>'size')::BIGINT, 0) as total_size
  FROM storage.objects o
  WHERE o.name LIKE user_id::text || '/%'
  GROUP BY o.bucket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up user files when account is deleted
CREATE OR REPLACE FUNCTION cleanup_user_files(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Delete all files for the user from all buckets
  DELETE FROM storage.objects 
  WHERE name LIKE user_id::text || '/%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== STORAGE TRIGGERS ====================

-- Trigger to log file uploads
CREATE OR REPLACE FUNCTION log_file_upload()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_actions (
    action_type,
    details,
    created_at
  ) VALUES (
    'FILE_UPLOAD',
    jsonb_build_object(
      'bucket_id', NEW.bucket_id,
      'file_name', NEW.name,
      'file_size', NEW.metadata->>'size',
      'user_id', (storage.foldername(NEW.name))[1]
    ),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for file upload logging
CREATE TRIGGER log_file_uploads
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION log_file_upload();

-- ==================== STORAGE VIEWS ====================

-- View for admin to see all storage usage
CREATE OR REPLACE VIEW storage_usage_summary AS
SELECT 
  bucket_id,
  COUNT(*) as total_files,
  COALESCE(SUM(metadata->>'size')::BIGINT, 0) as total_size_bytes,
  COALESCE(SUM(metadata->>'size')::BIGINT / 1024 / 1024, 0) as total_size_mb
FROM storage.objects
GROUP BY bucket_id;

-- View for user storage usage
CREATE OR REPLACE VIEW user_storage_usage AS
SELECT 
  (storage.foldername(name))[1] as user_id,
  bucket_id,
  COUNT(*) as file_count,
  COALESCE(SUM(metadata->>'size')::BIGINT, 0) as total_size_bytes,
  COALESCE(SUM(metadata->>'size')::BIGINT / 1024 / 1024, 0) as total_size_mb
FROM storage.objects
GROUP BY (storage.foldername(name))[1], bucket_id; 