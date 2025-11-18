-- Quick Fix: Correct give_free_trial function to use proper table and return type
-- This fixes the signup error caused by incorrect function implementation

-- Drop and recreate with correct implementation
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
  -- Get the trial plan ID (assuming there's a plan with name 'trial')
  SELECT id INTO trial_plan_id
  FROM subscription_plans
  WHERE name = 'trial' OR is_trial = true
  LIMIT 1;

  -- If no trial plan exists, use a default UUID or create one
  IF trial_plan_id IS NULL THEN
    -- Create a basic trial plan if it doesn't exist
    INSERT INTO subscription_plans (name, price, currency, interval_type, is_trial)
    VALUES ('trial', 0, 'INR', 'month', true)
    RETURNING id INTO trial_plan_id;
  END IF;

  -- Check if user already has an active subscription (including trial)
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

  -- Create new trial subscription with 14-day duration
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

-- Recreate the trigger (in case it was dropped)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_trial();

-- Add comment
COMMENT ON FUNCTION give_free_trial(uuid) IS 'Creates a 14-day free trial subscription - FIXED to use correct tables';
