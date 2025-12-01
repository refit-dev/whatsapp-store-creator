-- Check the current subscription status for ankitnanda07@gmail.com

-- 1. Check user info
SELECT 
  id,
  email,
  created_at,
  confirmed_at
FROM auth.users
WHERE email = 'ankitnanda07@gmail.com';

-- 2. Check all subscriptions for this user
SELECT 
  us.id,
  us.user_id,
  us.plan_id,
  us.status,
  us.is_trial,
  us.starts_at,
  us.ends_at,
  us.payment_id,
  us.payment_provider,
  us.created_at,
  EXTRACT(day FROM (us.ends_at - us.starts_at)) as duration_days,
  CASE 
    WHEN us.ends_at > NOW() THEN 'NOT EXPIRED'
    ELSE 'EXPIRED'
  END as expiry_status
FROM user_subscriptions us
JOIN auth.users u ON u.id = us.user_id
WHERE u.email = 'ankitnanda07@gmail.com'
ORDER BY us.created_at DESC;

-- 3. Check if subscription plans exist
SELECT 
  id,
  name,
  price_cents,
  duration_days,
  is_active
FROM subscription_plans
ORDER BY created_at DESC;

-- 4. Test the give_free_trial function (this will show if it would work)
-- DO NOT RUN THIS IF USER ALREADY HAS A SUBSCRIPTION
-- SELECT give_free_trial((SELECT id FROM auth.users WHERE email = 'ankitnanda07@gmail.com'));
