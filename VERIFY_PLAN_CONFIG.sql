-- Run this to verify the plan configuration
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
WHERE id = 'c6b675cf-0681-42f4-8e1d-103c378e6e0d';

-- Check if the update was successful
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM subscription_plans 
      WHERE id = 'c6b675cf-0681-42f4-8e1d-103c378e6e0d' 
      AND razorpay_plan_id = 'plan_RcxvNtN1ifADLw'
    ) THEN '✅ Plan is configured correctly'
    ELSE '❌ Plan is NOT configured - run the UPDATE statement'
  END as configuration_status;
