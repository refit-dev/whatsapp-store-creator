## Email Verification Not Working - Quick Fixes

### Immediate Solutions:

#### 1. **Check Supabase Email Status**

- Go to: https://supabase.com/dashboard/project/YOUR-PROJECT-ID/auth/templates
- Verify "Confirm signup" template is enabled
- Check "Email rate limit" settings

#### 2. **Check Spam Folder**

Supabase emails often go to spam. Check:

- Gmail: Spam/Junk folder
- Search for: "Confirm your signup"

#### 3. **Use Magic Link (Alternative)**

Instead of OTP, Supabase can send a magic link:

- User enters email
- Clicks link in email to verify
- More reliable than OTP codes

#### 4. **Configure Custom SMTP**

For production, set up custom email:

**Steps:**

1. Go to Supabase Dashboard → Settings → Auth → SMTP Settings
2. Choose provider:
   - **SendGrid** (Free tier: 100 emails/day)
   - **Gmail** (Free, but limited)
   - **AWS SES** (Pay-as-you-go)
   - **Resend** (Free tier: 100 emails/day)

**Example - Gmail SMTP:**

```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Password: [App Password - not your regular password]
Sender email: your-email@gmail.com
Sender name: Watzy
```

#### 5. **Check Rate Limits**

Supabase Free Tier Limits:

- 3 emails per hour per user
- 10,000 emails per month total

If exceeded, wait or upgrade to Pro plan.

#### 6. **Test Email Configuration**

Run this test in Supabase SQL Editor:

```sql
-- Check auth settings
SELECT * FROM auth.config;

-- Check recent email logs (if available)
SELECT * FROM auth.audit_log_entries
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;
```

#### 7. **Disable Email Verification (Dev Only)**

**⚠️ Development Only - NOT for production**

In Supabase Dashboard:

1. Go to: Authentication → Settings
2. Disable "Enable email confirmations"
3. Users can sign up without email verification

### Recommended Next Steps:

1. ✅ Check spam folder first
2. ✅ Verify Supabase email templates are enabled
3. ✅ Set up custom SMTP with SendGrid/Resend (free tiers available)
4. ✅ Re-enable email verification after SMTP is configured

### Quick Fix for Testing:

Temporarily disable email confirmation:

- Supabase Dashboard → Auth → Settings
- Turn OFF "Enable email confirmations"
- Users can sign up immediately without verification
- Remember to re-enable for production!
