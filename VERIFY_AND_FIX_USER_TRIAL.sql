-- Verify and fix trial subscription for ankitnanda07@gmail.com

-- 1. Check current subscription status
SELECT 
  u.email,
  us.id as subscription_id,
  us.status,
  us.is_trial,
  us.starts_at,
  us.ends_at,
  us.payment_id,
  CASE 
    WHEN us.is_trial = true THEN '✅ Marked as trial'
    WHEN us.is_trial = false AND us.payment_id IS NULL THEN '❌ Should be trial but not marked'
    ELSE '✅ Paid subscription'
  END as trial_status,
  EXTRACT(day FROM (us.ends_at - NOW())) as days_remaining
FROM user_subscriptions us
JOIN auth.users u ON u.id = us.user_id
WHERE u.email = 'ankitnanda07@gmail.com'
  AND us.status = 'active'
ORDER BY us.created_at DESC;

-- 2. Fix if needed: Mark as trial if it's not a paid subscription
UPDATE user_subscriptions
SET is_trial = true
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'ankitnanda07@gmail.com')
  AND status = 'active'
  AND payment_id IS NULL
  AND is_trial = false;

-- 3. Verify the fix
SELECT 
  u.email,
  us.id as subscription_id,
  us.status,
  us.is_trial,
  EXTRACT(day FROM (us.ends_at - NOW())) as days_remaining,
  '✅ Fixed!' as result
FROM user_subscriptions us
JOIN auth.users u ON u.id = us.user_id
WHERE u.email = 'ankitnanda07@gmail.com'
  AND us.status = 'active'
ORDER BY us.created_at DESC;
