# Razorpay Subscription Setup for Watzy

## Overview

This guide helps you set up Razorpay subscription payments for watzy's ₹259/month Pro Plan instead of one-time payments.

## Why Subscription Payments?

- ✅ **Automatic Recurring Billing**: No need for users to manually pay each month
- ✅ **Better Cash Flow**: Predictable monthly revenue
- ✅ **Reduced Churn**: Automatic renewals reduce cancellations
- ✅ **Professional Experience**: Industry-standard subscription model
- ✅ **Dunning Management**: Automatic retry for failed payments

## Razorpay Dashboard Setup

### Step 1: Enable Subscription Products

1. **Login to Razorpay Dashboard**
2. **Navigate to**: Payment Products → **Subscriptions**
3. **Click**: "Enable Subscriptions"
4. **Complete**: Business verification if required

### Step 2: Create Subscription Plan

```bash
# In Razorpay Dashboard or via API
Plan Details:
- Name: "Watzy Pro Plan"
- Billing Cycle: Monthly
- Amount: ₹259 (25900 paise)
- Currency: INR
- Trial Period: 0 days (since you already have free trial)
```

### Step 3: Get API Credentials

1. **Go to**: Settings → API Keys
2. **Generate**:
   - Test Key ID: `rzp_test_xxxxxxxxxx`
   - Test Key Secret: `xxxxxxxxxx`
3. **For Production**: Generate Live keys after KYC approval

## Environment Configuration

### Update .env.local

```env
# Razorpay Subscription Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_secret_key_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id_here

# Webhook Configuration
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

## API Endpoints Created

### 1. Create Subscription

```typescript
POST /api/razorpay/create-subscription
Body: {
  userId: string,
  userEmail: string,
  userName: string,
  phone?: string
}
Response: {
  subscriptionId: string,
  planId: string,
  status: string,
  shortUrl: string
}
```

### 2. Manage Subscription

```typescript
POST /api/razorpay/manage-subscription
Body: {
  subscriptionId: string,
  action: "cancel" | "pause" | "resume"
}

GET /api/razorpay/manage-subscription?id=sub_xxxxxxxxx
Response: {
  subscriptionId: string,
  status: string,
  currentStart: number,
  currentEnd: number
}
```

## Integration Flow

### User Subscription Journey

1. **User clicks "Upgrade Now"** on billing page
2. **System creates** Razorpay subscription via API
3. **User redirected** to Razorpay's hosted checkout
4. **User authorizes** recurring payments
5. **Razorpay handles** monthly billing automatically
6. **Webhooks notify** your system of payment status

### Implementation Changes Made

- ✅ **BillingClient.tsx**: Updated to use subscription instead of one-time payment
- ✅ **API Routes**: Added subscription creation and management
- ✅ **Hosted Checkout**: Uses Razorpay's subscription checkout page

## Testing the Setup

### Test Subscription Flow

1. **Start Development Server**: `pnpm dev`
2. **Visit**: `http://localhost:3001/dashboard/billing`
3. **Click**: "Upgrade Now" button
4. **Should open**: Razorpay subscription checkout in new tab
5. **Use Test Cards**:
   - Success: `4111 1111 1111 1111`
   - Failure: `4000 0000 0000 0002`

### Test Cases to Verify

- [ ] Subscription creation works
- [ ] Checkout page opens correctly
- [ ] Payment authorization succeeds
- [ ] Subscription status updates in your system
- [ ] Monthly billing cycles work
- [ ] Failed payment handling
- [ ] Subscription cancellation

## Webhook Configuration (Production)

### Required Webhooks

```bash
Events to Listen:
- subscription.activated
- subscription.charged
- subscription.completed
- subscription.cancelled
- subscription.paused
- subscription.resumed
- payment.failed
```

### Webhook URL

```
https://watzy.app/api/razorpay/webhook
```

## Subscription Management Features

### For Users

- ✅ **View Subscription Status**: Active/Cancelled/Paused
- ✅ **Cancel Subscription**: End recurring billing
- ✅ **Billing History**: See all past payments
- ✅ **Next Billing Date**: When next payment is due

### For Admin

- ✅ **Dashboard Overview**: All active subscriptions
- ✅ **Revenue Analytics**: Monthly recurring revenue
- ✅ **Churn Analysis**: Cancellation rates
- ✅ **Failed Payment Recovery**: Dunning management

## Production Checklist

### Before Going Live

- [ ] **KYC Approved**: Business verification complete
- [ ] **Live Keys**: Generated and configured
- [ ] **Webhooks**: Configured and tested
- [ ] **SSL Certificate**: HTTPS enabled
- [ ] **Terms Updated**: Subscription terms in legal pages
- [ ] **Cancellation Policy**: Clear refund/cancellation terms

### Testing in Production

- [ ] **Small Amount Test**: Create ₹1 subscription first
- [ ] **End-to-End Flow**: Complete user journey
- [ ] **Webhook Delivery**: Verify events received
- [ ] **Database Updates**: Subscription status synced
- [ ] **Email Notifications**: Payment confirmations sent

## Benefits for Watzy

### Revenue Impact

- **Predictable Income**: ₹259 × number of subscribers monthly
- **Reduced Churn**: Automatic renewals vs manual payments
- **Better Metrics**: MRR, LTV, churn rate tracking
- **Professional Image**: Standard SaaS business model

### User Experience

- **Set and Forget**: Users don't need to remember to pay
- **Pro-rated Billing**: Handle mid-cycle upgrades/downgrades
- **Transparent Billing**: Clear upcoming charges
- **Easy Cancellation**: Self-service subscription management

## Support and Troubleshooting

### Common Issues

1. **Subscription creation fails**: Check API credentials and business verification
2. **Checkout doesn't open**: Verify NEXT_PUBLIC_RAZORPAY_KEY_ID is set
3. **Payments not processing**: Check webhook configuration
4. **Status not updating**: Verify webhook secret and endpoint

### Getting Help

- **Razorpay Support**: support@razorpay.com
- **Documentation**: https://razorpay.com/docs/subscriptions/
- **Integration Guide**: https://razorpay.com/docs/subscriptions/integration/

## Next Steps

1. **Test the current implementation** with test credentials
2. **Complete KYC verification** in Razorpay dashboard
3. **Configure webhooks** for production
4. **Update user interface** to show subscription status
5. **Add subscription management** features for users
6. **Deploy to production** with live credentials

Your watzy platform will now have professional subscription billing! 🚀
