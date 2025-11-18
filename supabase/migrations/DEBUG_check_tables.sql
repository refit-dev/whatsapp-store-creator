-- Debug: Check if required tables exist

-- Check if user_subscriptions table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_subscriptions'
) as user_subscriptions_exists;

-- Check if subscription_plans table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'subscription_plans'
) as subscription_plans_exists;

-- Check current triggers on auth.users
SELECT 
  trigger_name,
  action_statement,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- Check if auto_assign_trial function exists
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('auto_assign_trial', 'give_free_trial', 'create_user_referral_code')
ORDER BY routine_name;

-- If user_subscriptions exists, show its structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_subscriptions'
ORDER BY ordinal_position;
