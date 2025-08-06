import { supabase } from '@/integrations/supabase/client'

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

export interface StorageBucket {
  id: string
  name: string
  public: boolean
  description: string
}

class SupabaseStorageService {
  // ==================== STORAGE BUCKETS ====================

  // Define storage buckets
  private buckets: Record<string, StorageBucket> = {
    'deposit-proofs': {
      id: 'deposit-proofs',
      name: 'deposit-proofs',
      public: false,
      description: 'Deposit proof images'
    },
    'kyc-documents': {
      id: 'kyc-documents',
      name: 'kyc-documents',
      public: false,
      description: 'KYC verification documents'
    },
    'profile-avatars': {
      id: 'profile-avatars',
      name: 'profile-avatars',
      public: true,
      description: 'User profile avatars'
    },
    'trade-screenshots': {
      id: 'trade-screenshots',
      name: 'trade-screenshots',
      public: false,
      description: 'Trade result screenshots'
    },
    'support-attachments': {
      id: 'support-attachments',
      name: 'support-attachments',
      public: false,
      description: 'Support ticket attachments'
    }
  }

  // ==================== UPLOAD FUNCTIONS ====================

  // Upload deposit proof
  async uploadDepositProof(
    userId: string,
    file: File,
    depositId: string
  ): Promise<UploadResult> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${depositId}-proof.${fileExt}`
      const bucket = this.buckets['deposit-proofs']

      const { data, error } = await supabase.storage
        .from(bucket.id)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload deposit proof error:', error)
        return { success: false, error: error.message }
      }

      const { data: urlData } = supabase.storage
        .from(bucket.id)
        .getPublicUrl(fileName)

      return {
        success: true,
        url: urlData.publicUrl,
        path: fileName
      }
    } catch (error) {
      console.error('Upload deposit proof error:', error)
      return { success: false, error: 'Upload failed' }
    }
  }

  // Upload KYC document
  async uploadKYCDocument(
    userId: string,
    file: File,
    documentType: 'id_card' | 'passport' | 'drivers_license' | 'selfie'
  ): Promise<UploadResult> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${documentType}-${Date.now()}.${fileExt}`
      const bucket = this.buckets['kyc-documents']

      const { data, error } = await supabase.storage
        .from(bucket.id)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload KYC document error:', error)
        return { success: false, error: error.message }
      }

      const { data: urlData } = supabase.storage
        .from(bucket.id)
        .getPublicUrl(fileName)

      return {
        success: true,
        url: urlData.publicUrl,
        path: fileName
      }
    } catch (error) {
      console.error('Upload KYC document error:', error)
      return { success: false, error: 'Upload failed' }
    }
  }

  // Upload profile avatar
  async uploadProfileAvatar(
    userId: string,
    file: File
  ): Promise<UploadResult> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/avatar.${fileExt}`
      const bucket = this.buckets['profile-avatars']

      const { data, error } = await supabase.storage
        .from(bucket.id)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        console.error('Upload profile avatar error:', error)
        return { success: false, error: error.message }
      }

      const { data: urlData } = supabase.storage
        .from(bucket.id)
        .getPublicUrl(fileName)

      return {
        success: true,
        url: urlData.publicUrl,
        path: fileName
      }
    } catch (error) {
      console.error('Upload profile avatar error:', error)
      return { success: false, error: 'Upload failed' }
    }
  }

  // Upload trade screenshot
  async uploadTradeScreenshot(
    userId: string,
    file: File,
    tradeId: string
  ): Promise<UploadResult> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${tradeId}-screenshot.${fileExt}`
      const bucket = this.buckets['trade-screenshots']

      const { data, error } = await supabase.storage
        .from(bucket.id)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload trade screenshot error:', error)
        return { success: false, error: error.message }
      }

      const { data: urlData } = supabase.storage
        .from(bucket.id)
        .getPublicUrl(fileName)

      return {
        success: true,
        url: urlData.publicUrl,
        path: fileName
      }
    } catch (error) {
      console.error('Upload trade screenshot error:', error)
      return { success: false, error: 'Upload failed' }
    }
  }

  // Upload support attachment
  async uploadSupportAttachment(
    userId: string,
    file: File,
    ticketId: string
  ): Promise<UploadResult> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${ticketId}-${Date.now()}.${fileExt}`
      const bucket = this.buckets['support-attachments']

      const { data, error } = await supabase.storage
        .from(bucket.id)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload support attachment error:', error)
        return { success: false, error: error.message }
      }

      const { data: urlData } = supabase.storage
        .from(bucket.id)
        .getPublicUrl(fileName)

      return {
        success: true,
        url: urlData.publicUrl,
        path: fileName
      }
    } catch (error) {
      console.error('Upload support attachment error:', error)
      return { success: false, error: 'Upload failed' }
    }
  }

  // ==================== DOWNLOAD FUNCTIONS ====================

  // Get file URL
  async getFileUrl(bucketId: string, path: string): Promise<string | null> {
    try {
      const { data } = supabase.storage
        .from(bucketId)
        .getPublicUrl(path)

      return data.publicUrl
    } catch (error) {
      console.error('Get file URL error:', error)
      return null
    }
  }

  // Download file
  async downloadFile(bucketId: string, path: string): Promise<Blob | null> {
    try {
      const { data, error } = await supabase.storage
        .from(bucketId)
        .download(path)

      if (error) {
        console.error('Download file error:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Download file error:', error)
      return null
    }
  }

  // ==================== DELETE FUNCTIONS ====================

  // Delete file
  async deleteFile(bucketId: string, path: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(bucketId)
        .remove([path])

      if (error) {
        console.error('Delete file error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Delete file error:', error)
      return { success: false, error: 'Delete failed' }
    }
  }

  // Delete user files
  async deleteUserFiles(userId: string, bucketId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: files, error: listError } = await supabase.storage
        .from(bucketId)
        .list(userId)

      if (listError) {
        console.error('List user files error:', listError)
        return { success: false, error: listError.message }
      }

      if (files && files.length > 0) {
        const paths = files.map(file => `${userId}/${file.name}`)
        const { error: deleteError } = await supabase.storage
          .from(bucketId)
          .remove(paths)

        if (deleteError) {
          console.error('Delete user files error:', deleteError)
          return { success: false, error: deleteError.message }
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Delete user files error:', error)
      return { success: false, error: 'Delete failed' }
    }
  }

  // ==================== LIST FUNCTIONS ====================

  // List user files
  async listUserFiles(userId: string, bucketId: string): Promise<{ files: any[]; error?: string }> {
    try {
      const { data: files, error } = await supabase.storage
        .from(bucketId)
        .list(userId)

      if (error) {
        console.error('List user files error:', error)
        return { files: [], error: error.message }
      }

      return { files: files || [] }
    } catch (error) {
      console.error('List user files error:', error)
      return { files: [], error: 'List failed' }
    }
  }

  // ==================== UTILITY FUNCTIONS ====================

  // Validate file type
  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type)
  }

  // Validate file size
  validateFileSize(file: File, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    return file.size <= maxSizeBytes
  }

  // Get file extension
  getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  // Generate unique filename
  generateUniqueFilename(originalName: string, userId: string): string {
    const ext = this.getFileExtension(originalName)
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    return `${userId}/${timestamp}-${random}.${ext}`
  }

  // ==================== BUCKET MANAGEMENT ====================

  // Get bucket info
  getBucketInfo(bucketId: string): StorageBucket | null {
    return this.buckets[bucketId] || null
  }

  // List all buckets
  getAllBuckets(): StorageBucket[] {
    return Object.values(this.buckets)
  }

  // Check if bucket is public
  isBucketPublic(bucketId: string): boolean {
    const bucket = this.buckets[bucketId]
    return bucket?.public || false
  }
}

// Create singleton instance
const supabaseStorageService = new SupabaseStorageService()
export default supabaseStorageService 