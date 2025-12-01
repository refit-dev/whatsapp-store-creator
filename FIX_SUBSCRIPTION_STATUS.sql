-- Fix: The subscription is being created but status might not be 'active'

-- 1. Check what status the subscription actually has
SELECT 
  us.id,
  us.status,
  us.is_trial,
  us.starts_at,
  us.ends_at,
  u.email,
  '❓ Current Status' as check_type
FROM user_subscriptions us
JOIN auth.users u ON u.id = us.user_id
WHERE u.email = 'ankitnanda07@gmail.com'
ORDER BY us.created_at DESC
LIMIT 1;

-- 2. Fix: Set status to 'active' if it's not
UPDATE user_subscriptions
SET 
  status = 'active',
  is_trial = true
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'ankitnanda07@gmail.com')
  AND id IN (
    SELECT id FROM user_subscriptions 
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'ankitnanda07@gmail.com')
    ORDER BY created_at DESC 
    LIMIT 1
  );

-- 3. Verify the fix
SELECT 
  us.id,
  us.status,
  us.is_trial,
  us.starts_at,
  us.ends_at,
  EXTRACT(day FROM (us.ends_at - NOW())) as days_remaining,
  u.email,
  '✅ After Fix' as check_type
FROM user_subscriptions us
JOIN auth.users u ON u.id = us.user_id
WHERE u.email = 'ankitnanda07@gmail.com'
  AND us.status = 'active'
ORDER BY us.created_at DESC
LIMIT 1;
