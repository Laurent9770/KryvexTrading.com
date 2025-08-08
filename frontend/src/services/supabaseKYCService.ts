import { supabase } from '@/integrations/supabase/client';

export interface KYCSubmission {
  id: string;
  userId: string;
  fullName: string;
  dateOfBirth: string;
  country: string;
  idType: 'passport' | 'drivers_license' | 'national_id';
  idNumber: string;
  frontUrl?: string;
  backUrl?: string;
  selfieUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface CreateKYCData {
  fullName: string;
  dateOfBirth: string;
  country: string;
  idType: 'passport' | 'drivers_license' | 'national_id';
  idNumber: string;
  frontFile?: File;
  backFile?: File;
  selfieFile?: File;
}

export interface UpdateKYCData {
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}

class SupabaseKYCService {
  constructor() {
    console.log('🆔 Initializing Supabase KYC Service...');
  }

  // =============================================
  // KYC SUBMISSIONS
  // =============================================

  async createKYCSubmission(kycData: CreateKYCData): Promise<{ success: boolean; data?: KYCSubmission; error?: string }> {
    try {
      console.log('🆔 Creating KYC submission for user');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if user already has a KYC submission
      const { data: existingSubmission, error: checkError } = await supabase
        .from('kyc_submissions')
        .select('id, status')
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking existing KYC submission:', checkError);
        return { success: false, error: checkError.message };
      }

      if (existingSubmission) {
        return { success: false, error: 'KYC submission already exists' };
      }

      // Upload files if provided
      let frontUrl: string | undefined;
      let backUrl: string | undefined;
      let selfieUrl: string | undefined;

      if (kycData.frontFile) {
        const { data: frontData, error: frontError } = await this.uploadKYCDocument(
          kycData.frontFile,
          `${user.id}/front_${Date.now()}.${kycData.frontFile.name.split('.').pop()}`
        );
        if (frontError) {
          return { success: false, error: `Front document upload failed: ${frontError}` };
        }
        frontUrl = frontData;
      }

      if (kycData.backFile) {
        const { data: backData, error: backError } = await this.uploadKYCDocument(
          kycData.backFile,
          `${user.id}/back_${Date.now()}.${kycData.backFile.name.split('.').pop()}`
        );
        if (backError) {
          return { success: false, error: `Back document upload failed: ${backError}` };
        }
        backUrl = backData;
      }

      if (kycData.selfieFile) {
        const { data: selfieData, error: selfieError } = await this.uploadKYCDocument(
          kycData.selfieFile,
          `${user.id}/selfie_${Date.now()}.${kycData.selfieFile.name.split('.').pop()}`
        );
        if (selfieError) {
          return { success: false, error: `Selfie upload failed: ${selfieError}` };
        }
        selfieUrl = selfieData;
      }

      // Create KYC submission
      const { data, error } = await supabase
        .from('kyc_submissions')
        .insert({
          user_id: user.id,
          full_name: kycData.fullName,
          date_of_birth: kycData.dateOfBirth,
          country: kycData.country,
          id_type: kycData.idType,
          id_number: kycData.idNumber,
          front_url: frontUrl,
          back_url: backUrl,
          selfie_url: selfieUrl,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating KYC submission:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ KYC submission created successfully');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Unexpected error creating KYC submission:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async getKYCSubmission(userId?: string): Promise<{ success: boolean; data?: KYCSubmission; error?: string }> {
    try {
      console.log('🆔 Fetching KYC submission for user:', userId);
      
      // Get current user if not provided
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return { success: false, error: 'User not authenticated' };
        }
        targetUserId = user.id;
      }

      const { data, error } = await supabase
        .from('kyc_submissions')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ No KYC submission found for user');
          return { success: true, data: undefined };
        }
        console.error('❌ Error fetching KYC submission:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ KYC submission fetched successfully');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Unexpected error fetching KYC submission:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async getAllKYCSubmissions(): Promise<{ success: boolean; data?: KYCSubmission[]; error?: string }> {
    try {
      console.log('🆔 Fetching all KYC submissions...');
      
      const { data, error } = await supabase
        .from('kyc_submissions')
        .select(`
          *,
          profiles!inner(email, full_name)
        `)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching KYC submissions:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ KYC submissions fetched successfully:', data?.length);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Unexpected error fetching KYC submissions:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async updateKYCSubmission(submissionId: string, updates: UpdateKYCData): Promise<{ success: boolean; data?: KYCSubmission; error?: string }> {
    try {
      console.log('🆔 Updating KYC submission:', submissionId, updates);
      
      // Get current user for admin check
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if user is admin
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin');

      if (rolesError) {
        console.error('❌ Error checking admin role:', rolesError);
        return { success: false, error: 'Failed to verify admin permissions' };
      }

      if (!roles || roles.length === 0) {
        return { success: false, error: 'Unauthorized - Admin access required' };
      }

      const updateData: any = {
        status: updates.status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id
      };

      if (updates.rejectionReason) {
        updateData.rejection_reason = updates.rejectionReason;
      }

      const { data, error } = await supabase
        .from('kyc_submissions')
        .update(updateData)
        .eq('id', submissionId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating KYC submission:', error);
        return { success: false, error: error.message };
      }

      // Update user profile KYC status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          kyc_status: updates.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.user_id);

      if (profileError) {
        console.error('❌ Error updating user profile KYC status:', profileError);
        // Don't fail the entire operation for this
      }

      console.log('✅ KYC submission updated successfully');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Unexpected error updating KYC submission:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // =============================================
  // FILE UPLOADS
  // =============================================

  private async uploadKYCDocument(file: File, path: string): Promise<{ data?: string; error?: string }> {
    try {
      console.log('📁 Uploading KYC document:', path);
      
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Error uploading KYC document:', error);
        return { error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(path);

      console.log('✅ KYC document uploaded successfully');
      return { data: urlData.publicUrl };
    } catch (error) {
      console.error('❌ Unexpected error uploading KYC document:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  async deleteKYCDocument(path: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🗑️ Deleting KYC document:', path);
      
      const { error } = await supabase.storage
        .from('kyc-documents')
        .remove([path]);

      if (error) {
        console.error('❌ Error deleting KYC document:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ KYC document deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected error deleting KYC document:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // =============================================
  // KYC STATUS
  // =============================================

  async getUserKYCStatus(userId?: string): Promise<{ success: boolean; data?: { status: string; isVerified: boolean }; error?: string }> {
    try {
      console.log('🆔 Fetching KYC status for user:', userId);
      
      // Get current user if not provided
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return { success: false, error: 'User not authenticated' };
        }
        targetUserId = user.id;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('kyc_status, is_verified')
        .eq('id', targetUserId)
        .single();

      if (error) {
        console.error('❌ Error fetching KYC status:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ KYC status fetched successfully');
      return { 
        success: true, 
        data: { 
          status: data.kyc_status || 'pending', 
          isVerified: data.is_verified || false 
        } 
      };
    } catch (error) {
      console.error('❌ Unexpected error fetching KYC status:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async updateUserKYCStatus(userId: string, status: 'pending' | 'approved' | 'rejected', isVerified: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🆔 Updating KYC status for user:', userId, status, isVerified);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          kyc_status: status,
          is_verified: isVerified,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Error updating KYC status:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ KYC status updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected error updating KYC status:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // =============================================
  // REAL-TIME SUBSCRIPTIONS
  // =============================================

  subscribeToKYCUpdates(userId: string, callback: (submission: KYCSubmission) => void): () => void {
    try {
      console.log('🆔 Subscribing to KYC updates for user:', userId);
      
      const subscription = supabase
        .channel('user_kyc_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'kyc_submissions',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('🆔 KYC update received:', payload);
            callback(payload.new as KYCSubmission);
          }
        )
        .subscribe();

      return () => {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.warn('⚠️ Error unsubscribing from KYC updates:', error);
        }
      };
    } catch (error) {
      console.error('❌ Error setting up KYC subscription:', error);
      return () => {};
    }
  }

  subscribeToAllKYCUpdates(callback: (submission: KYCSubmission) => void): () => void {
    try {
      console.log('🆔 Subscribing to all KYC updates...');
      
      const subscription = supabase
        .channel('all_kyc_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'kyc_submissions'
          },
          (payload) => {
            console.log('🆔 KYC update received:', payload);
            callback(payload.new as KYCSubmission);
          }
        )
        .subscribe();

      return () => {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.warn('⚠️ Error unsubscribing from KYC updates:', error);
        }
      };
    } catch (error) {
      console.error('❌ Error setting up KYC subscription:', error);
      return () => {};
    }
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  async getKYCStatistics(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('📊 Fetching KYC statistics...');
      
      const { data, error } = await supabase
        .from('kyc_submissions')
        .select('status');

      if (error) {
        console.error('❌ Error fetching KYC statistics:', error);
        return { success: false, error: error.message };
      }

      // Calculate statistics
      const total = data?.length || 0;
      const pending = data?.filter(sub => sub.status === 'pending').length || 0;
      const approved = data?.filter(sub => sub.status === 'approved').length || 0;
      const rejected = data?.filter(sub => sub.status === 'rejected').length || 0;

      const statistics = {
        total,
        pending,
        approved,
        rejected,
        approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0
      };

      console.log('✅ KYC statistics calculated successfully');
      return { success: true, data: statistics };
    } catch (error) {
      console.error('❌ Unexpected error calculating KYC statistics:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async validateKYCData(kycData: CreateKYCData): Promise<{ success: boolean; errors?: string[] }> {
    const errors: string[] = [];

    // Validate required fields
    if (!kycData.fullName || kycData.fullName.trim().length < 2) {
      errors.push('Full name must be at least 2 characters long');
    }

    if (!kycData.dateOfBirth) {
      errors.push('Date of birth is required');
    } else {
      const birthDate = new Date(kycData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18 || age > 100) {
        errors.push('Age must be between 18 and 100 years');
      }
    }

    if (!kycData.country || kycData.country.trim().length < 2) {
      errors.push('Country is required');
    }

    if (!kycData.idNumber || kycData.idNumber.trim().length < 3) {
      errors.push('ID number is required');
    }

    // Validate file types and sizes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (kycData.frontFile) {
      if (!allowedTypes.includes(kycData.frontFile.type)) {
        errors.push('Front document must be JPEG, PNG, or PDF');
      }
      if (kycData.frontFile.size > maxSize) {
        errors.push('Front document must be less than 5MB');
      }
    }

    if (kycData.backFile) {
      if (!allowedTypes.includes(kycData.backFile.type)) {
        errors.push('Back document must be JPEG, PNG, or PDF');
      }
      if (kycData.backFile.size > maxSize) {
        errors.push('Back document must be less than 5MB');
      }
    }

    if (kycData.selfieFile) {
      if (!kycData.selfieFile.type.startsWith('image/')) {
        errors.push('Selfie must be an image file');
      }
      if (kycData.selfieFile.size > maxSize) {
        errors.push('Selfie must be less than 5MB');
      }
    }

    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}

// Create singleton instance
const supabaseKYCService = new SupabaseKYCService();

export default supabaseKYCService; 