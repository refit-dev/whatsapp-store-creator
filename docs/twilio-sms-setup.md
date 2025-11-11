# Twilio SMS Verification Setup Guide

This guide will help you configure Twilio SMS verification for your WhatsApp Store Creator application.

## Overview

The application has been updated to use **Twilio SMS** for phone number verification instead of WhatsApp Business API. Users must verify their phone number before they can share their store link.

## Why Twilio SMS?

- **Simpler Setup**: No need for WhatsApp Business approval
- **Faster Implementation**: Works immediately after setup
- **Global Coverage**: SMS works worldwide
- **Reliable Delivery**: Direct SMS delivery without template restrictions
- **Cost Effective**: Pay only for messages sent

## Prerequisites

1. A Twilio account (sign up at [twilio.com](https://www.twilio.com))
2. A verified phone number in Twilio (for sending SMS)

## Step 1: Create a Twilio Account

1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free account
3. Complete phone verification
4. You'll get **$15 in free credit** to test

## Step 2: Get Your Twilio Credentials

### Account SID and Auth Token

1. Log in to your [Twilio Console](https://console.twilio.com)
2. On the dashboard, you'll see:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click to reveal)
3. Copy both values

### Get a Phone Number

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select your country
3. Choose a number with **SMS** capability
4. Click **Buy** (costs ~$1/month, free trial covers this)
5. Copy your new phone number (it will be in E.164 format like `+1234567890`)

## Step 3: Configure Environment Variables

Add these variables to your `.env.local` file:

```bash
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### Example `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Twilio SMS
TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcdef
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+12345678901

# Payment providers (if configured)
STRIPE_SECRET_KEY=sk_test_...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

## Step 4: Test the Integration

1. Start your development server:

   ```bash
   pnpm dev
   ```

2. Log in to your dashboard at `http://localhost:3000/dashboard`

3. Scroll to the **Store Settings** section

4. Enter your phone number in E.164 format (e.g., `+1234567890`)

5. Click **Send Code**

6. Check your phone for the SMS with the 6-digit code

7. Enter the code and click **Verify**

8. Once verified, you'll see a green success message

## Step 5: Verify Store Sharing Protection

1. Before verification:

   - Try to copy your store link
   - You should see a warning message requiring verification

2. After verification:
   - Store link buttons become active
   - You can copy and share your store link
   - Green verification badge appears

## Features

### Automatic Phone Validation

The system validates phone numbers to ensure they're in E.164 format:

- Must start with `+`
- Must include country code
- No spaces or special characters (except +)

### OTP Security

- 6-digit random code
- Expires after 10 minutes
- Attempt tracking to prevent brute force
- Secure storage in database

### Verification Requirements

Users **cannot** share their store link until phone verification is complete:

- Copy Link button is disabled
- Share on WhatsApp button is disabled
- Warning message displayed

## Database

The verification data is stored in the `whatsapp_verifications` table (renamed from WhatsApp but kept for backward compatibility):

```sql
- store_id: UUID (references stores)
- phone_e164: TEXT (phone number in E.164 format)
- otp_code: TEXT (6-digit code)
- expires_at: TIMESTAMPTZ (expiration time)
- verified_at: TIMESTAMPTZ (verification timestamp)
- attempts: INTEGER (number of verification attempts)
```

## Costs

### Twilio Pricing (as of 2024)

- **Phone Number**: ~$1-2/month depending on country
- **SMS (US/Canada)**: $0.0075 per message sent
- **SMS (India)**: $0.0051 per message sent
- **SMS (International)**: Varies by country

### Example Monthly Cost:

For 100 verifications per month:

- Phone number: $1.00
- SMS (100 messages): $0.75
- **Total**: ~$1.75/month

Free trial credit ($15) covers ~2,000 SMS messages!

## Troubleshooting

### "SMS service not configured" Error

**Solution**: Check that all three environment variables are set correctly in `.env.local`

### "Invalid phone number format" Error

**Solution**: Ensure the phone number includes:

- Country code (e.g., +1 for US, +91 for India)
- No spaces or dashes
- Format: `+[country code][number]`

### SMS Not Received

**Solutions**:

1. Check if the number is in E.164 format
2. Verify your Twilio phone number has SMS capability
3. Check Twilio Console → Logs for delivery status
4. Ensure you have sufficient Twilio credit

### "Failed to send SMS" Error

**Solutions**:

1. Verify Twilio credentials are correct
2. Check if your Twilio account is active
3. Ensure your Twilio phone number is not suspended
4. Check Twilio Console for detailed error messages

## Production Deployment

### Vercel

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add all three Twilio variables:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
4. Redeploy your application

### Other Platforms

Add the environment variables to your hosting platform's configuration:

- Netlify: Site Settings → Environment Variables
- Railway: Project → Variables
- Render: Environment → Environment Variables

## Security Best Practices

1. **Never commit** `.env.local` to git
2. Keep your Auth Token secret
3. Use Twilio's **IP allowlist** in production
4. Enable **two-factor authentication** on your Twilio account
5. Monitor usage in Twilio Console to detect unusual activity
6. Rotate your Auth Token periodically

## Support

- **Twilio Documentation**: [https://www.twilio.com/docs/sms](https://www.twilio.com/docs/sms)
- **Twilio Support**: Available through Console
- **Application Issues**: Check logs in your hosting platform

## Migration from WhatsApp

If you were using WhatsApp Business API before:

1. Old environment variables (no longer needed):

   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_BUSINESS_ACCOUNT_ID`
   - `WHATSAPP_VERIFY_TOKEN`
   - `WHATSAPP_OTP_TEMPLATE_NAME`
   - `WHATSAPP_OTP_TEMPLATE_LANG`

2. You can remove these from your `.env.local` and Vercel/hosting config

3. The database table name remains `whatsapp_verifications` for backward compatibility

4. All existing verification records remain valid

## Next Steps

1. ✅ Configure Twilio credentials
2. ✅ Test verification flow
3. ✅ Deploy to production
4. 📊 Monitor SMS usage in Twilio Console
5. 💰 Add billing information when trial credit runs out

---

**Last Updated**: November 2025
