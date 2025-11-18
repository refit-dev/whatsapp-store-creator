-- Check subscription_plans table
SELECT 'Checking subscription_plans table...' as check_step;

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'subscription_plans'
) as subscription_plans_exists;

-- If it exists, show the structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'subscription_plans'
ORDER BY ordinal_position;

-- Show all plans (using * to see all columns)
SELECT *
FROM subscription_plans
ORDER BY created_at;

-- Check if trial plan exists (by name only since is_trial column doesn't exist)
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'trial') 
    THEN 'YES - Trial plan exists'
    ELSE 'NO - Trial plan missing'
  END as trial_plan_status;

-- Count total plans
SELECT COUNT(*) as total_plans FROM subscription_plans;
