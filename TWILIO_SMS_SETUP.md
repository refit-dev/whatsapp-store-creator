# Twilio SMS Integration Setup Guide

Your WhatsApp Store Creator now supports SMS verification via Twilio. Follow these steps to complete the setup:

## 1. Sign up for Twilio

1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign up for a free account
3. Verify your phone number

## 2. Get Your Twilio Credentials

From your Twilio Console Dashboard:

1. **Account SID**: Found on your main dashboard
2. **Auth Token**: Click the "Show" button next to Auth Token on dashboard
3. **Phone Number**: Purchase a phone number from Twilio

### Free Tier Limitations

- Twilio free tier allows you to send SMS only to verified phone numbers
- You'll need to verify recipient numbers in the Twilio console
- To send to any number, you'll need to upgrade your account

## 3. Configure Environment Variables

Your `.env.local` file should already have these (added automatically):

```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

Replace the placeholder values with your actual Twilio credentials:

- `TWILIO_ACCOUNT_SID`: Your Account SID from Twilio Console
- `TWILIO_AUTH_TOKEN`: Your Auth Token from Twilio Console
- `TWILIO_PHONE_NUMBER`: Your Twilio phone number (include country code with +)

## 4. Test SMS Verification

1. Start your development server: `pnpm dev`
2. Go to your app and try to sign up with a new account
3. Enter a mobile number for verification
4. You should receive an SMS with the verification code

## 5. Troubleshooting

### Common Issues:

**SMS not received:**

- Check if the phone number is verified in Twilio (for free accounts)
- Verify your Twilio credentials are correct
- Check the Twilio Console logs for delivery status

**Error messages:**

- Check the browser console and terminal logs
- Verify all environment variables are set
- Ensure your Twilio account has sufficient balance

**Development fallback:**

- If Twilio fails, the system will fallback to console logging
- Check your terminal for the verification code

### Phone Number Format:

- Always include country code: `+91` for India, `+1` for US/Canada
- Format: `+919876543210` (no spaces or dashes)

## 6. Production Deployment

When deploying to production:

1. Add the Twilio environment variables to your hosting platform
2. Ensure your Twilio account is upgraded if you need to send to unverified numbers
3. Monitor Twilio usage and costs

## 7. Alternative SMS Providers

If you prefer a different SMS provider, you can modify the `sendVerificationSMS` function in:
`app/api/verification/send-sms/route.ts`

Popular alternatives for India:

- MSG91
- TextLocal
- Amazon SNS
- Firebase Cloud Messaging

## Cost Considerations

- Twilio charges per SMS sent
- Free tier includes some free messages
- Consider implementing rate limiting to prevent abuse
- Monitor usage in Twilio Console

Your SMS verification system is now ready! 🎉
