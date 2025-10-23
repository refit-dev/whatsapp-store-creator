# 🚀 Vercel + Supabase Configuration Guide

## Overview

This guide will help you migrate from Replit to Vercel deployment and configure Supabase authentication properly.

## Step 1: Deploy to Vercel

### 1.1 Deploy Your App

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project" → Import your repository
4. Configure environment variables (see Step 2)
5. Deploy!

### 1.2 Note Your Vercel Domain

After deployment, you'll get a URL like:

- `https://your-app-name.vercel.app` (production)
- `https://your-app-name-git-main-username.vercel.app` (preview)

## Step 2: Configure Environment Variables in Vercel

### 2.1 In Vercel Dashboard

1. Go to your project → Settings → Environment Variables
2. Add these variables:

```bash
# Supabase (same as before)
NEXT_PUBLIC_SUPABASE_URL=https://iazdsuodmyymclqltenc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URL (NEW - use your Vercel domain)
APP_URL=https://your-app-name.vercel.app

# Vercel Blob Storage (NEW)
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# Payment providers (optional)
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

## Step 3: Update Supabase Authentication URLs

### 3.1 Go to Supabase Dashboard

1. Open: https://supabase.com/dashboard
2. Select your project: **iazdsuodmyymclqltenc**
3. Click **Authentication** → **URL Configuration**

### 3.2 Update Site URL

**CRITICAL:** Replace the old Replit URL with your Vercel URL

**OLD (Replit):**

```
https://2ccc205f-0a53-480b-b845-5fb6eea230fc-00-1ar38554f9xuf.janeway.replit.dev
```

**NEW (Vercel):**

```
https://your-app-name.vercel.app
```

### 3.3 Update Redirect URLs

In the **Redirect URLs** section, add:

```
https://your-app-name.vercel.app/**
```

This allows all paths on your Vercel domain.

### 3.4 Save Changes

Click the green **"Save changes"** button!

## Step 4: Setup Vercel Blob Storage

### 4.1 Enable Blob Storage

1. In Vercel Dashboard → Your Project → Storage
2. Click "Create Database" → Select "Blob"
3. Follow the setup process
4. Copy the `BLOB_READ_WRITE_TOKEN` to your environment variables

### 4.2 Update Your App

The app has been updated to use Vercel Blob instead of Supabase Storage for image uploads. This provides:

- ✅ Better performance
- ✅ Automatic CDN
- ✅ Simple integration
- ✅ No bucket setup required

## Step 5: Test Authentication

### 5.1 Clear Cache

**Important:** Clear browser cache or use incognito mode to avoid cached redirects.

### 5.2 Test Magic Link

1. Go to: `https://your-app-name.vercel.app/auth`
2. Enter your email
3. Click "Send Magic Link"
4. Check your email for the NEW magic link
5. Click the link - you should be redirected to your Vercel app (NOT Replit)

### 5.3 Verify Success

After clicking the magic link, you should:

1. Be redirected to: `https://your-app-name.vercel.app/dashboard`
2. Be logged in and see the dashboard
3. No errors about `0.0.0.0:5000` or Replit URLs

## Step 6: Update Webhook URLs (If Using Payments)

### 6.1 Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Update endpoint URL to: `https://your-app-name.vercel.app/api/stripe/webhook`

### 6.2 Razorpay Webhooks

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Update endpoint URL to: `https://your-app-name.vercel.app/api/razorpay/webhook`

## Troubleshooting

### Magic Link Still Goes to Replit

1. Double-check the Site URL in Supabase (make sure it's complete)
2. Clear browser cache completely
3. Try incognito/private browsing mode
4. Request a NEW magic link (old ones cache the old URL)

### Image Uploads Not Working

1. Verify `BLOB_READ_WRITE_TOKEN` is set in Vercel environment variables
2. Check Vercel Dashboard → Storage → Blob is enabled
3. Redeploy after adding environment variables

### Environment Variables Not Working

1. Make sure to redeploy after adding environment variables in Vercel
2. Check spelling of variable names (case-sensitive)
3. Verify no trailing spaces in values

## Success Checklist

- [ ] App deployed to Vercel
- [ ] Environment variables configured in Vercel
- [ ] Supabase Site URL updated to Vercel domain
- [ ] Magic link authentication works with Vercel URL
- [ ] Image uploads work with Vercel Blob
- [ ] Payment webhooks updated (if applicable)

---

🎉 **You're all set!** Your WhatsApp Store is now running on Vercel with improved performance and storage.
