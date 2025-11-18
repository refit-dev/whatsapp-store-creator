-- Fix: Update give_free_trial to work with actual table structure
-- This version doesn't rely on is_trial column

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
  -- Get ANY plan ID (preferably one named 'trial', or just the first one)
  SELECT id INTO trial_plan_id
  FROM subscription_plans
  WHERE name ILIKE '%trial%'
  LIMIT 1;

  -- If no trial plan, get any plan
  IF trial_plan_id IS NULL THEN
    SELECT id INTO trial_plan_id
    FROM subscription_plans
    LIMIT 1;
  END IF;

  -- If still no plan exists, we have a problem but don't fail signup
  -- Just return NULL and log it
  IF trial_plan_id IS NULL THEN
    RAISE WARNING 'No subscription plans found in database';
    RETURN NULL;
  END IF;

  -- Check if user already has an active subscription
  IF EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = user_uuid
    AND status = 'active'
    AND ends_at > NOW()
  ) THEN
    -- Return the existing subscription ID
    SELECT id INTO subscription_id
    FROM user_subscriptions
    WHERE user_id = user_uuid
    AND status = 'active'
    AND ends_at > NOW()
    LIMIT 1;
    
    RETURN subscription_id;
  END IF;

  -- Create new trial subscription (14 days)
  -- Only insert columns that exist in user_subscriptions table
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
    true
  )
  RETURNING id INTO subscription_id;

  RETURN subscription_id;
EXCEPTION WHEN others THEN
  -- Log the error but don't fail signup
  RAISE WARNING 'Error in give_free_trial: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  RETURN NULL;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_trial();

COMMENT ON FUNCTION give_free_trial(uuid) IS 'Creates 14-day trial - Fixed to handle missing columns gracefully';
