# 🔧 Supabase Email Template - Hardcoded URL Fix

## The Problem
Despite updating Site URL in Supabase settings, it's still cached as `0.0.0.0:5000`.

## Solution: Hardcode the Replit URL in Email Template

### Step 1: Go to Email Templates

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select project: **iazdsuodmyymclqltenc**
3. Click **Authentication** → **Email Templates**
4. Select **"Magic Link"** from dropdown

### Step 2: Replace the ENTIRE Template

**Delete everything** and paste this complete template:

```html
<h2>Magic Link</h2>

<p>Follow this link to login:</p>
<p>
  <a href="https://2ccc205f-0a53-480b-b845-5fb6eea230fc-00-1ar38554f9xuf.janeway.replit.dev/auth/confirm?token_hash={{ .TokenHash }}&type=email">
    Log In
  </a>
</p>

<p>Or copy and paste this URL into your browser:</p>
<p>https://2ccc205f-0a53-480b-b845-5fb6eea230fc-00-1ar38554f9xuf.janeway.replit.dev/auth/confirm?token_hash={{ .TokenHash }}&type=email</p>
```

**Important:** 
- This uses `{{ .TokenHash }}` which works regardless of Site URL
- The Replit URL is hardcoded
- This bypasses Supabase's cached Site URL

### Step 3: Save the Template

Click **"Save"** at the bottom of the page.

### Step 4: Test with Fresh Magic Link

1. Go to your app: `/auth`
2. Request a new magic link
3. Check the NEW email
4. The link should now go to your Replit URL, not `0.0.0.0:5000`

---

## Alternative: Check Additional Auth Settings

If the above doesn't work, there might be a hidden setting:

1. In Supabase Dashboard → **Authentication** → **Settings**
2. Look for **"Additional Redirect URLs"** or **"Email Settings"**
3. Check if there's a separate field for email redirect URL
4. Make sure NO field contains `0.0.0.0` or `localhost`

---

This should finally fix the redirect issue!
