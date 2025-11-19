# Password Reset Link Fix

## Problem

Password reset links from Supabase redirect to homepage instead of the reset password page.

## Root Cause

When you request a password reset:

1. Supabase sends email with link: `https://[PROJECT].supabase.co/auth/v1/verify?token=...&type=recovery&redirect_to=https://watzy.app`
2. Supabase verifies the token on their server
3. Redirects to the `redirect_to` URL with access tokens in the hash: `https://watzy.app#access_token=...&type=recovery`
4. User lands on homepage, but needs to be on reset password page

## Solution

### Option 1: Update Email Template (Recommended)

Go to **Supabase Dashboard → Authentication → Email Templates → Reset Password**

Replace the template with this:

```html
<h2>Reset Password</h2>

<p>Follow this link to reset your password:</p>

<p>
  <a href="{{ .SiteURL }}/auth/reset-password?token={{ .Token }}&type=recovery"
    >Reset Password</a
  >
</p>

<p>Or copy and paste this URL into your browser:</p>

<p>{{ .SiteURL }}/auth/reset-password?token={{ .Token }}&type=recovery</p>

<p>This link will expire in 1 hour for security.</p>
```

**What changed:**

- Instead of `{{ .ConfirmationURL }}`, we build a custom URL
- Directs users to `/auth/reset-password` page directly
- Includes the token that will be verified by our handler

### Option 2: Configure Redirect URL in Supabase

1. Go to **Supabase Dashboard → Authentication → URL Configuration**
2. Under **Redirect URLs**, add:
   ```
   https://watzy.app/auth/reset-password**
   ```
3. Update the email template to use:
   ```html
   <a
     href="{{ .SiteURL }}/auth/v1/verify?token={{ .Token }}&type=recovery&redirect_to={{ .SiteURL }}/auth/reset-password"
     >Reset Password</a
   >
   ```

### Option 3: Use PKCE Flow (Most Secure)

The PKCE (Proof Key for Code Exchange) flow is more secure. Update the template to:

```html
<h2>Reset Password</h2>

<p>Follow this link to reset your password:</p>

<p>
  <a
    href="{{ .ConfirmationURL }}&redirect_to={{ .SiteURL }}/auth/reset-password"
    >Reset Password</a
  >
</p>
```

This tells Supabase to redirect to the reset password page after verification.

## Verification Steps

After updating:

1. ✅ Go to `/auth/forgot-password`
2. ✅ Enter your email
3. ✅ Check email for reset link
4. ✅ Click the link
5. ✅ Verify you land on `/auth/reset-password` page
6. ✅ Verify the page shows "Reset Password" form (not invalid session error)
7. ✅ Enter new password and confirm it works

## Current Handler Status

Your app already has these handlers in place:

1. **AuthRedirectHandler** (on homepage): Processes tokens in URL hash and redirects recovery type to `/auth/reset-password`
2. **ResetPasswordClient**: Shows password reset form when user has valid session

## Quick Test Command

After updating the template, test the flow:

```bash
# 1. Request password reset
# 2. Check email
# 3. Click link
# 4. Should land on reset password page
```

## Troubleshooting

**Still landing on homepage?**

- Clear browser cache
- Try incognito/private browsing
- Check Supabase logs for redirect errors
- Verify Site URL is set to `https://watzy.app`

**"Invalid session" error?**

- Token may have expired (1 hour limit)
- Request a new password reset link
- Check browser console for errors

**Email not arriving?**

- Check spam folder
- Verify email is confirmed in Supabase
- Check Supabase email logs

---

**Status:** Ready to implement  
**Priority:** 🔴 Critical  
**Last Updated:** November 20, 2025
