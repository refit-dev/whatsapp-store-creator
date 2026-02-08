# Fix: Magic Link Redirect Issue

## Problem

Magic links from Supabase are redirecting to a Replit dev URL instead of your actual domain (watzy.app).

## Root Cause

The **Site URL** in your Supabase project is configured to the wrong domain.

## Solution

### Step 1: Update Supabase Site URL

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/YOUR-PROJECT-ID

2. **Open Authentication Settings**
   - Click on **Authentication** in the left sidebar
   - Go to **URL Configuration**

3. **Update Site URL**
   - Find the **Site URL** field
   - Change from: `https://2ccc205f-0a53-480b-b845-5fb6eea230fc-00-1ar38554f9xuf.janeway.replit.dev`
   - Change to: `https://watzy.app`
   - Click **Save**

### Step 2: Configure Redirect URLs

In the same **URL Configuration** section:

1. **Add Redirect URLs** (one per line):

   ```
   https://watzy.app/**
   https://watzy.app/auth/callback
   https://watzy.app/auth/confirm
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/confirm
   ```

2. Click **Save**

### Step 3: Verify Environment Variables

Your `.env.local` is correct:

```env
NEXT_PUBLIC_APP_URL=https://watzy.app
```

For Vercel deployment, ensure these environment variables are set:

**Production Environment:**

```
APP_URL=https://watzy.app
NEXT_PUBLIC_APP_URL=https://watzy.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Preview/Development Environment:**

```
APP_URL=https://your-preview-url.vercel.app
NEXT_PUBLIC_APP_URL=https://your-preview-url.vercel.app
```

### Step 4: Test the Fix

1. **Request a new magic link**
   - Go to your login page
   - Enter your email
   - Click "Send Magic Link"

2. **Check your email**
   - The link should now point to `https://watzy.app/auth/confirm?token_hash=...`

3. **Click the link**
   - Should redirect to your actual domain
   - Should log you in successfully

## Why This Happened

The Replit URL suggests that:

1. You may have initially developed/tested on Replit
2. The Supabase Site URL was set during that time
3. The URL was never updated after moving to production

## Additional Notes

### If Using Custom Domain on Vercel

If you're using a custom domain on Vercel (watzy.app), make sure:

1. Domain DNS is properly configured
2. SSL certificate is active
3. Domain is set as primary in Vercel project settings

### For Local Development

When testing locally, magic links will use `http://localhost:3000` because:

- Your local `.env.local` has `APP_URL=http://localhost:3000`
- Supabase uses the `APP_URL` from the request origin
- The **Redirect URLs** list includes localhost URLs

### Email Templates (Optional Enhancement)

You can also customize the email template in Supabase:

1. Go to **Authentication → Email Templates**
2. Select **Magic Link**
3. Customize the template if needed
4. The `{{ .ConfirmationURL }}` variable will now use the correct Site URL

## Verification Checklist

- [ ] Site URL updated in Supabase to `https://watzy.app`
- [ ] Redirect URLs added to Supabase allowlist
- [ ] Environment variables correct in Vercel
- [ ] Custom domain (watzy.app) is active and SSL working
- [ ] Test magic link sent and received
- [ ] Test magic link redirect works correctly
- [ ] Test login completes successfully

## If Problem Persists

1. **Clear browser cache and cookies**
2. **Check Supabase logs:**
   - Go to Supabase Dashboard → Logs
   - Check for any authentication errors

3. **Verify DNS:**

   ```bash
   nslookup watzy.app
   ```

4. **Check Vercel deployment:**
   - Ensure latest code is deployed
   - Check deployment logs for errors
   - Verify environment variables are set

5. **Test with incognito/private window**

## Support Links

- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- Supabase URL Configuration: https://supabase.com/docs/guides/auth/redirect-urls
- Vercel Environment Variables: https://vercel.com/docs/environment-variables

---

**Last Updated:** November 19, 2025
**Status:** Ready to implement
**Priority:** 🔴 High - Affects user authentication
