# Trial Period Update: 30 Days → 14 Days

## Summary

Updated the free trial period from 30 days to 14 days across the entire application.

## Changes Made

### 1. Database Migration

**File:** `supabase/migrations/20251112000001_update_trial_period_to_14_days.sql`

- Created/updated the `give_free_trial()` function to set trial duration to 14 days
- Changed `NOW() + INTERVAL '30 days'` to `NOW() + INTERVAL '14 days'`

### 2. Documentation Updates

**File:** `docs/auto-trial-system.md`

- Updated overview to mention "14-day trial"
- Updated function description to indicate 14-day trial
- Updated trial duration configuration note

### 3. User-Facing Text Updates

#### Components

- **`components/AccessGuard.tsx`**: Updated expired trial message
- **`components/SubscriptionStatus.tsx`**: Changed "30 days" to "14 days"
- **`components/ReferralBanner.tsx`**: Updated social share message (2 instances)

#### Pages

- **`app/dashboard/billing/BillingClient.tsx`**: Updated pricing plan display
- **`app/terms/page.tsx`**: Updated terms and conditions
- **`app/contact\page.tsx`**: Updated FAQ section
- **`app/cancellation-refund/page.tsx`**: Updated refund policy text

## Deployment Steps

### 1. Apply Database Migration

Run the migration in Supabase:

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase Dashboard
# Go to SQL Editor and run the migration file
```

### 2. Deploy Application

```bash
# Build and test locally
pnpm build

# Deploy to production
git add .
git commit -m "Update trial period from 30 days to 14 days"
git push origin main
```

### 3. Verification

After deployment, verify:

1. **New Users**: Sign up and check that trial shows 14 days
2. **Existing Trials**: Verify existing 30-day trials continue as-is
3. **UI Text**: Check all pages show "14 days" instead of "30 days"
4. **Database**: Confirm new trials have correct `ends_at` date (14 days from now)

## Important Notes

### Existing Users

- Users with existing 30-day trials will continue to have their full trial period
- Only NEW trials created after this update will be 14 days
- No retroactive changes to existing subscriptions

### Testing Checklist

- [ ] New user signup creates 14-day trial
- [ ] Trial expiration warning shows at 7 days remaining
- [ ] All UI text shows "14 days" instead of "30 days"
- [ ] Expired trial redirect works correctly
- [ ] Billing page shows correct trial duration
- [ ] FAQ and terms show updated information

### Rollback Plan

If you need to revert back to 30 days:

1. Update the SQL migration to use `INTERVAL '30 days'`
2. Revert all text changes (use git to restore previous version)
3. Re-deploy the application

## Files Changed

1. `supabase/migrations/20251112000001_update_trial_period_to_14_days.sql` (NEW)
2. `docs/auto-trial-system.md` (3 changes)
3. `components/AccessGuard.tsx` (1 change)
4. `components/SubscriptionStatus.tsx` (1 change)
5. `components/ReferralBanner.tsx` (2 changes)
6. `app/dashboard/billing/BillingClient.tsx` (1 change)
7. `app/terms/page.tsx` (1 change)
8. `app/contact/page.tsx` (1 change)
9. `app/cancellation-refund/page.tsx` (1 change)

Total: 12 changes across 9 files (1 new file)

## No Breaking Changes

This update does not break any existing functionality:

- ✅ API endpoints remain unchanged
- ✅ Database schema remains the same
- ✅ User authentication flow unchanged
- ✅ Payment integration unaffected
- ✅ Existing trials continue without interruption
