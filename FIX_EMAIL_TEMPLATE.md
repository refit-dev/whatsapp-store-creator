# 🔧 Fix Magic Link Email Template in Supabase

## The Problem
Your Supabase email template still has `0.0.0.0:5000` hardcoded, even though you updated the Site URL. This is because email templates don't automatically update when you change the Site URL.

---

## Solution: Update the Email Template

### Step 1: Go to Email Templates

1. Open **Supabase Dashboard**: https://supabase.com/dashboard
2. Click on your project: **iazdsuodmyymclqltenc**
3. Click **"Authentication"** in the left sidebar
4. Click **"Email Templates"**

### Step 2: Select Magic Link Template

In the dropdown at the top, select **"Magic Link"**

### Step 3: Find the Problem Line

Scroll down in the template editor and find this line (usually around line 40-50):

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">
  Log in
</a>
```

OR it might look like:
```html
<a href="{{ .ConfirmationURL }}">Log in</a>
```

### Step 4: Replace with the Correct URL

**Option A (Recommended - Dynamic):**
Replace the line with:
```html
<a href="{{ .ConfirmationURL }}">Log in</a>
```

This automatically uses your configured redirect URL.

**Option B (Fixed URL):**
If Option A doesn't work, hardcode your Replit URL:
```html
<a href="https://2ccc205f-0a53-480b-b845-5fb6eea230fc-00-1ar38554f9xuf.janeway.replit.dev/auth/callback?token_hash={{ .TokenHash }}&type=email">
  Log in
</a>
```

### Step 5: Save the Template

Click **"Save"** at the bottom right of the template editor.

### Step 6: Test

1. Go back to your app
2. Sign out if logged in
3. Request a new magic link
4. Check the email - the link should now have your correct Replit URL!
5. Click the link - you should be redirected to your dashboard ✅

---

## Alternative: Reset to Default Template

If the template is corrupted or you want to start fresh:

1. In the Email Templates page
2. Click **"Revert to default"** button
3. This will reset to Supabase's default template
4. Then the `{{ .SiteURL }}` variable will use your configured Site URL correctly

---

## Verification

After updating, request a new magic link and check the email source (View → Source in Gmail):
- The link should contain your Replit URL
- NOT `0.0.0.0:5000`
- NOT `localhost:3000`

---

## Still Having Issues?

If the problem persists after updating the template:

1. **Clear Supabase cache**:
   - Change Site URL to `https://example.com`
   - Save
   - Wait 30 seconds
   - Change back to your Replit URL
   - Save again

2. **Check all templates**:
   - Confirm signup
   - Invite user
   - Magic Link
   - Make sure all use the correct URL

3. **Contact Supabase Support** if the issue persists - there might be a caching issue on their end.

---

This should fix the magic link redirect issue!
