# 📧 Email Verification Setup Guide

## Current Implementation (Development Mode)

The email verification system is currently set up for **development and testing**. Instead of sending actual emails, verification codes are displayed directly in the application for easy testing.

### How It Works

1. **User clicks "Send Verification Code"**
2. **System generates 6-digit code** (e.g., `123456`)
3. **Code is displayed in development panel** on the page
4. **User copies and enters the code** to verify

### Development Features

- ✅ **Visual Code Display**: Verification codes appear in an amber-colored development panel
- ✅ **Copy to Clipboard**: One-click copy functionality
- ✅ **Console Logging**: Codes are also logged to browser console
- ✅ **Toast Notifications**: User-friendly notifications when codes are generated
- ✅ **Auto-hide**: Codes automatically hide after 30 seconds for security

### For Production Deployment

To implement proper email sending in production, you need to integrate with an email service:

#### Option 1: SendGrid Integration
```typescript
// Replace the simulation in emailVerificationService.ts
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: email,
  from: 'noreply@kryvextrading.com',
  subject: 'Kryvex Trading - Email Verification Code',
  text: `Your verification code is: ${verificationCode}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2>Email Verification</h2>
      <p>Your verification code is:</p>
      <h1 style="color: #2563eb; font-size: 32px; letter-spacing: 4px;">${verificationCode}</h1>
      <p>This code will expire in 10 minutes.</p>
    </div>
  `
};

await sgMail.send(msg);
```

#### Option 2: AWS SES Integration
```typescript
const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: 'us-east-1' });

const params = {
  Destination: { ToAddresses: [email] },
  Message: {
    Body: {
      Html: { Data: `<h1>Your code: ${verificationCode}</h1>` },
      Text: { Data: `Your verification code is: ${verificationCode}` }
    },
    Subject: { Data: 'Kryvex Trading - Email Verification Code' }
  },
  Source: 'noreply@kryvextrading.com'
};

await ses.sendEmail(params).promise();
```

#### Option 3: Supabase Edge Functions
Create a Supabase Edge Function to handle email sending:

```typescript
// supabase/functions/send-verification-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { email, code } = await req.json()
  
  // Send email using your preferred service
  // Return success/error response
})
```

### Environment Variables for Production

Add these to your production environment:

```env
# Email Service Configuration
SENDGRID_API_KEY=your_sendgrid_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
EMAIL_FROM_ADDRESS=noreply@kryvextrading.com
```

### Testing Instructions

1. **Go to KYC page** (`/kyc`)
2. **Click "Send Verification Code"**
3. **Look for the amber development panel** that appears
4. **Click "Copy" to copy the 6-digit code**
5. **Paste the code** in the verification input field
6. **Click "Verify Code"**

### Benefits of Current Approach

- ✅ **No Email Service Dependencies**: Works without external email providers
- ✅ **Fast Testing**: Instant code generation and display
- ✅ **No Spam Issues**: No risk of emails going to spam folders
- ✅ **Easy Debugging**: Clear visibility of generated codes
- ✅ **Production Ready**: Easy to swap in real email service later

### Security Considerations

- ✅ **Code Expiration**: Codes expire after 10 minutes
- ✅ **Limited Attempts**: Prevents brute force attacks
- ✅ **One-time Use**: Codes can only be used once
- ✅ **Cleanup**: Expired codes are automatically removed

## Next Steps

1. **For Development**: Current setup works perfectly
2. **For Production**: Integrate with SendGrid, AWS SES, or similar
3. **Email Templates**: Create branded email templates
4. **Monitoring**: Add email delivery monitoring and analytics
