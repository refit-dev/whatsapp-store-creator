-- Check Row Level Security policies on user_subscriptions table

-- 1. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'user_subscriptions';

-- 2. Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_subscriptions';

-- 3. Test: Can the user read their own subscription using their auth?
-- This simulates what the frontend query does
SET request.jwt.claims.sub = '3ed96dc4-528d-451c-80ce-be3f9e5da61e';

SELECT 
  us.id,
  us.user_id,
  us.status,
  us.is_trial,
  us.ends_at,
  sp.name,
  sp.price_cents,
  sp.duration_days
FROM user_subscriptions us
LEFT JOIN subscription_plans sp ON sp.id = us.plan_id
WHERE us.user_id = '3ed96dc4-528d-451c-80ce-be3f9e5da61e'::uuid
  AND us.status = 'active'
ORDER BY us.ends_at DESC
LIMIT 1;
