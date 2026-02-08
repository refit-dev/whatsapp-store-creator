# Onboarding Not Showing for New Users - Fix

## Problem

New users are not seeing the onboarding guide on first login because the `add_onboarding_tracking.sql` migration incorrectly marks all users as having completed onboarding.

### Root Cause

The migration file contained this problematic line:

```sql
UPDATE profiles SET onboarding_completed = TRUE WHERE created_at < NOW();
```

Since `NOW()` returns the current timestamp, **every user's `created_at` is always less than the current time**, meaning ALL users (including brand new ones) were marked as having completed onboarding.

## Solution

### Option 1: Quick Fix (Recommended for immediate fix)

Run the SQL in `FIX_ONBOARDING_NEW_USERS.sql` in your Supabase SQL Editor:

```sql
-- Reset onboarding for recently created users
UPDATE profiles
SET
  onboarding_completed = FALSE,
  onboarding_skipped = FALSE,
  last_onboarding_step = 0,
  onboarding_completed_at = NULL
WHERE created_at >= NOW() - INTERVAL '1 day';
```

This will reset onboarding status for any users created in the last 24 hours.

### Option 2: Complete Migration Fix (For production deployment)

Apply the migration file: `supabase/migrations/20251214000001_fix_onboarding_for_new_users.sql`

This migration:

1. Resets onboarding status for users created in the last day
2. Marks users created more than a day ago as completed (they're already using the system)
3. Sets proper defaults for new users

### Option 3: Manual Fix for Specific User

If you need to reset onboarding for a specific user:

```sql
UPDATE profiles
SET
  onboarding_completed = FALSE,
  onboarding_skipped = FALSE,
  last_onboarding_step = 0,
  onboarding_completed_at = NULL
WHERE email = 'user@example.com';
```

## How Onboarding Works

1. **OnboardingProvider** checks onboarding status via `/api/onboarding/status`
2. If `onboarding_completed` and `onboarding_skipped` are both FALSE, the tour starts
3. **OnboardingTour** component uses driver.js to show an interactive tour
4. Tour guides users through:
   - Store settings (name, WhatsApp number, currency)
   - Adding products
   - Viewing orders
   - Sharing store link

## Testing

After applying the fix:

1. Create a new test account
2. Log in for the first time
3. You should see the "Welcome! 🎉" onboarding tour
4. The tour should highlight key features with step-by-step guidance

## Related Files

- `components/OnboardingProvider.tsx` - Context provider for onboarding state
- `components/OnboardingTour.tsx` - The actual tour component using driver.js
- `components/DashboardWrapper.tsx` - Wraps dashboard with onboarding
- `app/api/onboarding/status/route.ts` - API to check onboarding status
- `app/api/onboarding/complete/route.ts` - API to mark onboarding as complete
- `app/api/onboarding/skip/route.ts` - API to skip onboarding

## Future Prevention

The migration file `add_onboarding_tracking.sql` should be updated to use a fixed timestamp instead of `NOW()`:

```sql
-- Instead of this (WRONG):
UPDATE profiles SET onboarding_completed = TRUE WHERE created_at < NOW();

-- Use this (CORRECT):
UPDATE profiles SET onboarding_completed = TRUE
WHERE created_at < '2025-12-14 00:00:00'::timestamp;
```

Or better yet, don't update existing users at all - let them use the "Restart Tour" button if needed.
