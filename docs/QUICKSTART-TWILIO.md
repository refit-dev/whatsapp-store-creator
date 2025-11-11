# Quick Start: Twilio SMS Verification

## 5-Minute Setup

### 1. Get Twilio Account (2 minutes)

1. Go to https://www.twilio.com/try-twilio
2. Sign up (free $15 credit)
3. Verify your email and phone

### 2. Get Credentials (2 minutes)

1. Open [Twilio Console](https://console.twilio.com)
2. Copy **Account SID** (starts with AC...)
3. Click to reveal and copy **Auth Token**
4. Go to Phone Numbers → Buy a Number
5. Choose one with **SMS** capability
6. Copy the phone number

### 3. Configure App (1 minute)

Add to your `.env.local`:

```bash
TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcdef
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+12345678901
```

### 4. Test

```bash
pnpm dev
```

1. Go to http://localhost:3000/dashboard
2. Scroll to Store Settings
3. Enter your phone number: `+[country][number]`
   - Example: `+12345678901` (US)
   - Example: `+919876543210` (India)
4. Click "Send Code"
5. Check your phone for SMS
6. Enter 6-digit code
7. Click "Verify"
8. ✓ Done!

## Phone Number Format

✅ **Correct**:

- `+12345678901` (US)
- `+447123456789` (UK)
- `+919876543210` (India)

❌ **Incorrect**:

- `234-567-8901` (missing +, has dashes)
- `2345678901` (missing country code)
- `+1 234 567 8901` (has spaces)

## Cost

- **Phone Number**: $1/month
- **SMS**: $0.0075 each (US)
- **100 verifications**: ~$1.75/month
- **Free Trial**: $15 credit (~2,000 SMS)

## Common Issues

**"SMS service not configured"**
→ Check all 3 env variables are set, restart server

**"Invalid phone number format"**
→ Use E.164: `+[country code][number]`

**SMS not received**
→ Check Twilio Console → Logs for delivery status

## Production Deployment

### Vercel

1. Project Settings → Environment Variables
2. Add 3 Twilio variables
3. Redeploy

### Test Production

1. Try to share store → Blocked ✅
2. Verify phone → SMS received ✅
3. Enter code → Verified ✅
4. Share store → Enabled ✅

## That's It!

You're ready to go. See [twilio-sms-setup.md](twilio-sms-setup.md) for detailed docs.
