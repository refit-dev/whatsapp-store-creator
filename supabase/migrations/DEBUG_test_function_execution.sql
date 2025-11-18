-- Test actual function execution to see exact error
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  subscription_result uuid;
  error_message text;
  error_detail text;
  error_hint text;
BEGIN
  RAISE NOTICE '=== TESTING GIVE_FREE_TRIAL FUNCTION ===';
  RAISE NOTICE 'Test User ID: %', test_user_id;
  RAISE NOTICE '';
  
  BEGIN
    RAISE NOTICE 'Calling give_free_trial(%)', test_user_id;
    subscription_result := give_free_trial(test_user_id);
    RAISE NOTICE 'SUCCESS! Returned subscription_id: %', subscription_result;
    
    -- Show what was created
    RAISE NOTICE '';
    RAISE NOTICE '=== SUBSCRIPTION DETAILS ===';
    RAISE NOTICE 'Querying user_subscriptions...';
    
    -- This will output the subscription
    PERFORM id, user_id, plan_id, status, is_trial, starts_at, ends_at
    FROM user_subscriptions 
    WHERE user_id = test_user_id;
    
    RAISE NOTICE '';
    
  EXCEPTION WHEN others THEN
    GET STACKED DIAGNOSTICS
      error_message = MESSAGE_TEXT,
      error_detail = PG_EXCEPTION_DETAIL,
      error_hint = PG_EXCEPTION_HINT;
      
    RAISE NOTICE 'FAILED WITH ERROR:';
    RAISE NOTICE '  Message: %', error_message;
    RAISE NOTICE '  Detail: %', COALESCE(error_detail, 'N/A');
    RAISE NOTICE '  Hint: %', COALESCE(error_hint, 'N/A');
    RAISE NOTICE '  SQL State: %', SQLSTATE;
  END;
  
  -- Show subscription if created
  IF subscription_result IS NOT NULL THEN
    RAISE NOTICE 'Subscription successfully created:';
    FOR subscription_result IN 
      SELECT id, user_id, plan_id, status, is_trial, 
             starts_at::text, ends_at::text
      FROM user_subscriptions 
      WHERE user_id = test_user_id
    LOOP
      RAISE NOTICE 'Found subscription: %', subscription_result;
    END LOOP;
    
    -- Clean up test data
    DELETE FROM user_subscriptions WHERE user_id = test_user_id;
    RAISE NOTICE 'Test data cleaned up';
  END IF;
  
END $$;
