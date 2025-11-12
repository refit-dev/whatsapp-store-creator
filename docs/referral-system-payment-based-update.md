# Referral System Update: Payment-Based Rewards

## Summary

Updated the referral system from **signup-based** to **payment-based** rewards, and removed the 6-month referral limit.

## Changes Made

### OLD System:

- ❌ Referrer got 1 month free **immediately** when someone signed up with their code
- ❌ Maximum 6 referrals allowed (6 months free total)
- ❌ No verification that referred user actually paid

### NEW System:

- ✅ Referrer gets 1 month free **only when** referred user pays for their first subscription
- ✅ **Unlimited** referrals - no maximum limit
- ✅ Tracks payment verification status

---

## Technical Implementation

### 1. Database Migration (`20251112000002_update_referral_system_payment_based.sql`)

**New Columns Added to `referrals` table:**

- `reward_granted` (BOOLEAN): Tracks if referrer received their reward
- `payment_verified` (BOOLEAN): Tracks if referred user has paid
- `payment_verified_at` (TIMESTAMP): When payment was verified
- `reward_granted_at` (TIMESTAMP): When reward was given

**New Database Functions:**

1. **`extend_subscription(user_uuid, days)`**
   - Extends user's active subscription by specified days
   - **Removed 6-month cap** - unlimited extensions now possible
2. **`process_referral_reward(referred_user_uuid)`**
   - Called when referred user makes first payment
   - Marks payment as verified
   - Extends referrer's subscription by 30 days
   - Marks reward as granted

### 2. API Changes

#### `/api/referral/process` (Route Handler)

**Before:**

- Immediately extended referrer's subscription
- Checked for 6-month limit
- Blocked referral if limit reached

**After:**

- Just creates referral record with `reward_granted=false`
- No immediate subscription extension
- No limit checks
- Returns message: "Referrer will receive 1 month free when you complete your first payment"

#### `/api/razorpay/webhook` (Webhook Handler)

**Added:**

- Listens for `subscription.charged` and `subscription.authenticated` events
- Calls `process_referral_reward()` function when payment succeeds
- Logs successful reward grants

#### `/api/razorpay/verify-payment` (Payment Verification)

**Added:**

- After creating subscription, calls `process_referral_reward()`
- Grants referrer reward when referred user's payment is verified
- Non-blocking - doesn't fail payment if reward processing has issues

#### `/api/referral/status` (Status Endpoint)

**Before:**

- Counted all referrals
- Returned 6-month limit info

**After:**

- Only counts referrals where `reward_granted=true`
- Returns `pendingReferrals` count (not yet paid)
- Returns `unlimited: true` flag
- No limit information

### 3. Frontend Changes

#### `components/SubscriptionProvider.tsx`

**Before:**

```typescript
const [maxReferrals] = useState(6);
```

**After:**

```typescript
const [maxReferrals] = useState(999); // No practical limit
const [hasReachedReferralLimit] = useState(false); // Always false
```

**Query Change:**

- Now only counts referrals where `reward_granted=true` (paid referrals)
- Previously counted all referrals

#### `components/ReferralBanner.tsx`

**Updated Messaging:**

- Removed "6 months maximum" messaging
- Changed to "Unlimited referrals!"
- Updated to say "when your friend upgrades to a paid plan"
- Removed limit-reached warnings
- Shows count of "successful paid referrals"

#### `app/terms/page.tsx`

**Updated:**

- Changed from generic "Referral programs may provide additional free months"
- To specific: "Earn 1 free month when a referred user upgrades to a paid plan (unlimited referrals)"

---

## User Flow

### For Referrer (Person Sharing Code):

1. **Create Referral Code**
   - User goes to dashboard → billing
   - Creates their unique referral code
2. **Share Code**
   - Shares link with friends
   - Message says: "When you upgrade, I get 1 month FREE!"
3. **Friend Signs Up**
   - Friend uses referral link
   - Referral record created with `reward_granted=false`
   - **No immediate reward yet**
4. **Friend Pays for Subscription**
   - Friend completes payment for first subscription
   - Webhook/verify-payment triggers `process_referral_reward()`
   - Referrer's subscription extended by 30 days
   - `reward_granted` set to `true`
5. **Track Rewards**
   - Dashboard shows "X successful paid referrals"
   - Each paid referral = 1 month free
   - **No limit** on total referrals

### For Referred User (Person Using Code):

1. Signs up with referral code
2. Gets 14-day free trial (unchanged)
3. When they pay for first subscription:
   - Their referrer gets 1 month free
   - They get full subscription access

---

## Database Schema Changes

```sql
-- New columns in referrals table
ALTER TABLE referrals
ADD COLUMN reward_granted BOOLEAN DEFAULT FALSE,
ADD COLUMN payment_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN payment_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN reward_granted_at TIMESTAMP WITH TIME ZONE;

-- New indexes for performance
CREATE INDEX idx_referrals_referred_id_payment ON referrals(referred_id, payment_verified);
CREATE INDEX idx_referrals_reward_granted ON referrals(referrer_id, reward_granted);
```

---

## Migration Impact

### Existing Data

The migration marks all existing referrals as:

- `reward_granted = TRUE`
- `payment_verified = TRUE`
- Timestamps set to `created_at`

This prevents retroactive reward grants for old referrals.

### New Referrals

- Start with `reward_granted=false`, `payment_verified=false`
- Only get processed when payment verified

---

## Testing Checklist

### Before Deployment

- [x] Database migration created
- [x] All API endpoints updated
- [x] Frontend components updated
- [x] Build succeeds with no errors
- [x] Terms updated

### After Deployment (Manual Testing)

1. **Database Migration**

   ```bash
   # Run in Supabase SQL Editor
   # Execute: 20251112000002_update_referral_system_payment_based.sql
   ```

2. **Test Referral Flow**

   - [ ] User A creates referral code
   - [ ] User B signs up with code
   - [ ] Verify referral record created with `reward_granted=false`
   - [ ] User B pays for subscription
   - [ ] Verify User A's subscription extended by 30 days
   - [ ] Verify `reward_granted=true` in database

3. **Test UI**

   - [ ] Referral banner shows "Unlimited referrals"
   - [ ] No mention of 6-month limit
   - [ ] Shows "paid referrals" count
   - [ ] Message says "when friend upgrades to paid plan"

4. **Test Edge Cases**
   - [ ] User refers themselves (should fail - existing validation)
   - [ ] User uses referral code twice (should fail - existing validation)
   - [ ] Referrer has no active subscription (reward pending until they have subscription)
   - [ ] Multiple referrals pay same day (all should process)

---

## Rollback Plan

If issues occur, revert by:

1. **Code Rollback:**

   ```bash
   git revert <commit-hash>
   git push
   ```

2. **Database Rollback (if needed):**

   ```sql
   -- Remove new columns
   ALTER TABLE referrals
   DROP COLUMN reward_granted,
   DROP COLUMN payment_verified,
   DROP COLUMN payment_verified_at,
   DROP COLUMN reward_granted_at;

   -- Restore old extend_subscription function
   -- (keep backup of old function)
   ```

---

## Files Modified

1. **Database:**

   - `supabase/migrations/20251112000002_update_referral_system_payment_based.sql` (NEW)

2. **API Routes:**

   - `app/api/referral/process/route.ts`
   - `app/api/referral/status/route.ts`
   - `app/api/razorpay/webhook/route.ts`
   - `app/api/razorpay/verify-payment/route.ts`

3. **Components:**

   - `components/SubscriptionProvider.tsx`
   - `components/ReferralBanner.tsx`

4. **Pages:**
   - `app/terms/page.tsx`

**Total:** 8 files modified, 1 new file

---

## Benefits of New System

1. **Fair Rewards:** Referrers only get rewards for users who actually pay
2. **No Limit:** Unlimited growth potential for active promoters
3. **Better Tracking:** Clear distinction between signups and paid conversions
4. **Business Value:** Only rewards when revenue is generated
5. **Scalable:** No artificial caps limiting viral growth

---

## Monitoring

### Key Metrics to Track:

- **Conversion Rate:** Signups → Paid subscriptions via referral
- **Pending Rewards:** Referrals waiting for payment
- **Successful Rewards:** Total rewards granted
- **Average Time to Payment:** How long until referred users pay

### Database Queries:

```sql
-- Total referrals
SELECT COUNT(*) FROM referrals;

-- Paid referrals (rewards granted)
SELECT COUNT(*) FROM referrals WHERE reward_granted = true;

-- Pending referrals (signed up but not paid)
SELECT COUNT(*) FROM referrals WHERE payment_verified = false;

-- Top referrers
SELECT referrer_id, COUNT(*) as paid_referrals
FROM referrals
WHERE reward_granted = true
GROUP BY referrer_id
ORDER BY paid_referrals DESC
LIMIT 10;
```

---

## Support & Troubleshooting

### Common Issues:

**Q: Referred user paid but referrer didn't get reward?**

- Check webhook delivery in Razorpay dashboard
- Verify `payment_verified=true` in referrals table
- Check if referrer has active subscription (reward pending if not)

**Q: Old referrals showing up?**

- Migration marked all old referrals as processed
- Only new referrals after deployment will follow new flow

**Q: Can I manually grant a reward?**

```sql
-- Yes, but carefully:
SELECT process_referral_reward('<referred-user-uuid>');
```
