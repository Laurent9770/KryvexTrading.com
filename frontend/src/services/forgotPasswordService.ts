import { supabase } from '@/integrations/supabase/client';

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  error?: string;
}

class ForgotPasswordService {
  async sendResetEmail(email: string): Promise<ForgotPasswordResponse> {
    try {
      console.log('🔐 Sending password reset email to:', email);
      
      const redirectTo = `${window.location.origin}/auth?reset=true`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        return {
          success: false,
          message: 'Failed to send reset email',
          error: error.message
        };
      }

      console.log('✅ Password reset email sent successfully');
      return {
        success: true,
        message: 'Password reset email sent! Check your inbox.'
      };
    } catch (error) {
      console.error('❌ Unexpected error in password reset:', error);
      return {
        success: false,
        message: 'An unexpected error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async resetPassword(newPassword: string): Promise<ForgotPasswordResponse> {
    try {
      console.log('🔐 Resetting password...');
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ Password update error:', error);
        return {
          success: false,
          message: 'Failed to update password',
          error: error.message
        };
      }

      console.log('✅ Password updated successfully');
      return {
        success: true,
        message: 'Password updated successfully! You can now sign in.'
      };
    } catch (error) {
      console.error('❌ Unexpected error in password update:', error);
      return {
        success: false,
        message: 'An unexpected error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

const forgotPasswordService = new ForgotPasswordService();
export default forgotPasswordService;
