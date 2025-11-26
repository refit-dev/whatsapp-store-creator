-- FINAL FIX: Update the plan that your subscription uses
-- Your active subscription uses plan: c6b675cf-0681-42f4-8e1d-103c378e6e0d

-- Update the specific plan
UPDATE subscription_plans 
SET razorpay_plan_id = 'plan_RcxvNtN1ifADLw'
WHERE id = 'c6b675cf-0681-42f4-8e1d-103c378e6e0d';

-- Verify it worked
SELECT 
  id, 
  name, 
  price_cents/100.0 as price_rupees,
  razorpay_plan_id,
  '✅ SUCCESS - Plan configured!' as status
FROM subscription_plans 
WHERE id = 'c6b675cf-0681-42f4-8e1d-103c378e6e0d';

-- Clean up: Delete the 2 duplicate plans (optional but recommended)
DELETE FROM subscription_plans 
WHERE id IN (
  '6554c298-06d1-414c-a911-392c64bda733',
  '4571fee6-240a-47ea-84e5-f2d6ad27806f'
);

-- SOLUTION: Delete the 2 duplicate plans that don't have subscriptions
-- Keep only the one with the Razorpay plan ID configured

-- Step 1: Check which plan is being used by your subscription
SELECT 
  us.id as subscription_id,
  us.plan_id,
  sp.name,
  sp.razorpay_plan_id,
  'This is the plan being used by active subscription' as note
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.user_id = auth.uid()
ORDER BY us.created_at DESC
LIMIT 1;

-- Step 2: Delete unused duplicate plans (after confirming which one to keep)
-- Uncomment these lines after verifying which plan to keep:
-- DELETE FROM subscription_plans 
-- WHERE name = 'Monthly Pro' 
--   AND price_cents = 25900 
--   AND razorpay_plan_id IS NULL
--   AND id NOT IN (
--     SELECT plan_id FROM user_subscriptions
--   );

-- Verify the update
SELECT 
  id, 
  name, 
  price_cents/100.0 as price_rupees,
  razorpay_plan_id,
  CASE 
    WHEN razorpay_plan_id IS NOT NULL THEN '✅ Configured'
    ELSE '❌ Missing'
  END as status
FROM subscription_plans 
ORDER BY price_cents;

-- Show which plan was updated
SELECT 
  '✅ SUCCESS: Plan configured!' as message,
  name,
  price_cents/100.0 as price_rupees,
  razorpay_plan_id
FROM subscription_plans
WHERE razorpay_plan_id = 'plan_RcxvNtN1ifADLw';
