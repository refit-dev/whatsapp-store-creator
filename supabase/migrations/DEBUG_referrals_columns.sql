-- Check the actual referrals table structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'referrals'
ORDER BY ordinal_position;
