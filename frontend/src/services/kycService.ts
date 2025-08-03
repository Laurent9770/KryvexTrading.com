import websocketService from './websocketService';

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
      // TODO: Implement real API call to send verification email
      console.log('Sending verification email to:', email);
      
      // Simulate API call
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
    return kycStatus.level1.status === 'verified' && kycStatus.level2.status === 'approved';
  }
}

const kycService = KYCService.getInstance();
export default kycService; 