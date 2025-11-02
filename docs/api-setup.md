# API Keys and Configuration

## Supabase

- URL: https://iazdsuodmyymclqltenc.supabase.co
- Status: ✅ Connected and Working

## WhatsApp Business API

Required Environment Variables:

```env
WHATSAPP_ACCESS_TOKEN=            # Business API Access Token
WHATSAPP_PHONE_NUMBER_ID=         # Phone Number ID from WhatsApp Business
WHATSAPP_BUSINESS_ACCOUNT_ID=     # Business Account ID
WHATSAPP_VERIFY_TOKEN=            # Webhook Verify Token
WHATSAPP_OTP_TEMPLATE_NAME=       # Approved template name for OTP (e.g., phone_verification_otp)
WHATSAPP_OTP_TEMPLATE_LANG=       # Template language code (e.g., en)
```

## Payment Providers

### Stripe

Required Environment Variables:

```env
STRIPE_SECRET_KEY=                # Stripe Secret Key for server
NEXT_PUBLIC_STRIPE_KEY=           # Stripe Publishable Key for client
STRIPE_WEBHOOK_SECRET=            # Stripe Webhook Secret
```

### Razorpay

Required Environment Variables:

```env
RAZORPAY_KEY_ID=                  # Razorpay Key ID
RAZORPAY_KEY_SECRET=              # Razorpay Key Secret
RAZORPAY_WEBHOOK_SECRET=          # Razorpay Webhook Secret
```

## Status

1. Supabase Integration

   - [x] Database connection working
   - [x] Authentication configured
   - [x] RLS policies implemented
   - [x] Store and product tables created

2. WhatsApp Integration

   - [x] Basic message builder
   - [ ] Business API connection
   - [ ] Webhook handling
   - [ ] Message templates

3. Payment Integration
   - [x] Stripe SDK installed
   - [x] Razorpay SDK installed
   - [ ] Payment webhook handlers
   - [ ] Payment status tracking

## Next Steps

1. WhatsApp Business API Setup

   - Register for WhatsApp Business API
   - Set up webhooks
   - Create message templates

2. Payment Provider Setup

   - Complete Stripe integration
   - Complete Razorpay integration
   - Implement webhook handlers

3. Testing
   - Add payment flow tests
   - Add WhatsApp message tests
   - Test webhook handlers
