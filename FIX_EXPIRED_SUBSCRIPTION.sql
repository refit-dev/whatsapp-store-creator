-- Check your current subscription status
SELECT 
  id,
  user_id,
  plan_id,
  status,
  starts_at,
  ends_at,
  CASE 
    WHEN ends_at < NOW() THEN '❌ EXPIRED - Should be inactive'
    WHEN status = 'active' AND ends_at >= NOW() THEN '✅ Active and valid'
    ELSE '⚠️ Needs review'
  END as actual_status,
  NOW() as current_time
FROM user_subscriptions
ORDER BY created_at DESC
LIMIT 5;

-- FIX: Update expired subscriptions to 'expired' status
UPDATE user_subscriptions
SET status = 'expired'
WHERE status = 'active' 
  AND ends_at < NOW();

-- Verify the fix
SELECT 
  'Fixed ' || COUNT(*)::text || ' expired subscriptions' as result
FROM user_subscriptions
WHERE status = 'expired' 
  AND ends_at < NOW();

-- Check current active subscriptions
SELECT 
  COUNT(*) as active_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No active subscriptions - user can subscribe'
    ELSE '⚠️ User has ' || COUNT(*)::text || ' active subscription(s)'
  END as message
FROM user_subscriptions
WHERE status = 'active' 
  AND ends_at >= NOW();
