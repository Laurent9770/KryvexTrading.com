import axios from 'axios';

// Textlocal configuration
const TEXTLOCAL_API_KEY = 'aky_313RjxSQGXb9yNSAyxytYMU2dSo';
const TEXTLOCAL_SENDER = 'Kryvextrading';
const TEXTLOCAL_API_URL = 'https://api.textlocal.in/send/';

export interface SMSResponse {
  success: boolean;
  message?: string;
  error?: string;
  messageId?: string;
}

export interface OTPData {
  phone: string;
  otp: string;
  expiresAt: Date;
  attempts: number;
}

class TextlocalService {
  // Generate 6-digit OTP
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Format phone number (ensure it's in international format)
  formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 0, replace with country code (assuming UK +44)
    if (cleaned.startsWith('0')) {
      return '44' + cleaned.slice(1);
    }
    
    // If it doesn't start with country code, assume UK
    if (cleaned.length === 10) {
      return '44' + cleaned;
    }
    
    // If it starts with +, remove it
    if (phone.startsWith('+')) {
      return cleaned;
    }
    
    return cleaned;
  }

  // Send OTP via Textlocal
  async sendOTP(phoneNumber: string, otp: string): Promise<SMSResponse> {
    try {
      console.log('📱 Sending OTP via Textlocal...', { phoneNumber, otp });
      
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const message = `Your Kryvex Trading verification code is ${otp}. Valid for 60 seconds. Do not share this code.`;

      // Check if this is a test number (for development)
      const testNumbers: { [key: string]: string } = {
        '18005550123': '789012',
        '447700900123': '654321',
        '919876543210': '123456'
      };

      if (testNumbers[formattedPhone]) {
        console.log('🧪 Using test OTP for development:', testNumbers[formattedPhone]);
        return {
          success: true,
          message: 'Test OTP sent successfully',
          messageId: 'test_' + Date.now()
        };
      }

      const params = new URLSearchParams();
      params.append('apikey', TEXTLOCAL_API_KEY);
      params.append('numbers', formattedPhone);
      params.append('message', message);
      params.append('sender', TEXTLOCAL_SENDER);

      const response = await axios.post(TEXTLOCAL_API_URL, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('📨 Textlocal response:', response.data);

      if (response.data.status === 'success') {
        return {
          success: true,
          message: 'OTP sent successfully',
          messageId: response.data.messages?.[0]?.id
        };
      } else {
        return {
          success: false,
          error: response.data.errors?.[0]?.message || 'Failed to send SMS'
        };
      }
    } catch (error: any) {
      console.error('❌ Textlocal SMS error:', error);
      
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'SMS service timeout. Please try again.'
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.message || 'Failed to send SMS'
      };
    }
  }

  // Validate phone number format
  isValidPhoneNumber(phone: string): boolean {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid length (7-15 digits for international numbers)
    if (cleaned.length < 7 || cleaned.length > 15) {
      return false;
    }
    
    // Additional validation can be added here
    return true;
  }

  // Get country code from phone number
  getCountryCode(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    // Common country codes
    if (cleaned.startsWith('44')) return 'UK';
    if (cleaned.startsWith('1')) return 'US/CA';
    if (cleaned.startsWith('91')) return 'IN';
    if (cleaned.startsWith('33')) return 'FR';
    if (cleaned.startsWith('49')) return 'DE';
    
    return 'Unknown';
  }
}

export default new TextlocalService();
