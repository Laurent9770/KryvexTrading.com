import { supabase } from '@/integrations/supabase/client';

export interface EmailVerificationResponse {
  success: boolean;
  error?: string;
  verificationId?: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  error?: string;
  verified?: boolean;
}

class EmailVerificationService {
  // Generate 6-digit verification code
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Store verification code in memory (in production, use database)
  private verificationCodes: Map<string, {
    email: string;
    code: string;
    expiresAt: Date;
    attempts: number;
    verified: boolean;
  }> = new Map();

  // Clean up expired codes
  private cleanupExpiredCodes(): void {
    const now = new Date();
    for (const [id, data] of this.verificationCodes.entries()) {
      if (now > data.expiresAt) {
        this.verificationCodes.delete(id);
      }
    }
  }

  // Send verification email
  async sendVerificationEmail(email: string, purpose: 'kyc' | 'general' = 'kyc'): Promise<EmailVerificationResponse> {
    try {
      console.log('📧 Sending verification email to:', email);

      // Generate verification code and ID
      const verificationCode = this.generateVerificationCode();
      const verificationId = 'email_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store verification data
      this.verificationCodes.set(verificationId, {
        email,
        code: verificationCode,
        expiresAt,
        attempts: 0,
        verified: false
      });

      // For development, log the code prominently
      console.log('🔑 Verification code for', email, ':', verificationCode);
      
      // DEVELOPMENT MODE: Display verification code for testing
      console.log('📧 EMAIL VERIFICATION SIMULATION');
      console.log('==============================');
      console.log('To:', email);
      console.log('Subject: Kryvex Trading - Email Verification Code');
      console.log('Message:');
      console.log(`Your verification code is: ${verificationCode}`);
      console.log(`This code will expire in 10 minutes.`);
      console.log(`Please enter this code on the verification page.`);
      console.log('==============================');
      
      // Show alert for immediate visibility (development only)
      if (import.meta.env.DEV) {
        setTimeout(() => {
          alert(`DEVELOPMENT: Email verification code is ${verificationCode}\n\nCopy this code and paste it in the verification field.`);
        }, 500);
      }

      // Note: Supabase's signInWithOtp sends magic links, not verification codes
      // For proper email verification in production, use a dedicated email service

      // Clean up old codes
      this.cleanupExpiredCodes();

      // In development, dispatch a custom event for UI components to listen
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        const event = new CustomEvent('email-verification-code', {
          detail: {
            email,
            code: verificationCode,
            verificationId,
            purpose,
            expiresAt: expiresAt.toISOString()
          }
        });
        window.dispatchEvent(event);
      }

      return {
        success: true,
        verificationId
      };

    } catch (error: any) {
      console.error('❌ Email verification error:', error);
      return {
        success: false,
        error: 'Failed to send verification email'
      };
    }
  }

  // Verify email code
  async verifyEmailCode(verificationId: string, code: string, email: string): Promise<VerifyCodeResponse> {
    try {
      console.log('🔐 Verifying email code:', { verificationId, email });

      // Get stored verification data
      const verificationData = this.verificationCodes.get(verificationId);

      if (!verificationData) {
        return {
          success: false,
          error: 'Invalid or expired verification session'
        };
      }

      // Check if expired
      if (new Date() > verificationData.expiresAt) {
        this.verificationCodes.delete(verificationId);
        return {
          success: false,
          error: 'Verification code has expired'
        };
      }

      // Check attempt limit
      if (verificationData.attempts >= 3) {
        this.verificationCodes.delete(verificationId);
        return {
          success: false,
          error: 'Too many failed attempts'
        };
      }

      // Verify email matches
      if (verificationData.email !== email) {
        return {
          success: false,
          error: 'Email mismatch'
        };
      }

      // Increment attempts
      verificationData.attempts++;

      // Check code
      if (verificationData.code !== code) {
        this.verificationCodes.set(verificationId, verificationData);
        return {
          success: false,
          error: `Incorrect code. ${3 - verificationData.attempts} attempts remaining.`
        };
      }

      // Code is correct - mark as verified
      verificationData.verified = true;
      this.verificationCodes.set(verificationId, verificationData);

      // Update user's email verification status in database
      try {
        if (email) {
          const { error } = await supabase
            .from('users')
            .update({ 
              email_verified: true,
              updated_at: new Date().toISOString()
            })
            .eq('email', email);

          if (error) {
            console.error('❌ Failed to update email verification status:', error);
          }
        }
      } catch (dbError) {
        console.error('❌ Database update error:', dbError);
      }

      console.log('✅ Email verification successful');

      return {
        success: true,
        verified: true
      };

    } catch (error: any) {
      console.error('❌ Email verification error:', error);
      return {
        success: false,
        error: 'Verification failed'
      };
    }
  }

  // Check if email is verified
  async isEmailVerified(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email_verified')
        .eq('email', email)
        .single();

      if (error) {
        console.error('❌ Email verification check error:', error);
        return false;
      }

      return data?.email_verified || false;
    } catch (error) {
      console.error('❌ Email verification check error:', error);
      return false;
    }
  }

  // Resend verification email
  async resendVerificationEmail(verificationId: string): Promise<EmailVerificationResponse> {
    try {
      const verificationData = this.verificationCodes.get(verificationId);
      
      if (!verificationData) {
        return {
          success: false,
          error: 'Invalid verification session'
        };
      }

      // Delete old verification and send new one
      this.verificationCodes.delete(verificationId);
      return this.sendVerificationEmail(verificationData.email, 'kyc');
      
    } catch (error: any) {
      console.error('❌ Resend email error:', error);
      return {
        success: false,
        error: 'Failed to resend verification email'
      };
    }
  }

  // Get remaining time for verification
  getRemainingTime(verificationId: string): number {
    const verificationData = this.verificationCodes.get(verificationId);
    if (!verificationData) return 0;

    const remainingMs = verificationData.expiresAt.getTime() - Date.now();
    return Math.max(0, Math.ceil(remainingMs / 1000));
  }

  // Get verification code for development/testing
  getVerificationCodeForTesting(verificationId: string): string | null {
    if (process.env.NODE_ENV !== 'development') return null;
    
    const verificationData = this.verificationCodes.get(verificationId);
    return verificationData?.code || null;
  }
}

export default new EmailVerificationService();
