-- First, let's see if there's a referral table issue
-- Check if referrals table exists and its structure
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'referrals'
) as referrals_exists;

-- Check referrals table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'referrals'
ORDER BY ordinal_position;

-- Check if generate_referral_code function exists
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'generate_referral_code';
