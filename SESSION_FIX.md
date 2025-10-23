# 🔧 FIX: Invalid Session Error

## The Problem
You're seeing: **"User from sub claim in JWT does not exist"**

This happens when you have an old session cookie from a test user that was deleted from the database.

## Quick Fix - Clear Your Session

### Option 1: Clear Browser Data (Fastest)
1. Open your browser's developer tools (F12 or right-click → Inspect)
2. Go to the **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Find **Cookies** in the left sidebar
4. Find your app's domain
5. Delete all cookies starting with `sb-`
6. Refresh the page

### Option 2: Use the Clear Session Endpoint
Visit this URL in your browser:
```
http://localhost:5000/api/clear-session
```
This will clear your session and redirect you to the sign-in page.

### Option 3: Incognito/Private Window
Open your app in an incognito/private browser window - it will have no cookies.

---

## What I Fixed

I've added better error handling so this won't crash your app in the future:

1. **middleware.ts** - Now detects invalid JWT errors and automatically clears them
2. **lib/auth.ts** - Returns `null` for invalid users instead of throwing errors
3. **api/clear-session** - New endpoint to manually clear sessions

The app will now gracefully handle these situations and redirect to the sign-in page.

---

## Prevention

This typically happens during development when you:
- Delete users from Supabase dashboard
- Reset your database
- Switch between different Supabase projects

The fixes I've added will handle this automatically going forward!