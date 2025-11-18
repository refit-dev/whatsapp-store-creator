-- Test BOTH triggers to see which one fails
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  test_email text := 'test_' || test_user_id::text || '@example.com';
BEGIN
  RAISE NOTICE '=== TESTING SIGNUP TRIGGERS ===';
  RAISE NOTICE 'Test User ID: %', test_user_id;
  RAISE NOTICE 'Test Email: %', test_email;
  RAISE NOTICE '';
  
  -- Test 1: create_user_referral_code (runs first)
  BEGIN
    RAISE NOTICE 'Test 1: Testing create_user_referral_code trigger...';
    INSERT INTO referrals (user_id, referral_code)
    VALUES (test_user_id, generate_referral_code());
    RAISE NOTICE 'SUCCESS: Referral code created';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'FAILED: create_user_referral_code - % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  END;
  
  RAISE NOTICE '';
  
  -- Test 2: give_free_trial (runs second)
  BEGIN
    RAISE NOTICE 'Test 2: Testing give_free_trial function...';
    PERFORM give_free_trial(test_user_id);
    RAISE NOTICE 'SUCCESS: give_free_trial completed';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'FAILED: give_free_trial - % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  END;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== CHECKING RESULTS ===';
  
  -- Check referral
  IF EXISTS (SELECT 1 FROM referrals WHERE user_id = test_user_id) THEN
    RAISE NOTICE 'Referral created: %', (SELECT referral_code FROM referrals WHERE user_id = test_user_id);
  ELSE
    RAISE NOTICE 'NO REFERRAL CREATED';
  END IF;
  
  -- Check subscription
  IF EXISTS (SELECT 1 FROM user_subscriptions WHERE user_id = test_user_id) THEN
    RAISE NOTICE 'Subscription created: %', (SELECT id FROM user_subscriptions WHERE user_id = test_user_id);
  ELSE
    RAISE NOTICE 'NO SUBSCRIPTION CREATED';
  END IF;
  
  -- Cleanup
  DELETE FROM user_subscriptions WHERE user_id = test_user_id;
  DELETE FROM referrals WHERE user_id = test_user_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Test data cleaned up';
  
END $$;
