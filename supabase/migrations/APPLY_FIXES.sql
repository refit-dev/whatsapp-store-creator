-- Quick Reference: Apply All Function Search Path Fixes
-- 
-- IMPORTANT: This is just a verification script.
-- You need to run the actual migration file: 20251119000002_fix_function_search_path.sql
-- 
-- Steps:
-- 1. Open Supabase SQL Editor
-- 2. Copy and paste the contents of: supabase/migrations/20251119000002_fix_function_search_path.sql
-- 3. Run it
-- 4. Then run this verification query below to confirm all functions are fixed:

-- Verification Query - Run this AFTER applying the migration:
SELECT 
  proname as function_name,
  CASE WHEN proconfig IS NOT NULL THEN '✓ Fixed' ELSE '✗ Missing' END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND proname IN (
    'is_admin',
    'cleanup_old_login_attempts',
    'give_free_trial',
    'cleanup_old_api_requests',
    'get_request_count',
    'cleanup_old_virus_scans',
    'generate_referral_code',
    'create_user_referral_code',
    'cleanup_expired_verification_codes',
    'is_verification_rate_limited',
    'record_verification_attempt',
    'set_secure_storage_headers',
    'check_storage_security',
    'extend_subscription',
    'delete_user_account',
    'auto_assign_trial',
    'process_referral_reward',
    'get_account_deletion_preview',
    'create_image_reviews'
  )
ORDER BY proname;
