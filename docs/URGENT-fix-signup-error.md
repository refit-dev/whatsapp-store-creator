# URGENT FIX: Signup Error Resolution

## Problem

New users cannot sign up and get error: "We couldn't create your account due to a database policy or trigger error."

## Root Cause

The `give_free_trial()` function was incorrectly updated to use:

- Wrong table: `subscriptions` (doesn't exist) instead of `user_subscriptions`
- Wrong return type: `void` instead of `uuid`

This function runs automatically when a new user signs up (via the `on_auth_user_created` trigger on `auth.users` table).

## Immediate Fix

### Run this SQL in Supabase SQL Editor:

```sql
-- Quick Fix: Correct give_free_trial function
DROP FUNCTION IF EXISTS give_free_trial(uuid) CASCADE;

CREATE OR REPLACE FUNCTION give_free_trial(user_uuid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  subscription_id uuid;
  trial_plan_id uuid;
BEGIN
  -- Get the trial plan ID
  SELECT id INTO trial_plan_id
  FROM subscription_plans
  WHERE name = 'trial' OR is_trial = true
  LIMIT 1;

  -- If no trial plan exists, create one
  IF trial_plan_id IS NULL THEN
    INSERT INTO subscription_plans (name, price, currency, interval_type, is_trial)
    VALUES ('trial', 0, 'INR', 'month', true)
    RETURNING id INTO trial_plan_id;
  END IF;

  -- Check if user already has an active subscription
  IF EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = user_uuid
    AND status = 'active'
    AND ends_at > NOW()
  ) THEN
    SELECT id INTO subscription_id
    FROM user_subscriptions
    WHERE user_id = user_uuid
    AND status = 'active'
    AND ends_at > NOW()
    LIMIT 1;

    RETURN subscription_id;
  END IF;

  -- Create new trial subscription (14 days)
  INSERT INTO user_subscriptions (
    user_id,
    plan_id,
    starts_at,
    ends_at,
    status,
    is_trial,
    payment_provider,
    payment_id
  )
  VALUES (
    user_uuid,
    trial_plan_id,
    NOW(),
    NOW() + INTERVAL '14 days',
    'active',
    true,
    NULL,
    NULL
  )
  RETURNING id INTO subscription_id;

  RETURN subscription_id;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_trial();

COMMENT ON FUNCTION give_free_trial(uuid) IS 'Creates 14-day free trial - FIXED';
```

### Alternative: Run Migration File

Or copy and paste the entire contents of:
`supabase/migrations/20251119000004_fix_give_free_trial_function.sql`

## Verification

After running the fix, test signup:

1. **Try creating a new account**
2. **Expected result:** Account created successfully
3. **Check user has trial:**
   ```sql
   SELECT u.email, us.status, us.ends_at
   FROM auth.users u
   LEFT JOIN user_subscriptions us ON u.id = us.user_id
   ORDER BY u.created_at DESC
   LIMIT 5;
   ```

## What Went Wrong

The `20251119000002_fix_function_search_path.sql` migration incorrectly recreated the `give_free_trial` function with a simplified version that doesn't match the actual database schema.

**Incorrect version used:**

- Table: `subscriptions` ❌
- Return: `void` ❌

**Correct version should use:**

- Table: `user_subscriptions` ✅
- Return: `uuid` ✅

## Files Updated

1. ✅ `supabase/migrations/20251119000002_fix_function_search_path.sql` - Fixed in source
2. ✅ `supabase/migrations/20251119000004_fix_give_free_trial_function.sql` - Quick fix migration created

## Prevention

The updated migration file now contains the correct implementation. Future deployments should:

1. Always test signup after running migrations
2. Check Supabase Auth logs for trigger errors
3. Verify all auth.users triggers work correctly

## Next Steps

1. ✅ Run the fix SQL above
2. ✅ Test signup works
3. ✅ Check existing users have trials assigned
4. Consider running other pending migrations:
   - `20251119000003_add_store_categories.sql` (safe, no triggers)
   - Updated `20251119000002_fix_function_search_path.sql` (now fixed)

---

**Status:** 🔴 CRITICAL - Blocks new user signups
**Priority:** P0 - Fix immediately
**Estimated Fix Time:** 2 minutes (run SQL above)
