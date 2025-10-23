# 🚀 Setup Guide for WhatsApp Micro-Store

Your app is now running on Replit! Follow these simple steps to complete the setup:

## Step 1: Set Up Your Database (One-Time Setup)

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard

2. **Open the SQL Editor**:
   - Click on your project
   - Navigate to "SQL Editor" in the left sidebar
   - Click "+ New query"

3. **Run the Setup Script**:
   - Open the file `SETUP_DATABASE.sql` in this Replit project
   - Copy ALL the content
   - Paste it into the Supabase SQL Editor
   - Click "Run" (or press Ctrl/Cmd + Enter)

4. **Verify Success**:
   - You should see a success message showing:
     - `total_stores: 1`
     - `active_products: 6`
     - `public_stores: 1`

## Step 2: Test Your App

### Test the Demo Store:
1. Click on "View Demo Store" from the homepage
2. You should see a bakery with 6 products (all with beautiful food images)
3. Try adding products to cart
4. Click the floating cart button
5. Go to checkout and fill in your details
6. Click "Order on WhatsApp" (it will generate a WhatsApp link)

### Create Your Own Store:
1. Click "Sign in / Sign up"
2. Enter your email and click "Send Magic Link"
3. Check your email and click the link
4. You'll see a welcome screen with onboarding instructions
5. Click "Create Your Store"
6. Fill in your store details (name, WhatsApp number, etc.)
7. Add your products
8. Share your store link with customers!

## Step 3: Share Your Store

Once you create your store, you'll see:
- **Copy Link** button - copies your store URL to clipboard
- **Share on WhatsApp** button - shares your store link via WhatsApp

Your store URL will be:
```
https://your-repl-name.repl.co/your-store-handle
```

## Features You Can Use Now

✅ Beautiful landing page
✅ Demo store with real product images
✅ Add to cart functionality
✅ Checkout with WhatsApp integration
✅ Dashboard with onboarding
✅ Store link sharing
✅ Responsive design (works on mobile!)
✅ Order management
✅ Product management

## Optional: Enable Payments

If you want to add Stripe or Razorpay payment links:

1. Get your API keys from:
   - Stripe: https://dashboard.stripe.com/apikeys
   - Razorpay: https://dashboard.razorpay.com/app/keys

2. Add them to Replit Secrets:
   - Click "Tools" → "Secrets" in Replit
   - Add: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - Or: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`

3. Configure in your store settings

## Need Help?

- Your app is running at: Check the webview in Replit
- Supabase Dashboard: https://supabase.com/dashboard
- Replit Secrets: Tools → Secrets in the left sidebar

## What's Different from Vercel?

- ✅ Server runs on port 5000 (Replit requirement)
- ✅ Host set to 0.0.0.0 for proper proxy
- ✅ Environment variables managed via Replit Secrets
- ✅ Auto-deployment configured for production

Enjoy your WhatsApp Micro-Store! 🎉
