# Email and Mobile Verification Setup Guide

This guide will help you set up both email and mobile verification for your WhatsApp Store Creator platform.

## 🗄️ Database Setup

### 1. Run the Fixed Verification Schema SQL

Execute the updated `setup_verification_system.sql` file in your Supabase SQL Editor:

```bash
# The fixed file contains:
✅ user_profiles table (instead of modifying auth.users)
✅ verification_codes table for OTP management
✅ verification_attempts table for rate limiting
✅ Automatic user profile creation trigger
✅ RLS policies for security
✅ Helper functions for rate limiting and cleanup
✅ Graceful constraint handling
```

### 2. Key Fixes Applied

- **❌ Fixed**: "must be owner of table users" error
- **✅ Solution**: Uses `user_profiles` table instead of modifying `auth.users`
- **✅ Auto-sync**: User metadata and profiles stay synchronized
- **✅ Compatible**: Works with all Supabase instances

## 📧 Email Verification Setup

### Development Mode

- Verification codes are logged to console
- No actual emails are sent

### Production Setup

Choose one of these email providers:

#### Option 1: SendGrid

```javascript
// Install SendGrid
npm install @sendgrid/mail

// Add to your .env.local
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@yourdomain.com
```

#### Option 2: AWS SES

```javascript
// Install AWS SDK
npm install @aws-sdk/client-ses

// Add to your .env.local
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
FROM_EMAIL=noreply@yourdomain.com
```

#### Option 3: Resend (Recommended)

```javascript
// Install Resend
npm install resend

// Add to your .env.local
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com
```

## 📱 Mobile Verification Setup

### Development Mode

- Verification codes are logged to console
- No actual SMS are sent

### Production Setup

Choose one of these SMS providers:

#### Option 1: Twilio (Global)

```javascript
// Install Twilio
npm install twilio

// Add to your .env.local
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

#### Option 2: MSG91 (India-focused)

```javascript
// Add to your .env.local
MSG91_API_KEY = your_msg91_api_key;
MSG91_TEMPLATE_ID = your_template_id;
```

#### Option 3: TextLocal (India-focused)

```javascript
// Add to your .env.local
TEXTLOCAL_API_KEY = your_textlocal_api_key;
TEXTLOCAL_SENDER = your_sender_id;
```

## 🔧 Configuration Steps

### 1. Update API Routes

Edit the email and SMS API routes to use your chosen providers:

**For Email** - Update `/app/api/verification/send-email/route.ts`:

```javascript
// Uncomment and configure your chosen email provider
// Example for SendGrid:
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
```

**For SMS** - Update `/app/api/verification/send-sms/route.ts`:

```javascript
// Uncomment and configure your chosen SMS provider
// Example for Twilio:
const twilio = require("twilio");
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
```

### 2. Environment Variables

Add these to your `.env.local`:

```bash
# Email Provider (choose one)
SENDGRID_API_KEY=your_key
# OR
RESEND_API_KEY=your_key
# OR
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# SMS Provider (choose one)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=your_number
# OR
MSG91_API_KEY=your_key
MSG91_TEMPLATE_ID=your_template
# OR
TEXTLOCAL_API_KEY=your_key
TEXTLOCAL_SENDER=your_sender

# Common
FROM_EMAIL=noreply@yourdomain.com
```

## 🎯 Features Included

### ✅ Email Verification

- 6-digit OTP generation
- Email delivery with customizable templates
- Expiration handling (10 minutes)
- Rate limiting (5 attempts per hour)
- Secure validation and cleanup

### ✅ Mobile Verification

- 6-digit SMS OTP
- International phone number support
- Auto-formatting for Indian numbers
- Rate limiting and abuse prevention
- Verification status tracking

### ✅ User Experience

- Step-by-step verification flow
- Progress indicators
- Resend functionality
- Skip options for flexibility
- Dashboard verification status

### ✅ Security Features

- Rate limiting by contact and IP
- Automatic code expiration
- Single-use codes
- Secure storage and cleanup
- RLS policies for data protection

## 🚀 Testing

### 1. Development Testing

- Signup with a new account
- Check console logs for verification codes
- Test the complete verification flow

### 2. Production Testing

- Test with real email addresses
- Test with real mobile numbers
- Verify rate limiting works
- Check email/SMS delivery

## 📊 Monitoring

### Database Cleanup

The system includes automatic cleanup of expired codes. You can also manually clean up:

```sql
-- Clean up expired verification codes
SELECT cleanup_expired_verification_codes();

-- Check verification attempts
SELECT * FROM verification_attempts WHERE blocked_until > NOW();
```

### Rate Limiting Check

```sql
-- Check if a contact is rate limited
SELECT is_verification_rate_limited('user@example.com', 'email');
SELECT is_verification_rate_limited('+1234567890', 'mobile');
```

## 🎨 Customization

### Email Templates

Customize the email template in `/app/api/verification/send-email/route.ts`:

- Update styling and branding
- Add your company logo
- Modify the message content

### SMS Messages

Customize SMS content in `/app/api/verification/send-sms/route.ts`:

- Update message format
- Add branding
- Modify expiration notice

### UI Components

Customize verification UI in:

- `/components/EmailVerification.tsx`
- `/components/MobileVerification.tsx`
- `/components/VerificationStatus.tsx`

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit API keys to version control
2. **Rate Limiting**: The system includes built-in rate limiting
3. **Code Expiration**: Codes expire in 10 minutes
4. **Single Use**: Codes can only be used once
5. **IP Tracking**: Optional IP-based rate limiting
6. **RLS Policies**: Database-level security enabled

## 🎉 Ready to Use!

Once configured, your verification system will:

- ✅ Verify new user signups
- ✅ Show verification status in dashboard
- ✅ Allow users to complete verification anytime
- ✅ Provide secure, reliable verification flow
- ✅ Handle edge cases and abuse prevention

Your WhatsApp Store Creator now has enterprise-grade verification! 🚀
