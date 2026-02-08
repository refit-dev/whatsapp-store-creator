# Affiliate Program Implementation Guide

Complete step-by-step guide for deploying the affiliate partner program.

## 🎯 Overview

Partners earn **20% MRR** for each referred paid subscriber. System includes:

- Cookie-based attribution (30-day window)
- Automatic commission calculation
- Multi-channel reporting (Email, WhatsApp, Google Sheets)
- Automated monthly payouts
- Partner dashboard with analytics

---

## 📋 Phase 1: Foundation (Week 1-2) ✅ READY TO DEPLOY

### Files Created

1. **Database Schema**
   - `supabase/migrations/20251217_create_affiliate_tables.sql`
   - `supabase/migrations/20251217_update_earnings_rpc.sql`
   - `supabase/migrations/20251217_increment_referrals_rpc.sql`

2. **TypeScript Types**
   - `types/affiliate.ts`

3. **API Endpoints**
   - `app/api/affiliate/register/route.ts` - Partner registration
   - `app/api/affiliate/track-click/route.ts` - Referral click tracking
   - `app/api/affiliate/create-referral/route.ts` - Create referral records
   - `app/api/affiliate/webhook/route.ts` - Payment webhook handler

4. **Utilities**
   - `lib/affiliate-cookies.ts` - Cookie management

5. **Pages**
   - `app/ref/[code]/page.tsx` - Referral link landing page

6. **Updated Files**
   - `app/auth/AuthClient.tsx` - Added referral tracking on signup

---

## 🚀 Deployment Steps

### Step 1: Run Database Migrations

```bash
# Connect to Supabase project
cd c:\My Projects\whatsapp-store-creator-1\whatsapp-store-creator-1

# Option A: Via Supabase CLI (Recommended)
supabase db push

# Option B: Via Supabase Dashboard
# 1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
# 2. Copy contents of each migration file
# 3. Execute in order:
#    - 20251217_create_affiliate_tables.sql
#    - 20251217_update_earnings_rpc.sql
#    - 20251217_increment_referrals_rpc.sql
```

### Step 2: Verify Database Schema

Run this SQL in Supabase SQL Editor:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'affiliate_%';

-- Expected output: 5 tables
-- affiliate_partners
-- affiliate_referrals
-- affiliate_commissions
-- affiliate_clicks
-- affiliate_payouts

-- Check RPC functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%affiliate%';

-- Expected output: 3 functions
-- generate_referral_code
-- calculate_commission
-- update_affiliate_earnings
-- increment_affiliate_referrals
```

### Step 3: Update Environment Variables

Add to `.env.local`:

```env
# Affiliate Program Settings
NEXT_PUBLIC_AFFILIATE_COMMISSION_RATE=0.20
NEXT_PUBLIC_REFERRAL_COOKIE_EXPIRY_DAYS=30

# Stripe Webhook (for commission calculation)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Razorpay Webhook (optional, if using Razorpay)
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

### Step 4: Configure Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://watzy.app/api/affiliate/webhook`
3. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `invoice.payment_succeeded`
4. Copy webhook signing secret to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### Step 5: Configure Razorpay Webhooks (If Applicable)

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add endpoint: `https://watzy.app/api/affiliate/webhook`
3. Add custom header: `x-webhook-source: razorpay`
4. Select events:
   - `subscription.activated`
   - `subscription.charged`
   - `payment.captured`
5. Copy webhook secret to `.env.local`

### Step 6: Test the Flow

#### Test 1: Partner Registration

```bash
curl -X POST https://yourdomain.com/api/affiliate/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -d '{
    "company_name": "Test Partner Inc",
    "contact_email": "partner@example.com",
    "payment_email": "payouts@example.com"
  }'

# Expected response:
# {
#   "success": true,
#   "data": {
#     "partner": { ...partner object... },
#     "referral_link": "https://yourdomain.com/ref/TEST-PARTNER"
#   }
# }
```

#### Test 2: Referral Link Click

1. Open browser in incognito mode
2. Visit: `https://yourdomain.com/ref/TEST-PARTNER`
3. Should redirect to signup page
4. Check cookie in DevTools → Application → Cookies
   - Name: `watzy_ref`
   - Value should contain referral_code

#### Test 3: Signup Attribution

1. Sign up with test email
2. Check `affiliate_referrals` table:

```sql
SELECT * FROM affiliate_referrals
WHERE referred_user_id = 'new_user_id_here';
```

#### Test 4: Commission Calculation

1. Use Stripe CLI to simulate webhook:

```bash
stripe trigger customer.subscription.created
```

2. Check `affiliate_commissions` table:

```sql
SELECT * FROM affiliate_commissions
ORDER BY created_at DESC
LIMIT 5;
```

### Step 7: Deploy to Production

```bash
# Build and test locally first
npm run build

# Check for TypeScript errors
npm run type-check

# Deploy to Vercel
vercel --prod

# Or push to GitHub (if auto-deploy enabled)
git add .
git commit -m "feat: Add affiliate partner program"
git push origin main
```

---

## 🧪 Testing Checklist

- [ ] Database migrations applied successfully
- [ ] All 5 tables exist with correct columns
- [ ] RLS policies are active
- [ ] Partner registration API works
- [ ] Referral link sets cookie correctly
- [ ] Cookie persists for 30 days
- [ ] Signup creates referral record
- [ ] Stripe webhook receives events
- [ ] Commission calculation works
- [ ] Partner earnings update correctly
- [ ] Build completes without errors
- [ ] Production deployment successful

---

## 📊 Admin Queries

### View All Partners

```sql
SELECT
  id,
  company_name,
  referral_code,
  total_referrals,
  total_commissions,
  total_earnings,
  pending_balance,
  status,
  created_at
FROM affiliate_partners
ORDER BY total_earnings DESC;
```

### View Recent Commissions

```sql
SELECT
  c.id,
  p.company_name,
  c.amount,
  c.currency,
  c.status,
  c.created_at
FROM affiliate_commissions c
JOIN affiliate_partners p ON c.affiliate_id = p.id
ORDER BY c.created_at DESC
LIMIT 20;
```

### View Conversion Rate by Partner

```sql
SELECT
  p.company_name,
  p.referral_code,
  COUNT(r.id) as total_referrals,
  COUNT(CASE WHEN r.converted = true THEN 1 END) as conversions,
  ROUND(
    (COUNT(CASE WHEN r.converted = true THEN 1 END)::DECIMAL /
     NULLIF(COUNT(r.id), 0)) * 100,
    2
  ) as conversion_rate_pct
FROM affiliate_partners p
LEFT JOIN affiliate_referrals r ON p.id = r.affiliate_id
GROUP BY p.id, p.company_name, p.referral_code
ORDER BY conversion_rate_pct DESC;
```

---

## 🔐 Security Considerations

1. **RLS Policies**: All tables have Row Level Security enabled
   - Partners can only see their own data
   - Admin access via service_role key
2. **Webhook Signatures**: Always verify webhook signatures
   - Stripe: Uses `stripe.webhooks.constructEvent()`
   - Razorpay: Add signature verification
3. **Cookie Security**:
   - HttpOnly flag prevents JavaScript access
   - Secure flag in production (HTTPS only)
   - SameSite=Lax prevents CSRF

4. **Rate Limiting**: Add rate limiting to public endpoints
   - `/api/affiliate/register` - 5 requests/hour per IP
   - `/api/affiliate/track-click` - 100 requests/hour per IP

---

## 📈 Next Steps (Phase 2-4)

### Phase 2: Reporting (Week 3-4)

- [ ] Weekly email reports to partners
- [ ] Real-time WhatsApp alerts for new conversions
- [ ] Google Sheets integration for live dashboard
- [ ] Admin analytics dashboard

### Phase 3: Partner Dashboard (Week 5-6)

- [ ] `/affiliate/dashboard` page
- [ ] Earnings chart and stats
- [ ] Referral history table
- [ ] Marketing assets (QR code, social templates)
- [ ] Payout request interface

### Phase 4: Payouts (Week 7-8)

- [ ] Stripe Connect integration
- [ ] Automated monthly payout batches
- [ ] Admin payout approval interface
- [ ] Fraud detection rules
- [ ] Tax form collection (W-9/W-8BEN)

---

## 🐛 Troubleshooting

### Issue: Referral cookie not setting

**Solution**: Check CSP headers in `next.config.js`, ensure cookie domain matches

### Issue: Commission not calculating

**Solution**:

1. Check webhook signature is valid
2. Verify user has referral record in `affiliate_referrals`
3. Check affiliate partner status is 'active'
4. Review Supabase logs for RPC errors

### Issue: Duplicate referrals

**Solution**: Check for existing referral before insert in `create-referral` API

### Issue: RLS blocking queries

**Solution**: Grant `service_role` access for webhook handlers, use `SECURITY DEFINER` for RPC functions

---

## 📞 Support

For issues during implementation:

1. Check Supabase logs: Dashboard → Logs
2. Check Vercel logs: Dashboard → Deployments → Logs
3. Review webhook delivery: Stripe/Razorpay Dashboard
4. Test with `curl` commands to isolate API issues

---

## ✅ Success Metrics

Track these KPIs after launch:

- Total active partners
- Average conversion rate (referrals → paid users)
- Total commissions paid
- Partner satisfaction (NPS survey)
- Attribution accuracy (% of signups tracked)

---

_Last Updated: December 2024_
_Version: 1.0.0_
