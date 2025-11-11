# Migration Guide: WhatsApp API to Twilio SMS

This guide helps you migrate from WhatsApp Business API to Twilio SMS verification.

## What Changed?

### Before (WhatsApp Business API)

- Used WhatsApp Business API to send OTP codes
- Required Meta Business verification and approval
- Used message templates
- Complex setup process

### After (Twilio SMS)

- Uses Twilio SMS to send OTP codes
- No approval process needed
- Simple SMS messages
- Quick 5-minute setup
- **Mandatory verification before sharing store**

## Migration Steps

### Step 1: Sign Up for Twilio

1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Create a free account
3. Get $15 free credit

### Step 2: Get Twilio Credentials

See [twilio-sms-setup.md](twilio-sms-setup.md) for detailed instructions.

Quick summary:

- Get **Account SID** from Twilio Console
- Get **Auth Token** from Twilio Console
- Buy a phone number with SMS capability

### Step 3: Update Environment Variables

#### Remove Old Variables (Optional)

These are no longer needed:

```bash
# Can be removed
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_BUSINESS_ACCOUNT_ID
WHATSAPP_VERIFY_TOKEN
WHATSAPP_OTP_TEMPLATE_NAME
WHATSAPP_OTP_TEMPLATE_LANG
```

#### Add New Variables (Required)

Add to your `.env.local`:

```bash
TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcdef
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+12345678901
```

### Step 4: Update Production Environment

#### Vercel

1. Go to Project Settings → Environment Variables
2. Delete old WhatsApp variables (optional)
3. Add three new Twilio variables
4. Redeploy

#### Other Platforms

Update environment variables in your platform:

- Railway: Variables section
- Render: Environment Variables
- Netlify: Site Settings → Environment

### Step 5: Test Verification

1. Deploy/restart your application
2. Log in to dashboard
3. Go to Store Settings
4. Test phone verification with SMS
5. Verify that store sharing requires verification

## Database Changes

**Good news**: No database changes needed!

The `whatsapp_verifications` table name remains the same for backward compatibility. All existing verification records continue to work.

## Component Changes

The following components were updated:

### MobileVerification.tsx

- ✅ Updated UI text (WhatsApp → Phone Number)
- ✅ Changed from WhatsApp template to SMS
- ✅ Added better verification status messages

### ShareStoreLink.tsx

- ✅ Added verification check before sharing
- ✅ Shows warning if not verified
- ✅ Disables sharing buttons until verified

### API Routes

- ✅ `/api/whatsapp/send-otp` - Now uses Twilio SMS
- ✅ `/api/whatsapp/status` - No changes needed
- ✅ `/api/whatsapp/verify-otp` - No changes needed

## Verification Now Mandatory

### What's Different?

**Before**: Phone verification was optional

**After**: Phone verification is **required** to share store link

### User Flow

1. User creates account
2. User sets up store
3. User tries to share store link
4. **Blocked with warning**: "Phone Verification Required"
5. User scrolls to verification section
6. User verifies phone via SMS
7. ✓ Store link sharing is enabled

### Why This Change?

- Prevents spam stores
- Ensures store owners are reachable
- Improves trust and reliability
- Reduces fake/test stores

## Cost Comparison

### WhatsApp Business API (Old)

- **Setup**: Complex, requires business verification
- **Cost**: Free for first 1,000 conversations/month
- **Approval**: Meta approval needed for templates
- **Time to setup**: 1-2 weeks

### Twilio SMS (New)

- **Setup**: Simple, instant activation
- **Cost**: ~$0.0075 per SMS (US), phone ~$1/month
- **Approval**: None needed
- **Time to setup**: 5 minutes

### Example Cost for 100 verifications/month:

- Phone number: $1.00
- SMS (100 × $0.0075): $0.75
- **Total**: $1.75/month

## Testing Checklist

- [ ] Twilio credentials configured in `.env.local`
- [ ] Development server running
- [ ] Can send SMS verification code
- [ ] Can verify code successfully
- [ ] Store sharing blocked before verification
- [ ] Store sharing enabled after verification
- [ ] Green verification badge appears
- [ ] Production environment variables updated
- [ ] Production deployment tested

## Rollback (If Needed)

If you need to rollback to WhatsApp API:

1. **Code Rollback**:

   ```bash
   git revert <commit-hash>
   ```

2. **Environment Variables**:

   - Remove Twilio variables
   - Restore WhatsApp variables

3. **Redeploy**

Note: We recommend using Twilio as it's simpler and more reliable.

## Support

### Common Issues

**"SMS service not configured"**

- Check all 3 Twilio env variables are set
- Restart dev server after adding variables

**"Invalid phone number format"**

- Use E.164 format: +[country][number]
- Example: +12345678901 (not 234-567-8901)

**SMS not received**

- Check Twilio Console → Logs
- Verify phone number has SMS capability
- Check Twilio account has credit

### Getting Help

1. Check [twilio-sms-setup.md](twilio-sms-setup.md)
2. Check Twilio Console → Logs for detailed errors
3. Review Twilio documentation
4. Contact Twilio Support (available on free tier)

## Timeline

This migration can be completed in **15-30 minutes**:

- 5 min: Sign up for Twilio
- 5 min: Get credentials and phone number
- 5 min: Update environment variables
- 5 min: Test and deploy
- 10 min: Buffer for troubleshooting

## FAQ

**Q: Will existing verified users need to re-verify?**
A: No, existing verification records remain valid.

**Q: Can I keep both WhatsApp and Twilio?**
A: The code now only supports Twilio. You'd need custom modifications to support both.

**Q: What happens if I don't migrate?**
A: Verification will fail without Twilio credentials. Users won't be able to verify phones or share stores.

**Q: Is Twilio GDPR compliant?**
A: Yes, Twilio is GDPR compliant. See their [privacy policy](https://www.twilio.com/legal/privacy).

**Q: Can users verify with the same number used for WhatsApp orders?**
A: Yes! The verification phone can be the same as the WhatsApp number for orders.

**Q: Do I need a separate Twilio number for each store?**
A: No, one Twilio number can send SMS to all your users' stores.

---

**Last Updated**: November 2025
