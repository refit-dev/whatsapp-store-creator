-- Test the signup flow manually to see where it fails

BEGIN;

-- Simulate what happens when a user signs up
-- Create a test UUID
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  subscription_result uuid;
BEGIN
  RAISE NOTICE 'Testing signup flow for user: %', test_user_id;
  
  -- Test 1: Check if give_free_trial function exists and can be called
  BEGIN
    RAISE NOTICE 'Test 1: Calling give_free_trial()...';
    subscription_result := give_free_trial(test_user_id);
    RAISE NOTICE 'SUCCESS: give_free_trial returned: %', subscription_result;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'FAILED: give_free_trial error: % %', SQLERRM, SQLSTATE;
  END;
  
  -- Test 2: Check if auto_assign_trial function exists and can be called
  BEGIN
    RAISE NOTICE 'Test 2: Testing auto_assign_trial()...';
    -- This function expects NEW record from trigger, so we can't test it directly here
    RAISE NOTICE 'Cannot test auto_assign_trial directly (requires trigger context)';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'FAILED: auto_assign_trial error: % %', SQLERRM, SQLSTATE;
  END;
  
  -- Test 3: Check subscription was created
  IF EXISTS (SELECT 1 FROM user_subscriptions WHERE user_id = test_user_id) THEN
    RAISE NOTICE 'SUCCESS: Subscription created for test user';
    
    -- Show the subscription details
    SELECT 
      id, user_id, plan_id, status, is_trial, starts_at, ends_at
    FROM user_subscriptions 
    WHERE user_id = test_user_id;
    
  ELSE
    RAISE NOTICE 'FAILED: No subscription found for test user';
  END IF;
  
END $$;

-- Rollback so we don't actually create test data
ROLLBACK;

-- Additional checks
SELECT 'Checking function definitions...' as check_step;

-- Show give_free_trial function signature
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  p.prosecdef as is_security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'give_free_trial';
