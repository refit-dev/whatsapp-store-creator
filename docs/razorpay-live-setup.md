# Razorpay Live Mode Setup

## Overview

Switch from Razorpay test mode to live mode for real payment processing.

## Prerequisites

- Razorpay account with KYC completed
- Business verification approved
- Bank account added and verified

## Step 1: Complete Razorpay Account Setup

### Business Verification

1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to Account & Settings > Business Verification
3. Complete KYC with required documents:
   - **Business**: GST certificate, Partnership deed, etc.
   - **Personal**: PAN, Aadhaar, Bank statements
   - **Address**: Utility bills, rent agreement
4. Wait for approval (usually 1-3 business days)

### Settlement Account

1. Go to Account & Settings > Bank Account
2. Add your business bank account
3. Verify with micro-deposits or bank statement
4. Set settlement preferences (daily/weekly)

## Step 2: Generate Live API Keys

1. In Razorpay Dashboard, go to Settings > API Keys
2. **Important**: Switch to "Live Mode" (toggle in top-right)
3. Click "Generate Live Keys"
4. Download and securely store:
   - **Key ID**: Starts with `rzp_live_`
   - **Key Secret**: Keep this highly confidential

## Step 3: Update Environment Variables

### Local Development (.env.local)

```env
# Razorpay Live Configuration
RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_LIVE_KEY_SECRET
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID

# Optional: Webhook secret for payment verification
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
```

### Vercel Production

1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Update these variables for **Production** environment:
   - `RAZORPAY_KEY_ID` → `rzp_live_YOUR_LIVE_KEY_ID`
   - `RAZORPAY_KEY_SECRET` → `YOUR_LIVE_KEY_SECRET`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` → `rzp_live_YOUR_LIVE_KEY_ID`

## Step 4: Set Up Webhooks (Recommended)

### Create Webhook in Razorpay

1. Go to Settings > Webhooks in Razorpay Dashboard
2. Click "Create Webhook"
3. **URL**: `https://your-domain.com/api/razorpay/webhook`
4. **Secret**: Generate a strong secret (save this as `RAZORPAY_WEBHOOK_SECRET`)
5. **Events**: Select these events:
   - `payment.captured`
   - `payment.failed`
   - `subscription.charged`
   - `subscription.cancelled`

### Update Webhook Handler

The webhook endpoint at `/api/razorpay/webhook` should verify the signature using the webhook secret.

## Step 5: Test Live Payments

### Small Test Transaction

1. Deploy with live keys
2. Create a test product with small amount (₹1-5)
3. Complete a real payment with your own card
4. Verify:
   - Payment shows in Razorpay Dashboard
   - Webhook events are received
   - Money settles to your bank account

### Common Test Scenarios

- Different payment methods (cards, UPI, wallets)
- Payment failures (insufficient funds, etc.)
- Subscription payments (if using)
- Refund processing

## Step 6: Update Payment Flow

### Ensure Proper Error Handling

```typescript
// Example: Better error handling for live mode
try {
  const order = await razorpay.orders.create(orderData);
  // Handle success
} catch (error) {
  // Log error securely (don't expose sensitive data)
  console.error("Payment creation failed:", error.message);
  // Return user-friendly error
  return { error: "Payment processing unavailable. Please try again." };
}
```

### Update Success/Failure URLs

Make sure your payment success and failure URLs point to your production domain.

## Security Checklist

✅ **API Keys**:

- Live keys stored securely in environment variables
- Never commit live keys to version control
- Use different keys for development/staging

✅ **Webhook Security**:

- Verify webhook signatures
- Use HTTPS for webhook URLs
- Validate webhook payload structure

✅ **Error Handling**:

- Don't expose sensitive error details to users
- Log payment errors securely for debugging
- Have fallback payment methods

## Monitoring & Maintenance

### Dashboard Monitoring

- Check Razorpay Dashboard daily for:
  - Failed payments
  - Chargebacks/disputes
  - Settlement status

### Transaction Logging

- Log all payment attempts
- Track success/failure rates
- Monitor for suspicious activity

### Regular Testing

- Test payments monthly
- Verify webhook delivery
- Check settlement timing

## Compliance & Regulations

### PCI DSS

- Never store card details on your servers
- Use Razorpay's secure checkout
- Ensure HTTPS everywhere

### Reserve Funds

- Razorpay may hold a reserve fund initially
- Percentage decreases as transaction volume grows
- Check reserve policy in your agreement

## Common Issues & Solutions

### "Invalid API Key"

- Verify you're using live keys (start with `rzp_live_`)
- Check key hasn't been regenerated in dashboard

### "Payment Failed"

- Common in live mode due to real bank checks
- Implement retry logic with different payment methods
- Show clear error messages to users

### Settlement Delays

- Normal settlement time is T+2 days for most banks
- Check if account verification is complete
- Contact Razorpay support for unusual delays

## Cost Considerations

### Transaction Fees (as of 2024)

- **Cards**: ~2% of transaction amount
- **UPI**: ₹0 (up to certain limit, then small fee)
- **Net Banking**: Fixed fee per transaction
- **Wallets**: Variable based on provider

### Monthly Fees

- Check for any monthly maintenance fees
- Volume-based discounts may be available

## Support & Resources

- **Razorpay Support**: support@razorpay.com
- **Integration Docs**: https://razorpay.com/docs/
- **Status Page**: https://status.razorpay.com/
- **Developer Community**: https://community.razorpay.com/

## Final Deployment Steps

1. ✅ Update all environment variables
2. ✅ Test with small live transaction
3. ✅ Verify webhook delivery
4. ✅ Check settlement account
5. ✅ Monitor for first few days
6. ✅ Set up alerts for payment failures

**Remember**: Once you go live, you're processing real money. Test thoroughly and monitor closely!
