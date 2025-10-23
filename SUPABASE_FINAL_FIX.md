# 🔧 Final Supabase Configuration Fix

## The Problem
The Site URL in Supabase needs to be set to your **complete** Replit URL, not truncated or incomplete.

## Step-by-Step Fix

### 1. Go to Supabase URL Configuration
1. Open: https://supabase.com/dashboard
2. Select your project: **iazdsuodmyymclqltenc**
3. Click **Authentication** → **URL Configuration**

### 2. Update Site URL (CRITICAL)

In the **Site URL** field, paste this EXACT URL:

```
https://2ccc205f-0a53-480b-b845-5fb6eea230fc-00-1ar38554f9xuf.janeway.replit.dev
```

**Important:**
- Must be the COMPLETE URL
- No truncation (not just `https://2ccc205f-0a53-4i...`)
- Must start with `https://`
- Must end with `.janeway.replit.dev`
- NO `0.0.0.0` or `:5000` anywhere

### 3. Verify Redirect URLs

In the **Redirect URLs** section, you should have:

```
https://2ccc205f-0a53-480b-b845-5fb6eea230fc-00-1ar38554f9xuf.janeway.replit.dev/**
```

This allows all paths on your domain.

### 4. Click "Save changes"

Make sure to click the green **"Save changes"** button!

### 5. Clear the Cache (Important!)

Sometimes Supabase caches the old URL. To force a refresh:

1. Change Site URL to: `https://example.com`
2. Click **"Save changes"**
3. Wait 10 seconds
4. Change it back to your Replit URL: `https://2ccc205f-0a53-480b-b845-5fb6eea230fc-00-1ar38554f9xuf.janeway.replit.dev`
5. Click **"Save changes"** again

### 6. Request a NEW Magic Link

**CRITICAL:** Old magic links won't work because they were generated with the wrong URL.

1. Go to: `/auth`
2. Enter your email
3. Click "Send Magic Link"
4. Check your inbox for the NEW email
5. Click the NEW link (ignore old emails)

---

## Verification

After clicking the new magic link, you should:
1. Be redirected to your Replit app (NOT `0.0.0.0:5000`)
2. See the URL: `https://2ccc205f-0a53-480b-b845-5fb6eea230fc-00-1ar38554f9xuf.janeway.replit.dev/dashboard`
3. Be logged in and see the onboarding wizard

---

## If It Still Doesn't Work

If you still see `0.0.0.0:5000` in the error URL:

1. **Double-check** the Site URL field in Supabase - scroll to the end of the input to make sure it's complete
2. Try the cache clearing steps again (steps 5 above)
3. Wait 5 minutes for Supabase's servers to update
4. Request another fresh magic link

---

## Email Template (Optional)

If you want to verify the email template is correct:

1. Go to **Authentication** → **Email Templates**
2. Select **"Magic Link"**
3. Find the link in the template:
   ```html
   <a href="{{ .ConfirmationURL }}">Log In</a>
   ```
4. This should automatically use the correct Site URL

---

This should resolve the authentication issue once and for all!
