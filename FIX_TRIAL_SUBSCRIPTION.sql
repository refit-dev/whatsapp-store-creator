-- Fix give_free_trial function to properly set is_trial = true
-- Run this in Supabase SQL Editor

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
  -- Get first available plan
  SELECT id INTO trial_plan_id
  FROM subscription_plans
  LIMIT 1;

  -- If no plan exists, don't fail - just return NULL
  IF trial_plan_id IS NULL THEN
    RAISE WARNING 'No subscription plans exist';
    RETURN NULL;
  END IF;

  -- Check if user already has subscription
  SELECT id INTO subscription_id
  FROM user_subscriptions
  WHERE user_id = user_uuid
  LIMIT 1;
  
  IF subscription_id IS NOT NULL THEN
    RETURN subscription_id;
  END IF;

  -- Create subscription with is_trial = true
  INSERT INTO user_subscriptions (
    user_id,
    plan_id,
    starts_at,
    ends_at,
    status,
    is_trial
  )
  VALUES (
    user_uuid,
    trial_plan_id,
    NOW(),
    NOW() + INTERVAL '14 days',
    'active',
    true  -- This is the critical fix!
  )
  RETURNING id INTO subscription_id;

  RETURN subscription_id;
  
EXCEPTION WHEN others THEN
  -- Log error but don't block signup
  RAISE WARNING 'give_free_trial error for user %: % (SQLSTATE: %)', user_uuid, SQLERRM, SQLSTATE;
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION give_free_trial(uuid) IS 'Creates 14-day trial subscription with is_trial flag set';

-- Also fix any existing subscriptions that should be trials
-- (subscriptions that were created by give_free_trial but missing is_trial flag)
UPDATE user_subscriptions
SET is_trial = true
WHERE is_trial = false
  AND payment_id IS NULL
  AND payment_provider IS NULL
  AND (ends_at - starts_at) <= INTERVAL '15 days'
  AND status = 'active';

-- Verify the fix
SELECT 
  u.email,
  us.id,
  us.status,
  us.is_trial,
  us.starts_at,
  us.ends_at,
  EXTRACT(day FROM (us.ends_at - us.starts_at)) as duration_days
FROM user_subscriptions us
JOIN auth.users u ON u.id = us.user_id
WHERE u.email = 'ankitnanda07@gmail.com'
ORDER BY us.created_at DESC
LIMIT 1;
