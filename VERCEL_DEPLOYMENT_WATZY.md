# 🚀 Deploy watzy to Vercel with Custom Domain

This guide will help you deploy your watzy WhatsApp store platform to Vercel and configure the custom domain `watzy.app`.

## Prerequisites

- ✅ A Vercel account (free at [vercel.com](https://vercel.com))
- ✅ Domain `watzy.app` purchased and accessible
- ✅ Supabase project with all environment variables
- ✅ Razorpay account credentials

## Quick Fix for "No Production Deployment" Error

If you see the message: "Your domain is properly configured, but you don't have a production deployment", follow these steps:

### **Immediate Solution - Install Vercel CLI and Deploy:**

```powershell
# 1. Install Vercel CLI globally
npm install -g vercel

# 2. Navigate to your project directory
cd "c:\My Projects\whatsapp-store-creator-1\whatsapp-store-creator-1"

# 3. Login to Vercel (if not already logged in)
vercel login

# 4. Deploy to production
vercel --prod
```

### **Alternative - Deploy via Git Push:**

```bash
# 1. Commit your latest changes
git add .
git commit -m "Deploy watzy to production"

# 2. Push to main branch (triggers automatic deployment)
git push origin main
```

## Step 1: Prepare Your Project

### 1.1 Create Vercel Configuration

Create a `vercel.json` file in your project root with optimal settings:

```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "regions": ["bom1"],
  "functions": {
    "app/api/**": {
      "maxDuration": 30
    }
  },
  "crons": []
}
```

### 1.2 Update Environment Variables

Ensure your `.env.local` contains all required variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id

# App Settings
NEXT_PUBLIC_APP_URL=https://watzy.app
```

## Step 2: Deploy to Vercel

### 2.1 Method 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
cd "c:\My Projects\whatsapp-store-creator-1\whatsapp-store-creator-1"
vercel

# Follow the prompts:
# - Link to existing project? No
# - What's your project's name? watzy
# - In which directory is your code located? ./
# - Want to modify settings? No
```

### 2.2 Method 2: GitHub Integration

1. **Push to GitHub:**

   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure build settings:
     - Framework Preset: Next.js
     - Build Command: `pnpm build`
     - Install Command: `pnpm install`

## Step 3: Configure Environment Variables in Vercel

### 3.1 Via Vercel Dashboard

1. Go to your project dashboard
2. Click "Settings" → "Environment Variables"
3. Add all variables from your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_value
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_value
SUPABASE_SERVICE_ROLE_KEY=your_value
RAZORPAY_KEY_ID=your_value
RAZORPAY_KEY_SECRET=your_value
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_value
NEXT_PUBLIC_APP_URL=https://watzy.app
```

### 3.2 Via Vercel CLI

```bash
# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add RAZORPAY_KEY_ID production
vercel env add RAZORPAY_KEY_SECRET production
vercel env add NEXT_PUBLIC_RAZORPAY_KEY_ID production
vercel env add NEXT_PUBLIC_APP_URL production
```

## Step 4: Configure Custom Domain

### 4.1 Add Domain in Vercel

1. **Via Dashboard:**

   - Go to Project Settings → Domains
   - Add `watzy.app`
   - Add `www.watzy.app` (optional)

2. **Via CLI:**
   ```bash
   vercel domains add watzy.app
   vercel domains add www.watzy.app
   ```

### 4.2 Update DNS Settings

Configure your domain's DNS settings with your domain registrar:

**For watzy.app:**

- Type: `A`
- Name: `@`
- Value: `76.76.19.19`

**For www.watzy.app:**

- Type: `CNAME`
- Name: `www`
- Value: `cname.vercel-dns.com`

**Alternative (if A record doesn't work):**

- Type: `CNAME`
- Name: `@`
- Value: `cname.vercel-dns.com`

### 4.3 Verify Domain

```bash
# Check domain status
vercel domains ls

# Force domain verification
vercel domains verify watzy.app
```

## Step 5: Update Application Configuration

### 5.1 Update Supabase Auth Settings

In your Supabase dashboard:

1. Go to Authentication → Settings
2. Update Site URL: `https://watzy.app`
3. Add Redirect URLs:
   - `https://watzy.app/auth/callback`
   - `https://www.watzy.app/auth/callback`

### 5.2 Update Razorpay Settings

In Razorpay dashboard:

1. Go to Settings → API Keys
2. Update website URL to `https://watzy.app`
3. Add webhooks endpoint: `https://watzy.app/api/razorpay/webhook`

## Step 6: Test Deployment

### 6.1 Verify Core Functionality

1. **Homepage:** https://watzy.app
2. **Authentication:** https://watzy.app/auth
3. **Dashboard:** https://watzy.app/dashboard
4. **Demo Store:** https://watzy.app/demo-bakery
5. **Contact:** https://watzy.app/contact

### 6.2 Test Features

- [ ] User registration/login
- [ ] Store creation
- [ ] Product management
- [ ] Order processing
- [ ] Payment integration
- [ ] WhatsApp integration
- [ ] Contact form submission

## Step 7: Performance Optimization

### 7.1 Enable Analytics

```bash
# Add Vercel Analytics
vercel --analytics
```

### 7.2 Configure Caching

Add to `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/webp", "image/avif"],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
      ],
    },
  ],
};

module.exports = nextConfig;
```

## Step 8: Set Up Monitoring

### 8.1 Vercel Functions Monitoring

- Monitor API routes in Vercel dashboard
- Set up alerts for failed deployments
- Monitor performance metrics

### 8.2 Uptime Monitoring

Consider services like:

- UptimeRobot
- Pingdom
- StatusCake

## Troubleshooting

### Common Issues

1. **Domain not propagating:**

   - Wait 24-48 hours for DNS propagation
   - Clear DNS cache: `ipconfig /flushdns`

2. **Environment variables not working:**

   - Redeploy after adding variables
   - Check variable names match exactly

3. **Build failures:**

   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in package.json

4. **API routes failing:**
   - Verify environment variables are set
   - Check function logs in Vercel dashboard

### Quick Fixes

```bash
# Redeploy with latest changes
vercel --prod

# Check deployment logs
vercel logs

# Check domain status
vercel domains ls
```

## Final Checklist

- [ ] Project deployed to Vercel
- [ ] Environment variables configured
- [ ] Custom domain `watzy.app` added and verified
- [ ] DNS settings updated
- [ ] Supabase auth URLs updated
- [ ] Razorpay settings updated
- [ ] All features tested on production
- [ ] Performance optimizations applied
- [ ] Monitoring set up

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Verify DNS propagation: https://whatsmydns.net
3. Test API endpoints directly
4. Contact Vercel support if needed

Your watzy platform should now be live at https://watzy.app! 🎉
