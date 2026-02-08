# Affiliate Partner Program - Phase 1 Complete ✅

## 🎉 What's Been Built

The foundation for the affiliate program is complete and ready to deploy. Partners will earn **20% MRR** for each referred paid subscriber.

---

## 📦 Files Created

### Database

- `supabase/migrations/20251217_create_affiliate_tables.sql` - 5 tables with RLS
- `supabase/migrations/20251217_update_earnings_rpc.sql` - Commission calculation function
- `supabase/migrations/20251217_increment_referrals_rpc.sql` - Referral counter function

### TypeScript Types

- `types/affiliate.ts` - Complete type definitions for entire system

### API Endpoints

- `app/api/affiliate/register/route.ts` - Partner registration (POST/GET)
- `app/api/affiliate/track-click/route.ts` - Click tracking + cookie setting (POST/GET)
- `app/api/affiliate/create-referral/route.ts` - Create referral records (POST)
- `app/api/affiliate/webhook/route.ts` - Payment webhook handler (POST)

### Utilities

- `lib/affiliate-cookies.ts` - Server & client-side cookie management

### Pages

- `app/ref/[code]/page.tsx` - Referral link landing page with loading states

### Updated Files

- `app/auth/AuthClient.tsx` - Added referral tracking on signup
- `lib/analytics.ts` - Added `referral_link_clicked` event

---

## 🚀 How It Works

### 1️⃣ Partner Registration

```
Partner → /api/affiliate/register → Get unique code (e.g., "JOHN-SMITH")
```

### 2️⃣ Referral Attribution (30-day cookie)

```
User clicks → /ref/JOHN-SMITH → Cookie set → Redirect to signup
```

### 3️⃣ Signup Tracking

```
User signs up → Check cookie → Create referral record → Link to partner
```

### 4️⃣ Commission Calculation (Automatic)

```
User subscribes → Stripe/Razorpay webhook → Calculate 20% → Create commission
```

### 5️⃣ Partner Earnings Update

```
Commission created → Update partner balance → Ready for payout
```

---

## 🔥 Attribution Flow Diagram

```
┌─────────────────┐
│ Partner shares  │
│ yourdomain.com/ref/  │
│    CODE         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User clicks     │
│ referral link   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ /ref/CODE page loads    │
│ → Track click in DB     │
│ → Set 30-day cookie     │
│ → Log device/UTM data   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Redirect to /auth/      │
│ sign-up?ref=CODE        │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ User signs up           │
│ → Check for cookie      │
│ → Create referral       │
│   record linking user   │
│   to partner            │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ User upgrades to paid   │
│ → Stripe/Razorpay       │
│   sends webhook         │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ /api/affiliate/webhook  │
│ → Find referral record  │
│ → Calculate 20%         │
│ → Create commission     │
│ → Update partner        │
│   earnings              │
└─────────────────────────┘
```

---

## 📊 Database Schema

### `affiliate_partners`

Partner profiles with earnings tracking

```
- id (UUID, PK)
- user_id (FK to users, optional)
- company_name
- referral_code (UNIQUE)
- commission_rate (default 0.20)
- total_referrals (counter)
- total_commissions (counter)
- total_earnings (decimal)
- pending_balance (decimal)
- status (active/suspended/inactive)
```

### `affiliate_referrals`

Attribution records linking users to partners

```
- id (UUID, PK)
- affiliate_id (FK to affiliate_partners)
- referred_user_id (FK to users)
- referral_code
- converted (boolean)
- converted_at (timestamp)
```

### `affiliate_commissions`

Commission transaction records

```
- id (UUID, PK)
- affiliate_id (FK)
- referral_id (FK)
- amount (decimal)
- currency
- subscription_id (Stripe/Razorpay)
- payment_provider
- status (pending/paid)
- paid_at (timestamp)
```

### `affiliate_clicks`

Click analytics for tracking

```
- id (UUID, PK)
- affiliate_id (FK)
- referral_code
- landing_page (URL)
- referrer (URL)
- device_info (JSONB)
- user_agent
- ip_address (hashed)
- converted (boolean)
```

### `affiliate_payouts`

Batch payout records

```
- id (UUID, PK)
- affiliate_id (FK)
- amount (decimal)
- currency
- payout_method
- status (pending/processing/completed/failed)
- processed_at (timestamp)
```

---

## 🧪 Testing Commands

### Test Partner Registration

```bash
curl -X POST http://localhost:3000/api/affiliate/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "company_name": "Test Partner",
    "contact_email": "test@example.com",
    "payment_email": "payout@example.com"
  }'
```

### Test Referral Link

```bash
# Open in browser
http://localhost:3000/ref/TEST-CODE

# Should:
# 1. Set watzy_ref cookie
# 2. Redirect to /auth/sign-up?ref=TEST-CODE
```

### Check Cookie in DevTools

```javascript
// Run in browser console after clicking referral link
document.cookie.split(";").find((c) => c.includes("watzy_ref"));
```

### Query Referrals (Supabase SQL Editor)

```sql
SELECT
  r.id,
  r.referral_code,
  u.email as referred_user,
  r.converted,
  r.created_at
FROM affiliate_referrals r
JOIN users u ON r.referred_user_id = u.id
ORDER BY r.created_at DESC;
```

---

## 🔐 Security Features

✅ **Row Level Security (RLS)** on all tables  
✅ **HttpOnly cookies** prevent JavaScript access  
✅ **Webhook signature verification** for Stripe/Razorpay  
✅ **IP address hashing** for privacy  
✅ **Duplicate prevention** checks  
✅ **SECURITY DEFINER** functions for atomic updates

---

## 📝 Deployment Checklist

- [ ] Run database migrations in Supabase
- [ ] Add environment variables (STRIPE_WEBHOOK_SECRET, etc.)
- [ ] Configure Stripe webhooks → yourdomain.com/api/affiliate/webhook
- [ ] Configure Razorpay webhooks (if applicable)
- [ ] Test partner registration flow
- [ ] Test referral link click → cookie → signup
- [ ] Test commission calculation with Stripe CLI
- [ ] Deploy to production (npm run build && vercel --prod)

See [AFFILIATE_IMPLEMENTATION_GUIDE.md](AFFILIATE_IMPLEMENTATION_GUIDE.md) for detailed steps.

---

## 🎯 Next Phases

### Phase 2: Reporting (Week 3-4)

- Weekly email reports to partners
- Real-time WhatsApp alerts for conversions
- Google Sheets integration
- Admin analytics dashboard

### Phase 3: Partner Dashboard (Week 5-6)

- `/affiliate/dashboard` page with stats
- Earnings chart
- Referral history table
- Marketing assets (QR codes, templates)
- Payout request interface

### Phase 4: Payouts (Week 7-8)

- Stripe Connect integration
- Automated monthly payout batches
- Admin approval interface
- Fraud detection rules

---

## 💰 Commission Example

```
User signs up via referral link
User subscribes to Premium Plan ($29/month)

Commission Calculation:
$29 × 20% = $5.80 per month

Partner Earnings:
Month 1: $5.80
Month 2: $5.80
Month 3: $5.80
...
Year 1 Total: $69.60 (from this one referral)
```

If partner refers 10 paid users:  
**$58/month recurring** = **$696/year** 🎉

---

## 📞 Support

Questions during implementation?  
Check the detailed guide: [AFFILIATE_IMPLEMENTATION_GUIDE.md](AFFILIATE_IMPLEMENTATION_GUIDE.md)

---

**Status**: Phase 1 Complete ✅  
**Ready to Deploy**: Yes 🚀  
**TypeScript Errors**: None ✅  
**Build Status**: Passing ✅

---

_WhatsApp Micro-Store - Affiliate Program_
