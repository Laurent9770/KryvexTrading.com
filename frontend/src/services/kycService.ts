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
  private eventListeners: Map<string, Function[]> = new Map();

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
      } else {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.message || 'Failed to send verification email'
        };
      }
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
      console.log('Verifying email:', email, 'with code:', code);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/kyc/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      if (response.ok) {
        const result = await response.json();
        // Emit events for real-time updates
        this.emit('level_verified', { userId: email, level: 1 });
        this.emit('user_updated', { userId: email });
        return result;
      } else {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.message || 'Failed to verify email'
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
      console.log('Submitting identity verification:', data);
      
      const formData = new FormData();
      formData.append('level', '2');
      formData.append('documents', JSON.stringify({
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth,
        country: data.country,
        idType: data.idType,
        idNumber: data.idNumber
      }));

      if (data.frontFile) {
        formData.append('frontFile', data.frontFile);
      }
      if (data.backFile) {
        formData.append('backFile', data.backFile);
      }
      if (data.selfieFile) {
        formData.append('selfieFile', data.selfieFile);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/kyc/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        // Emit events for real-time updates
        this.emit('submission_created', { submission: result.data });
        this.emit('user_updated', { userId: data.fullName });
        return result;
      } else {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.message || 'Failed to submit identity verification'
        };
      }
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
      console.log('Getting KYC status for user:', userId);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/kyc/status/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        return result.data;
      } else {
        console.warn('Failed to get KYC status from backend, using fallback');
        // Fallback to localStorage for demo
        const userData = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const user = userData.find((u: any) => u.email === userId);
        
        const kycSubmissions = JSON.parse(localStorage.getItem('kyc_submissions') || '[]');
        const userSubmission = kycSubmissions.find((s: any) => s.userId === userId);
        
        return {
          level1: user?.kycLevel1 || { status: 'unverified' },
          level2: userSubmission?.level2 || { status: 'not_started' }
        };
      }
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
      console.log('Getting KYC submissions for admin');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/kyc/admin/submissions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        return result.data;
      } else {
        console.warn('Failed to get KYC submissions from backend, using fallback');
        // Fallback to localStorage for demo
        const submissions = JSON.parse(localStorage.getItem('kyc_submissions') || '[]');
        return submissions.filter((s: any) => s.level2.status === 'pending');
      }
    } catch (error) {
      console.error('Error getting KYC submissions:', error);
      return [];
    }
  }

  async reviewKYCSubmission(submissionId: string, status: 'approved' | 'rejected', reason?: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Reviewing KYC submission:', submissionId, status, reason);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/kyc/admin/submissions/${submissionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, adminNotes: reason }),
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      } else {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.message || 'Failed to review KYC submission'
        };
      }
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
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
    console.log('KYC service event listener added:', event);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
    console.log('KYC service event listener removed:', event);
  }

  private emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in KYC event listener:', error);
        }
      });
    }
  }
}

const kycService = KYCService.getInstance();
export default kycService; 