import { supabase } from '@/integrations/supabase/client';

export interface KYCStatus {
  level: number;
  status: 'unverified' | 'pending' | 'verified' | 'rejected';
  emailVerified: boolean;
  identityVerified: boolean;
  addressVerified: boolean;
  documentsSubmitted: boolean;
  lastUpdated: string;
}

export interface KYCLevel1Data {
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  phone: string;
}

export interface KYCLevel2Data {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  documentType: 'passport' | 'national_id' | 'drivers_license';
  documentNumber: string;
  documentFront: string;
  documentBack: string;
  selfie: string;
}

export interface KYCSubmission {
  id: string;
  userId: string;
  level: number;
  status: 'pending' | 'approved' | 'rejected';
  data: any;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  remarks?: string;
}

class SupabaseKYCService {
  private userId: string | null = null;

  setUserId(userId: string) {
    this.userId = userId;
  }

  // Get KYC status for a user
  async getKYCStatus(userEmail: string): Promise<KYCStatus> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('kyc_level, kyc_status, email_verified, identity_verified, address_verified, documents_submitted, updated_at')
        .eq('email', userEmail)
        .single();

      if (error) {
        console.error('Error fetching KYC status:', error);
        return {
          level: 0,
          status: 'unverified',
          emailVerified: false,
          identityVerified: false,
          addressVerified: false,
          documentsSubmitted: false,
          lastUpdated: new Date().toISOString()
        };
      }

      return {
        level: profile.kyc_level || 0,
        status: profile.kyc_status || 'unverified',
        emailVerified: profile.email_verified || false,
        identityVerified: profile.identity_verified || false,
        addressVerified: profile.address_verified || false,
        documentsSubmitted: profile.documents_submitted || false,
        lastUpdated: profile.updated_at
      };
    } catch (error) {
      console.error('Error getting KYC status:', error);
      return {
        level: 0,
        status: 'unverified',
        emailVerified: false,
        identityVerified: false,
        addressVerified: false,
        documentsSubmitted: false,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // Send verification email
  async sendVerificationEmail(email: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        console.error('Error sending verification email:', error);
        return { success: false, message: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending verification email:', error);
      return { success: false, message: 'Failed to send verification email' };
    }
  }

  // Verify email
  async verifyEmail(email: string, code: string): Promise<{ success: boolean; message?: string }> {
    try {
      // In a real implementation, you would verify the code
      // For now, we'll just update the profile
      const { error } = await supabase
        .from('profiles')
        .update({ 
          email_verified: true,
          kyc_level: 1,
          kyc_status: 'pending'
        })
        .eq('email', email);

      if (error) {
        console.error('Error verifying email:', error);
        return { success: false, message: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error verifying email:', error);
      return { success: false, message: 'Failed to verify email' };
    }
  }

  // Submit identity verification
  async submitIdentityVerification(data: KYCLevel2Data): Promise<{ success: boolean; message?: string }> {
    if (!this.userId) {
      return { success: false, message: 'User ID not set' };
    }

    try {
      // Create KYC submission
      const { error: submissionError } = await supabase
        .from('kyc_submissions')
        .insert({
          user_id: this.userId,
          level: 2,
          status: 'pending',
          data: data,
          submitted_at: new Date().toISOString()
        });

      if (submissionError) {
        console.error('Error creating KYC submission:', submissionError);
        return { success: false, message: submissionError.message };
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          kyc_level: 2,
          kyc_status: 'pending',
          documents_submitted: true
        })
        .eq('id', this.userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        return { success: false, message: profileError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error submitting identity verification:', error);
      return { success: false, message: 'Failed to submit identity verification' };
    }
  }

  // Create KYC submission
  async createKYCSubmission(
    userId: string,
    level: number,
    data: any
  ): Promise<{ success: boolean; submission?: KYCSubmission; message?: string }> {
    try {
      const { data: submission, error } = await supabase
        .from('kyc_submissions')
        .insert({
          user_id: userId,
          level: level,
          status: 'pending',
          data: data,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating KYC submission:', error);
        return { success: false, message: error.message };
      }

      return {
        success: true,
        submission: {
          id: submission.id,
          userId: submission.user_id,
          level: submission.level,
          status: submission.status,
          data: submission.data,
          submittedAt: submission.submitted_at,
          reviewedAt: submission.reviewed_at,
          reviewedBy: submission.reviewed_by,
          remarks: submission.remarks
        }
      };
    } catch (error) {
      console.error('Error creating KYC submission:', error);
      return { success: false, message: 'Failed to create KYC submission' };
    }
  }

  // Get KYC submissions by status
  async getSubmissionsByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<KYCSubmission[]> {
    try {
      const { data, error } = await supabase
        .from('kyc_submissions')
        .select('*')
        .eq('status', status)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching KYC submissions:', error);
        return [];
      }

      return data.map(submission => ({
        id: submission.id,
        userId: submission.user_id,
        level: submission.level,
        status: submission.status,
        data: submission.data,
        submittedAt: submission.submitted_at,
        reviewedAt: submission.reviewed_at,
        reviewedBy: submission.reviewed_by,
        remarks: submission.remarks
      }));
    } catch (error) {
      console.error('Error getting KYC submissions:', error);
      return [];
    }
  }

  // Review KYC submission
  async reviewSubmission(
    submissionId: string,
    status: 'approved' | 'rejected',
    remarks?: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await supabase
        .from('kyc_submissions')
        .update({
          status: status,
          reviewed_at: new Date().toISOString(),
          remarks: remarks
        })
        .eq('id', submissionId);

      if (error) {
        console.error('Error reviewing KYC submission:', error);
        return { success: false, message: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error reviewing KYC submission:', error);
      return { success: false, message: 'Failed to review KYC submission' };
    }
  }

  // Get countries list
  getCountries(): string[] {
    return [
      'United States', 'Canada', 'United Kingdom', 'Germany', 'France',
      'Australia', 'Japan', 'South Korea', 'Singapore', 'Hong Kong',
      'Switzerland', 'Netherlands', 'Sweden', 'Norway', 'Denmark',
      'Finland', 'New Zealand', 'Ireland', 'Belgium', 'Austria'
    ];
  }

  // Get user KYC data
  getUser(userId: string): any {
    // This would typically fetch from Supabase
    // For now, return mock data
    return {
      id: userId,
      kycLevel: 1,
      kycStatus: 'pending',
      emailVerified: true,
      identityVerified: false
    };
  }

  // Event listeners (for compatibility with old service)
  on(event: string, callback: Function) {
    // TODO: Implement Supabase real-time subscriptions for KYC events
    console.log(`KYC event listener registered for: ${event}`);
  }

  off(event: string, callback: Function) {
    // TODO: Implement Supabase real-time subscription cleanup
    console.log(`KYC event listener removed for: ${event}`);
  }
}

const supabaseKYCService = new SupabaseKYCService();
export default supabaseKYCService; 