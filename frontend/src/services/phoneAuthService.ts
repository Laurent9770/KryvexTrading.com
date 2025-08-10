import textlocalService, { OTPData } from './textlocalService';
import supabase from '@/lib/supabaseClient';

export interface PhoneAuthResponse {
  success: boolean;
  error?: string;
  otpSent?: boolean;
  sessionId?: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  error?: string;
  user?: any;
  isNewUser?: boolean;
}

class PhoneAuthService {
  private otpStorage: Map<string, OTPData> = new Map();
  private readonly OTP_EXPIRY_MINUTES = 1; // 60 seconds
  private readonly MAX_ATTEMPTS = 3;

  // Generate session ID for OTP tracking
  private generateSessionId(): string {
    return 'otp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Send OTP to phone number
  async sendOTP(phoneNumber: string): Promise<PhoneAuthResponse> {
    try {
      console.log('📱 Starting phone authentication for:', phoneNumber);

      // Validate phone number
      if (!textlocalService.isValidPhoneNumber(phoneNumber)) {
        return {
          success: false,
          error: 'Invalid phone number format'
        };
      }

      // Generate OTP and session ID
      const otp = textlocalService.generateOTP();
      const sessionId = this.generateSessionId();
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

      // Store OTP data
      const otpData: OTPData = {
        phone: phoneNumber,
        otp,
        expiresAt,
        attempts: 0
      };
      
      this.otpStorage.set(sessionId, otpData);

      // Send SMS via Textlocal
      const smsResult = await textlocalService.sendOTP(phoneNumber, otp);

      if (!smsResult.success) {
        // Clean up failed OTP
        this.otpStorage.delete(sessionId);
        return {
          success: false,
          error: smsResult.error || 'Failed to send OTP'
        };
      }

      console.log('✅ OTP sent successfully:', { sessionId, phone: phoneNumber });

      // Clean up expired OTPs
      this.cleanupExpiredOTPs();

      return {
        success: true,
        otpSent: true,
        sessionId
      };
    } catch (error: any) {
      console.error('❌ Phone auth error:', error);
      return {
        success: false,
        error: 'Failed to send OTP. Please try again.'
      };
    }
  }

  // Verify OTP and authenticate user
  async verifyOTP(sessionId: string, userOTP: string, phoneNumber: string): Promise<VerifyOTPResponse> {
    try {
      console.log('🔐 Verifying OTP:', { sessionId, phone: phoneNumber });

      // Get stored OTP data
      const otpData = this.otpStorage.get(sessionId);

      if (!otpData) {
        return {
          success: false,
          error: 'Invalid or expired session. Please request a new OTP.'
        };
      }

      // Check if OTP is expired
      if (new Date() > otpData.expiresAt) {
        this.otpStorage.delete(sessionId);
        return {
          success: false,
          error: 'OTP has expired. Please request a new one.'
        };
      }

      // Check attempt limit
      if (otpData.attempts >= this.MAX_ATTEMPTS) {
        this.otpStorage.delete(sessionId);
        return {
          success: false,
          error: 'Too many failed attempts. Please request a new OTP.'
        };
      }

      // Increment attempt counter
      otpData.attempts++;

      // Verify phone number matches
      if (otpData.phone !== phoneNumber) {
        return {
          success: false,
          error: 'Phone number mismatch. Please try again.'
        };
      }

      // Verify OTP
      if (otpData.otp !== userOTP) {
        this.otpStorage.set(sessionId, otpData);
        return {
          success: false,
          error: `Incorrect OTP. ${this.MAX_ATTEMPTS - otpData.attempts} attempts remaining.`
        };
      }

      // OTP is correct - clean up
      this.otpStorage.delete(sessionId);

      console.log('✅ Phone OTP verification successful for:', phoneNumber);

      // For now, return success without creating auth user
      // The auth service will handle the actual authentication flow
      return {
        success: true,
        user: { phone: phoneNumber },
        isNewUser: false // We'll determine this in the auth service
      };

    } catch (error: any) {
      console.error('❌ OTP verification error:', error);
      return {
        success: false,
        error: 'Verification failed. Please try again.'
      };
    }
  }

  // Clean up expired OTPs
  private cleanupExpiredOTPs(): void {
    const now = new Date();
    for (const [sessionId, otpData] of this.otpStorage.entries()) {
      if (now > otpData.expiresAt) {
        this.otpStorage.delete(sessionId);
      }
    }
  }

  // Get remaining time for OTP
  getRemainingTime(sessionId: string): number {
    const otpData = this.otpStorage.get(sessionId);
    if (!otpData) return 0;

    const remainingMs = otpData.expiresAt.getTime() - Date.now();
    return Math.max(0, Math.ceil(remainingMs / 1000));
  }

  // Resend OTP (same as sendOTP but clears previous session)
  async resendOTP(sessionId: string, phoneNumber: string): Promise<PhoneAuthResponse> {
    // Clean up previous session
    if (sessionId) {
      this.otpStorage.delete(sessionId);
    }

    // Send new OTP
    return this.sendOTP(phoneNumber);
  }
}

export default new PhoneAuthService();
