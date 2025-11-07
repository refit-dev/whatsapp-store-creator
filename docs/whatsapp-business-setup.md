# WhatsApp Business API Setup Guide

## Overview

This guide will help you set up WhatsApp Business API to enable OTP verification for your stores.

## Prerequisites

- Meta Business account
- A valid phone number (not currently using WhatsApp Business app)
- Valid business documentation for verification

## Step 1: Create Meta Business Account

1. Go to [business.facebook.com](https://business.facebook.com)
2. Click "Create Account"
3. Enter your business name and your name
4. Enter business email and click "Next"
5. Verify your email and complete setup

## Step 2: Set Up WhatsApp Business

1. In Meta Business Manager, go to "All Tools" > "WhatsApp Manager"
2. Click "Get Started"
3. Choose "Use WhatsApp Business API" (not WhatsApp Business app)
4. Follow the setup wizard

## Step 3: Add Phone Number

1. In WhatsApp Manager, click "Phone Numbers"
2. Click "Add Phone Number"
3. Enter your business phone number
4. Verify the number via SMS/call
5. **Important**: This number cannot be used with WhatsApp personal or Business app

## Step 4: Business Verification

1. In Business Manager, go to "Business Settings" > "Security Center"
2. Click "Start Verification"
3. Upload required documents:
   - Business license/registration
   - Tax ID/GST certificate
   - Utility bill/bank statement (for address)
4. Wait for approval (can take 1-7 days)

## Step 5: Create WhatsApp Business Account (WABA)

1. Go to WhatsApp Manager
2. Click "Create WhatsApp Business Account"
3. Enter business name and category
4. Add your verified phone number to the WABA

## Step 6: Get API Credentials

### Get Access Token

1. Go to Meta App Dashboard: [developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Create a new app or use existing app
3. Add "WhatsApp" product to your app
4. Go to WhatsApp > Getting Started
5. Find your **Phone Number ID** and note it down
6. Generate a **Temporary Access Token** (valid 24 hours)

### Create Permanent System User Token

1. In Business Manager > Business Settings > Users > System Users
2. Click "Add" to create new System User
3. Give it a name like "WhatsApp API Access"
4. Add permissions: `whatsapp_business_messaging`
5. Generate access token and copy it
6. **This is your permanent WHATSAPP_ACCESS_TOKEN**

### Get Business Account ID

1. In WhatsApp Manager, your Business Account ID is shown in the URL
2. Or go to Business Settings > WhatsApp Business Accounts
3. Copy the ID from there

## Step 7: Create Message Template

1. In WhatsApp Manager, go to "Message Templates"
2. Click "Create Template"
3. Template details:
   - **Name**: `phone_verification_otp` (or update WHATSAPP_OTP_TEMPLATE_NAME)
   - **Category**: Authentication
   - **Language**: English (en)
   - **Header**: None
   - **Body**: `Your verification code is {{1}}. This code expires in 10 minutes.`
   - **Footer**: None
   - **Buttons**: None
4. Submit for approval (usually approved within hours for authentication templates)

## Step 8: Update Environment Variables

Add these to your `.env.local` and Vercel:

```env
WHATSAPP_ACCESS_TOKEN=YOUR_PERMANENT_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID=YOUR_PHONE_NUMBER_ID
WHATSAPP_BUSINESS_ACCOUNT_ID=YOUR_BUSINESS_ACCOUNT_ID
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token_123
WHATSAPP_OTP_TEMPLATE_NAME=phone_verification_otp
WHATSAPP_OTP_TEMPLATE_LANG=en
```

## Step 9: Test OTP Functionality

1. Deploy your app with the new environment variables
2. Go to your store settings in the dashboard
3. Try the "Verify WhatsApp Number" feature
4. You should receive an OTP via WhatsApp

## Important Notes

⚠️ **Common Issues:**

- Template must be approved before OTP will work
- Phone number cannot be used with other WhatsApp apps
- Access tokens expire - use System User for permanent tokens
- Business verification is required for production usage

✅ **Testing:**

- You can test with the same number you're verifying
- Use a different number to test customer experience
- Check WhatsApp Manager for delivery logs

## Cost Information

- WhatsApp Business API charges per message
- Authentication templates (OTP) are typically cheaper
- First 1,000 conversations per month are often free
- Check current pricing at [business.whatsapp.com](https://business.whatsapp.com)

## Next Steps

1. Set up webhooks (optional, for delivery status)
2. Add more message templates for order confirmations
3. Monitor usage in WhatsApp Manager analytics
