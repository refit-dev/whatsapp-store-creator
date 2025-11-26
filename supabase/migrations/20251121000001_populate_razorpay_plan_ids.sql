-- Populate Razorpay Plan IDs for subscription plans
-- Replace these with your actual Razorpay plan IDs from Razorpay Dashboard

-- First, check if plans exist and log current state
DO $$
DECLARE
  plan_record RECORD;
BEGIN
  RAISE NOTICE '=== Current Subscription Plans ===';
  FOR plan_record IN 
    SELECT id, name, price_cents, razorpay_plan_id 
    FROM subscription_plans 
    ORDER BY price_cents
  LOOP
    RAISE NOTICE 'Plan: % | Price: %₹ | Razorpay ID: %', 
      plan_record.name, 
      (plan_record.price_cents / 100.0), 
      COALESCE(plan_record.razorpay_plan_id, 'NOT SET');
  END LOOP;
END $$;

-- Update plans with Razorpay Plan IDs
-- IMPORTANT: You need to create these plans in Razorpay Dashboard first!
-- Instructions:
-- 1. Go to https://dashboard.razorpay.com/app/subscriptions/plans
-- 2. Create plans matching your pricing
-- 3. Copy the plan_id values (they look like: plan_Nxxxxxxxxxxxxxx)
-- 4. Update the queries below with your actual plan IDs

-- Update with actual Razorpay Plan ID: plan_RcxvNtN1ifADLw
-- This is for the Watzy Pro Plan at ₹259/month

UPDATE subscription_plans 
SET razorpay_plan_id = 'plan_RcxvNtN1ifADLw'
WHERE price_cents = 25900 
  AND razorpay_plan_id IS NULL;

-- If you have other plans, create them in Razorpay Dashboard first:
-- https://dashboard.razorpay.com/app/subscriptions/plans
-- Then add UPDATE statements here with their plan IDs

-- Example for additional plans:
-- UPDATE subscription_plans 
-- SET razorpay_plan_id = 'plan_YOUR_PLAN_ID_HERE'
-- WHERE name ILIKE '%pro%' AND price_cents = 59900;

-- Verify updates
DO $$
DECLARE
  plan_record RECORD;
  missing_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Verification Results ===';
  
  FOR plan_record IN 
    SELECT id, name, price_cents, razorpay_plan_id 
    FROM subscription_plans 
    WHERE is_trial = false
    ORDER BY price_cents
  LOOP
    IF plan_record.razorpay_plan_id IS NULL OR plan_record.razorpay_plan_id LIKE '%replace_with_actual_id%' THEN
      RAISE WARNING '❌ Plan "%" (₹%) - Missing Razorpay Plan ID', 
        plan_record.name, 
        (plan_record.price_cents / 100.0);
      missing_count := missing_count + 1;
    ELSE
      RAISE NOTICE '✅ Plan "%" (₹%) - Razorpay ID: %', 
        plan_record.name, 
        (plan_record.price_cents / 100.0),
        plan_record.razorpay_plan_id;
    END IF;
  END LOOP;
  
  IF missing_count > 0 THEN
    RAISE WARNING '';
    RAISE WARNING '⚠️  % plan(s) need Razorpay Plan IDs configured', missing_count;
    RAISE WARNING 'Create plans at: https://dashboard.razorpay.com/app/subscriptions/plans';
    RAISE WARNING 'Then update this migration with actual plan IDs';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '✅ All subscription plans have Razorpay Plan IDs configured';
  END IF;
END $$;
