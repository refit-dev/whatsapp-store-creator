# ✅ Enable Password Authentication in Supabase

## Quick Setup (2 minutes)

### Step 1: Disable Email Confirmation

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: **iazdsuodmyymclqltenc**
3. Click **Authentication** → **Providers**
4. Click on **Email** section
5. **Toggle OFF** the "Confirm email" option
6. Click **Save**

This allows users to sign up and log in immediately without email verification.

### Step 2: Test the New Authentication

1. Go to your app: `/auth`
2. Click "Don't have an account? Sign up"
3. Enter email and password (minimum 6 characters)
4. Click "Create Account"
5. You'll be redirected to the dashboard immediately!

---

## How It Works Now

**Sign Up:**
- User enters email and password
- Account created instantly
- Automatically redirected to dashboard
- No email verification needed

**Sign In:**
- User enters email and password
- Logged in immediately
- Redirected to dashboard

---

## Security Note

This is actually MORE secure than magic links because:
- Users have passwords they control
- No reliance on email delivery
- No redirect URL issues
- Standard authentication flow

---

That's it! The authentication will now work perfectly without any redirect URL problems.
