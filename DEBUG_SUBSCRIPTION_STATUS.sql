-- Debug: Check EXACTLY what the database has for ankitnanda07@gmail.com

-- 1. Get the user ID first
SELECT 
  id as user_id,
  email,
  created_at,
  '👤 User Info' as section
FROM auth.users
WHERE email = 'ankitnanda07@gmail.com';

-- 2. Get ALL subscriptions (not just active)
SELECT 
  us.id as subscription_id,
  us.user_id,
  us.status,
  us.is_trial,
  us.starts_at,
  us.ends_at,
  us.payment_id,
  us.payment_provider,
  us.created_at,
  sp.name as plan_name,
  EXTRACT(day FROM (us.ends_at - us.starts_at)) as duration_days,
  EXTRACT(day FROM (us.ends_at - NOW())) as days_remaining,
  CASE 
    WHEN us.ends_at < NOW() THEN '❌ EXPIRED'
    WHEN us.ends_at > NOW() THEN '✅ ACTIVE'
  END as time_status,
  '📋 Subscription Details' as section
FROM user_subscriptions us
LEFT JOIN subscription_plans sp ON sp.id = us.plan_id
WHERE us.user_id = (SELECT id FROM auth.users WHERE email = 'ankitnanda07@gmail.com')
ORDER BY us.created_at DESC;

-- 3. If no subscription found, this will show
SELECT 
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM user_subscriptions 
      WHERE user_id = (SELECT id FROM auth.users WHERE email = 'ankitnanda07@gmail.com')
    ) THEN '❌ NO SUBSCRIPTION FOUND - This is why Start Trial shows'
    ELSE '✅ Subscription exists'
  END as diagnosis;

-- 4. Check what the query in SubscriptionProvider.tsx would return
SELECT 
  us.*,
  sp.name,
  sp.price_cents,
  sp.duration_days,
  '🔍 What SubscriptionProvider sees' as section
FROM user_subscriptions us
LEFT JOIN subscription_plans sp ON sp.id = us.plan_id
WHERE us.user_id = (SELECT id FROM auth.users WHERE email = 'ankitnanda07@gmail.com')
  AND us.status = 'active'  -- This is the key filter!
ORDER BY us.ends_at DESC
LIMIT 1;
