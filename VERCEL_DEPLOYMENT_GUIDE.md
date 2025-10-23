# 📦 Complete Vercel Deployment Guide

## Overview

This guide provides complete instructions to deploy your WhatsApp Micro-Store on Vercel with proper Supabase integration and Vercel Blob storage for images.

## Part 1: Prepare Your Project

### 1.1 Commit Your Changes

```bash
git add .
git commit -m "Migrate from Replit to Vercel with Blob storage"
git push origin main
```

### 1.2 Verify Dependencies

Your `package.json` should include:

- `@vercel/blob` - for image storage
- `@supabase/supabase-js` - for database
- All other existing dependencies

## Part 2: Deploy to Vercel

### 2.1 Initial Deployment

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"New Project"**
3. Import your repository
4. Configure project settings:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (if not auto-detected)
   - **Build Command:** `pnpm build` (or leave default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `pnpm install` (or leave default)

### 2.2 Environment Variables Setup

Before deploying, add these environment variables in Vercel:

**Essential Variables:**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://iazdsuodmyymclqltenc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
APP_URL=https://your-app-name.vercel.app
```

**Vercel Blob Storage:**

```bash
BLOB_READ_WRITE_TOKEN=your-blob-token-here
```

**Payment Providers (Optional):**

```bash
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-webhook-secret
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

### 2.3 Deploy

Click **"Deploy"** and wait for the build to complete.

## Part 3: Setup Vercel Blob Storage

### 3.1 Enable Blob Storage

1. In your Vercel Dashboard, go to your project
2. Navigate to **Storage** tab
3. Click **"Create Database"** → **"Blob"**
4. Follow the setup wizard
5. Copy the **Read & Write Token** that's generated

### 3.2 Add Token to Environment Variables

1. In Vercel Dashboard → Project → Settings → Environment Variables
2. Add: `BLOB_READ_WRITE_TOKEN` with the token value
3. **Important:** Redeploy after adding this variable

## Part 4: Configure Supabase Authentication

### 4.1 Get Your Vercel URL

After deployment, note your Vercel URLs:

- **Production:** `https://your-app-name.vercel.app`
- **Preview:** `https://your-app-name-git-main-username.vercel.app`

### 4.2 Update Supabase Settings

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **iazdsuodmyymclqltenc**
3. Navigate to **Authentication** → **URL Configuration**

**Site URL:** Set to your production Vercel URL

```
https://your-app-name.vercel.app
```

**Redirect URLs:** Add both production and preview URLs

```
https://your-app-name.vercel.app/**
https://your-app-name-git-main-username.vercel.app/**
```

### 4.3 Save and Test

1. Click **"Save changes"** in Supabase
2. Wait 2-3 minutes for changes to propagate
3. Test authentication by visiting `/auth` on your Vercel app

## Part 5: Setup Payment Webhooks (If Applicable)

### 5.1 Stripe Webhooks

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks
2. Create new webhook endpoint:
   - **URL:** `https://your-app-name.vercel.app/api/stripe/webhook`
   - **Events:** `checkout.session.completed`
3. Copy the **Signing Secret** to your Vercel environment variables

### 5.2 Razorpay Webhooks

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com) → Settings → Webhooks
2. Create new webhook:
   - **URL:** `https://your-app-name.vercel.app/api/razorpay/webhook`
   - **Events:** `payment.captured`
3. Copy the **Secret** to your Vercel environment variables

## Part 6: Verification & Testing

### 6.1 Test Core Functionality

- [ ] Home page loads correctly
- [ ] Demo store (`/demo-bakes`) shows products
- [ ] Authentication works (magic link goes to Vercel, not Replit)
- [ ] Dashboard loads after login
- [ ] Can create new store
- [ ] Image upload works (uses Vercel Blob, not Supabase Storage)

### 6.2 Test Image Uploads

1. Login to your dashboard
2. Go to Products → Add Product
3. Upload an image file
4. Verify it uploads successfully and shows in the preview
5. Check that the image URL starts with a Vercel Blob URL

### 6.3 Test WhatsApp Integration

1. Go to any storefront
2. Add items to cart
3. Proceed to checkout
4. Verify WhatsApp link opens correctly with order details

## Part 7: Domain Configuration (Optional)

### 7.1 Add Custom Domain

1. In Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### 7.2 Update Supabase with Custom Domain

1. Update Site URL to `https://yourdomain.com`
2. Update Redirect URLs to `https://yourdomain.com/**`
3. Update `APP_URL` environment variable in Vercel

## Troubleshooting

### Authentication Issues

**Problem:** Magic links still redirect to Replit
**Solution:**

1. Verify Site URL in Supabase is exactly your Vercel domain
2. Clear browser cache completely
3. Test in incognito mode
4. Request new magic link (old ones cache the old URL)

### Image Upload Issues

**Problem:** Images not uploading
**Solution:**

1. Check `BLOB_READ_WRITE_TOKEN` is set correctly in Vercel
2. Verify Blob storage is enabled in Vercel Dashboard
3. Check browser console for API errors
4. Redeploy after adding environment variables

### Environment Variable Issues

**Problem:** Environment variables not working
**Solution:**

1. Verify variable names are spelled correctly (case-sensitive)
2. Redeploy after adding/changing variables
3. Check both `NEXT_PUBLIC_` variables are accessible in browser
4. Verify server-only variables don't have `NEXT_PUBLIC_` prefix

### Build Issues

**Problem:** Build fails during deployment
**Solution:**

1. Check all TypeScript errors are resolved
2. Verify all dependencies are in `package.json`
3. Check build logs in Vercel Dashboard
4. Test build locally: `pnpm build`

## Migration Checklist

- [ ] Code deployed to Vercel successfully
- [ ] All environment variables configured
- [ ] Vercel Blob storage enabled and token added
- [ ] Supabase Site URL updated to Vercel domain
- [ ] Supabase Redirect URLs include Vercel domains
- [ ] Authentication tested (magic link works)
- [ ] Image uploads tested (using Vercel Blob)
- [ ] Payment webhooks updated (if applicable)
- [ ] Demo store works on new domain
- [ ] Custom domain configured (if desired)

## Key Differences from Replit

| Aspect          | Replit              | Vercel          |
| --------------- | ------------------- | --------------- |
| **Port**        | 5000                | 3000 (default)  |
| **Host**        | 0.0.0.0             | localhost       |
| **Storage**     | Supabase Storage    | Vercel Blob     |
| **Environment** | Replit Secrets      | Vercel Env Vars |
| **Domain**      | .janeway.replit.dev | .vercel.app     |
| **Deployment**  | Automatic           | Git push        |
| **Build**       | Container           | Serverless      |

## Performance Benefits

✅ **Faster Global CDN** - Vercel's edge network  
✅ **Better Image Optimization** - Vercel Blob integration  
✅ **Serverless Functions** - Better scaling  
✅ **Built-in Analytics** - Vercel Dashboard  
✅ **Automatic HTTPS** - SSL certificates  
✅ **Branch Previews** - Test before production

---

🎉 **Congratulations!** Your WhatsApp Store is now running on Vercel with improved performance, reliability, and storage capabilities.
