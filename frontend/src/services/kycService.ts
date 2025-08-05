import websocketService from './websocketService';
import { getCountries, Country } from '@/utils/countries';

export interface KYCLevel1Data {
  email: string;
  verificationCode?: string;
}

export interface KYCLevel2Data {
  fullName: string;
  dateOfBirth: string;
  country: string;
  idType: 'passport' | 'national_id' | 'drivers_license';
  idNumber: string;
  frontFile?: File;
  backFile?: File;
  selfieFile?: File;
}

export interface KYCStatus {
  level1: {
    status: 'unverified' | 'verified';
    verifiedAt?: string;
  };
  level2: {
    status: 'not_started' | 'pending' | 'approved' | 'rejected';
    submittedAt?: string;
    reviewedAt?: string;
    rejectionReason?: string;
    documents?: {
      fullName: string;
      dateOfBirth: string;
      country: string;
      idType: string;
      idNumber: string;
      frontUrl?: string;
      backUrl?: string;
      selfieUrl?: string;
    };
  };
}

class KYCService {
  private static instance: KYCService;

  private constructor() {}

  static getInstance(): KYCService {
    if (!KYCService.instance) {
      KYCService.instance = new KYCService();
    }
    return KYCService.instance;
  }

  // Level 1: Email Verification
  async sendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Sending verification email to:', email);
      
      // Try to connect to backend first
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/kyc/send-verification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        if (response.ok) {
          const result = await response.json();
          return result;
        }
      } catch (error) {
        console.warn('Backend API call failed, using fallback:', error);
      }
      
      // Fallback: Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store verification code in localStorage for demo
      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      localStorage.setItem(`verification_${email}`, verificationCode);
      
      return {
        success: true,
        message: 'Verification email sent successfully'
      };
    } catch (error) {
      console.error('Error sending verification email:', error);
      return {
        success: false,
        message: 'Failed to send verification email'
      };
    }
  }

  async verifyEmail(email: string, code: string): Promise<{ success: boolean; message: string }> {
    try {
      // TODO: Implement real API call to verify email
      console.log('Verifying email:', email, 'with code:', code);
      
      // Check stored verification code
      const storedCode = localStorage.getItem(`verification_${email}`);
      if (storedCode === code) {
        // Mark email as verified
        const userData = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const updatedUsers = userData.map((user: any) => 
          user.email === email 
            ? { 
                ...user, 
                kycLevel1: { 
                  status: 'verified', 
                  verifiedAt: new Date().toISOString() 
                } 
              }
            : user
        );
        localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));
        
        // Emit real-time update
        websocketService.updateKYCStatus(email, {
          level: 1,
          status: 'verified',
          verifiedAt: new Date().toISOString()
        });
        
        return {
          success: true,
          message: 'Email verified successfully'
        };
      } else {
        return {
          success: false,
          message: 'Invalid verification code'
        };
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      return {
        success: false,
        message: 'Failed to verify email'
      };
    }
  }

  // Level 2: Identity Verification
  async submitIdentityVerification(data: KYCLevel2Data): Promise<{ success: boolean; message: string }> {
    try {
      // TODO: Implement real API call to submit identity verification
      console.log('Submitting identity verification:', data);
      
      // Simulate file upload
      const frontUrl = data.frontFile ? await this.uploadFile(data.frontFile) : '';
      const backUrl = data.backFile ? await this.uploadFile(data.backFile) : '';
      const selfieUrl = data.selfieFile ? await this.uploadFile(data.selfieFile) : '';
      
      // Store KYC data
      const kycData = {
        userId: data.fullName, // Using fullName as userId for demo
        level2: {
          status: 'pending',
          submittedAt: new Date().toISOString(),
          documents: {
            fullName: data.fullName,
            dateOfBirth: data.dateOfBirth,
            country: data.country,
            idType: data.idType,
            idNumber: data.idNumber,
            frontUrl,
            backUrl,
            selfieUrl
          }
        }
      };
      
      // Store in localStorage for demo
      const existingKYC = JSON.parse(localStorage.getItem('kyc_submissions') || '[]');
      existingKYC.push(kycData);
      localStorage.setItem('kyc_submissions', JSON.stringify(existingKYC));
      
      // Emit real-time update
      websocketService.notifyKYCSubmission(Date.now().toString(), {
        userId: data.fullName,
        level: 2,
        status: 'pending',
        submittedAt: new Date().toISOString()
      });
      
      return {
        success: true,
        message: 'Identity verification submitted successfully'
      };
    } catch (error) {
      console.error('Error submitting identity verification:', error);
      return {
        success: false,
        message: 'Failed to submit identity verification'
      };
    }
  }

  async getKYCStatus(userId: string): Promise<KYCStatus> {
    try {
      // TODO: Implement real API call to get KYC status
      console.log('Getting KYC status for user:', userId);
      
      // Get from localStorage for demo
      const userData = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const user = userData.find((u: any) => u.email === userId);
      
      const kycSubmissions = JSON.parse(localStorage.getItem('kyc_submissions') || '[]');
      const userSubmission = kycSubmissions.find((s: any) => s.userId === userId);
      
      return {
        level1: user?.kycLevel1 || { status: 'unverified' },
        level2: userSubmission?.level2 || { status: 'not_started' }
      };
    } catch (error) {
      console.error('Error getting KYC status:', error);
      return {
        level1: { status: 'unverified' },
        level2: { status: 'not_started' }
      };
    }
  }

  // Admin functions
  async getKYCSubmissions(): Promise<any[]> {
    try {
      // TODO: Implement real API call to get KYC submissions
      console.log('Getting KYC submissions for admin');
      
      // Get from localStorage for demo
      const submissions = JSON.parse(localStorage.getItem('kyc_submissions') || '[]');
      return submissions.filter((s: any) => s.level2.status === 'pending');
    } catch (error) {
      console.error('Error getting KYC submissions:', error);
      return [];
    }
  }

  async reviewKYCSubmission(submissionId: string, status: 'approved' | 'rejected', reason?: string): Promise<{ success: boolean; message: string }> {
    try {
      // TODO: Implement real API call to review KYC submission
      console.log('Reviewing KYC submission:', submissionId, status, reason);
      
      // Update submission status
      const submissions = JSON.parse(localStorage.getItem('kyc_submissions') || '[]');
      const updatedSubmissions = submissions.map((s: any) => 
        s.userId === submissionId 
          ? { 
              ...s, 
              level2: { 
                ...s.level2, 
                status, 
                reviewedAt: new Date().toISOString(),
                rejectionReason: reason 
              } 
            }
          : s
      );
      localStorage.setItem('kyc_submissions', JSON.stringify(updatedSubmissions));
      
      // Emit real-time update
      websocketService.updateKYCStatus(submissionId, {
        level: 2,
        status,
        reviewedAt: new Date().toISOString(),
        rejectionReason: reason
      });
      
      return {
        success: true,
        message: `KYC submission ${status} successfully`
      };
    } catch (error) {
      console.error('Error reviewing KYC submission:', error);
      return {
        success: false,
        message: 'Failed to review KYC submission'
      };
    }
  }

  // Alias for reviewKYCSubmission for compatibility
  async reviewSubmission(submissionId: string, status: 'approved' | 'rejected', reason?: string): Promise<boolean> {
    try {
      const result = await this.reviewKYCSubmission(submissionId, status, reason);
      return result.success;
    } catch (error) {
      console.error('Error in reviewSubmission:', error);
      return false;
    }
  }

  // Helper function to simulate file upload
  private async uploadFile(file: File): Promise<string> {
    // TODO: Implement real file upload
    return `https://example.com/uploads/${file.name}`;
  }

  // Check if user can access trading features
  canAccessTrading(kycStatus: KYCStatus): boolean {
    return kycStatus.level1.status === 'verified';
  }

  // Check if user can withdraw
  canWithdraw(kycStatus: KYCStatus): boolean {
    return kycStatus.level2.status === 'approved';
  }

  getCountries(): Country[] {
    return getCountries();
  }

  // Admin: Get all users with KYC data
  getAllUsers(): any[] {
    try {
      // TODO: Implement real API call to get all users
      console.log('Getting all users for admin KYC verification');
      
      // Get from localStorage for demo
      const userData = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const kycSubmissions = JSON.parse(localStorage.getItem('kyc_submissions') || '[]');
      
      return userData.map((user: any) => {
        const userSubmission = kycSubmissions.find((s: any) => s.userId === user.email);
        return {
          ...user,
          kycLevel: {
            level: userSubmission ? 2 : 1,
            status: userSubmission?.level2?.status || 'not_started',
            verifiedAt: user?.kycLevel1?.verifiedAt,
            submittedAt: userSubmission?.level2?.submittedAt
          },
          submissions: userSubmission ? [userSubmission] : [],
          restrictions: {
            tradeLimit: userSubmission?.level2?.status === 'approved' ? 10000 : 1000,
            withdrawalLimit: userSubmission?.level2?.status === 'approved' ? 5000 : 500,
            dailyLimit: userSubmission?.level2?.status === 'approved' ? 5000 : 1000
          }
        };
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // Admin: Get submissions by status
  getSubmissionsByStatus(status: string): any[] {
    try {
      // TODO: Implement real API call to get submissions by status
      console.log('Getting KYC submissions by status:', status);
      
      // Get from localStorage for demo
      const kycSubmissions = JSON.parse(localStorage.getItem('kyc_submissions') || '[]');
      
      if (status === 'all') {
        return kycSubmissions;
      }
      
      return kycSubmissions.filter((s: any) => s.level2?.status === status);
    } catch (error) {
      console.error('Error getting submissions by status:', error);
      return [];
    }
  }

  // Event emitter methods for real-time updates
  on(event: string, callback: Function) {
    // TODO: Implement real event emitter
    console.log('KYC service event listener added:', event);
  }

  off(event: string, callback: Function) {
    // TODO: Implement real event emitter
    console.log('KYC service event listener removed:', event);
  }
}

const kycService = KYCService.getInstance();
export default kycService; 