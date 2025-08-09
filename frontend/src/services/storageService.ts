import { supabase } from '@/integrations/supabase/client';

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class StorageService {
  // Upload KYC document
  async uploadKYCDocument(
    file: File, 
    userId: string, 
    documentType: 'passport-front' | 'passport-back' | 'drivers-license-front' | 'drivers-license-back' | 'national-id-front' | 'national-id-back' | 'selfie',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      console.log('📄 Uploading KYC document:', { documentType, userId, fileName: file.name });

      // Validate file
      const validation = this.validateKYCFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate file path: userId/documentType.extension
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${documentType}.${fileExtension}`;
      const filePath = `${userId}/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Replace existing file
        });

      if (error) {
        console.error('❌ KYC upload error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ KYC document uploaded successfully:', data.path);

      // Get signed URL for immediate access
      const { data: urlData } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(data.path, 3600); // 1 hour expiry

      return {
        success: true,
        path: data.path,
        url: urlData?.signedUrl
      };

    } catch (error: any) {
      console.error('❌ KYC upload failed:', error);
      return { success: false, error: error.message || 'Upload failed' };
    }
  }

  // Upload profile image
  async uploadProfileImage(file: File, userId: string): Promise<UploadResult> {
    try {
      console.log('🖼️ Uploading profile image:', { userId, fileName: file.name });

      // Validate file
      const validation = this.validateProfileImage(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate file path: userId/profile.extension
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const fileName = `profile.${fileExtension}`;
      const filePath = `${userId}/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Replace existing file
        });

      if (error) {
        console.error('❌ Profile image upload error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Profile image uploaded successfully:', data.path);

      // Get public URL (since profile-images is a public bucket)
      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(data.path);

      return {
        success: true,
        path: data.path,
        url: urlData.publicUrl
      };

    } catch (error: any) {
      console.error('❌ Profile image upload failed:', error);
      return { success: false, error: error.message || 'Upload failed' };
    }
  }

  // Get signed URL for KYC document
  async getKYCDocumentUrl(filePath: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        console.error('❌ Error getting KYC document URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('❌ Error getting KYC document URL:', error);
      return null;
    }
  }

  // Get public URL for profile image
  async getProfileImageUrl(filePath: string): Promise<string | null> {
    try {
      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('❌ Error getting profile image URL:', error);
      return null;
    }
  }

  // Delete KYC document
  async deleteKYCDocument(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from('kyc-documents')
        .remove([filePath]);

      if (error) {
        console.error('❌ Error deleting KYC document:', error);
        return false;
      }

      console.log('✅ KYC document deleted successfully:', filePath);
      return true;
    } catch (error) {
      console.error('❌ Error deleting KYC document:', error);
      return false;
    }
  }

  // Delete profile image
  async deleteProfileImage(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from('profile-images')
        .remove([filePath]);

      if (error) {
        console.error('❌ Error deleting profile image:', error);
        return false;
      }

      console.log('✅ Profile image deleted successfully:', filePath);
      return true;
    } catch (error) {
      console.error('❌ Error deleting profile image:', error);
      return false;
    }
  }

  // Validate KYC file
  private validateKYCFile(file: File): { valid: boolean; error?: string } {
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File must be a JPG, PNG, WebP, or PDF' };
    }

    return { valid: true };
  }

  // Validate profile image
  private validateProfileImage(file: File): { valid: boolean; error?: string } {
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File must be a JPG, PNG, or WebP image' };
    }

    return { valid: true };
  }

  // Get file size in human readable format
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check if file is an image
  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  // Check if file is a PDF
  isPdfFile(file: File): boolean {
    return file.type === 'application/pdf';
  }
}

export default new StorageService();
