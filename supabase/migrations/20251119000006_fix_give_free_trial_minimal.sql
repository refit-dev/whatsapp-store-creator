-- Safest fix: Minimal give_free_trial that only uses columns we KNOW exist
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

  -- If no plan exists, don't fail signup - just return NULL
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

  -- Create subscription with ONLY the columns we verified exist
  -- From your earlier message: id, user_id, plan_id, starts_at, ends_at, status, 
  -- payment_id, payment_provider, is_trial, created_at
  INSERT INTO user_subscriptions (
    user_id,
    plan_id,
    starts_at,
    ends_at,
    status
  )
  VALUES (
    user_uuid,
    trial_plan_id,
    NOW(),
    NOW() + INTERVAL '14 days',
    'active'
  )
  RETURNING id INTO subscription_id;

  RETURN subscription_id;
  
EXCEPTION WHEN others THEN
  -- Log error but don't block signup
  RAISE WARNING 'give_free_trial error for user %: % (SQLSTATE: %)', user_uuid, SQLERRM, SQLSTATE;
  RETURN NULL;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_trial();

COMMENT ON FUNCTION give_free_trial(uuid) IS 'Creates 14-day trial - Minimal safe version';
