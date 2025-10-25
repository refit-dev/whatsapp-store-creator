# Razorpay Setup Instructions

## Complete Subscription System Setup

Your subscription system with referral rewards is now fully implemented! Here's what's been added:

### ✅ Features Implemented

1. **30-Day Free Trial** - Automatically given to new users
2. **₹259 Monthly Subscription** - After trial period
3. **Referral System** - Get 1 month free for each successful referral
4. **Razorpay Integration** - Secure payment processing
5. **Dashboard Integration** - Subscription status and referral banner

### 🚀 What You Need to Do

#### 1. Run the Database Setup

Execute the SQL in `setup_subscription_system.sql` in your Supabase SQL Editor:

- Creates subscription tables and functions
- Sets up RLS policies
- Updates demo store WhatsApp number to +91-7304848472
- Creates automatic trial assignment for new users

#### 2. Setup Razorpay Account

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Create account or login
3. Go to Settings > API Keys
4. Copy your Key ID and Key Secret

#### 3. Update Environment Variables

In your `.env.local` file, uncomment and fill in:

```bash
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
```

#### 4. Test the System

1. Visit http://localhost:3000/dashboard
2. You should see:
   - Subscription status banner
   - Referral banner with "Generate My Referral Code" button
   - Your dashboard now shows subscription info

### 🎯 How It Works

#### For New Users:

1. Sign up → Automatically get 30-day free trial
2. See subscription status on dashboard
3. Generate referral code to share with friends
4. After trial ends, pay ₹259/month to continue

#### For Referrals:

1. Share your referral link: `yourstore.com?ref=YOUR_CODE`
2. When someone signs up using your link:
   - They get their 30-day trial
   - You get an extra 30 days added to your subscription!
3. Track your successful referrals on the dashboard

### 📱 Referral Sharing

The system provides two sharing options:

1. **Copy Link** - Direct referral URL
2. **Copy Message** - Pre-written WhatsApp message with your referral link

### 💡 Next Steps

1. Run the SQL setup
2. Add Razorpay credentials
3. Test with a friend using your referral code
4. Monitor subscriptions and referrals in your dashboard

The system is production-ready and will handle:

- Automatic trial expiration
- Payment processing with Razorpay
- Referral tracking and rewards
- Subscription renewals

Your WhatsApp Micro-Store now has a complete monetization system! 🎉
