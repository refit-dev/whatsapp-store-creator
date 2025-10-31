-- MINIMAL DEBUG - Check what's causing the auth error
-- Run this step by step to identify the issue

-- Step 1: Check current auth configuration
SELECT 
  'Checking auth schema and permissions...' AS step;

-- Step 2: Check if there are any remaining triggers on auth.users
SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
  AND trigger_schema = 'auth';

-- Step 3: Check if there are any functions that might be called
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%user%';

-- Step 4: Check for any policies on auth.users (unlikely but worth checking)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users' 
  AND schemaname = 'auth';

-- Step 5: Temporarily disable ALL RLS on our tables
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS verification_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders DISABLE ROW LEVEL SECURITY;

-- Step 6: Drop ALL our custom tables temporarily to test
DROP TABLE IF EXISTS verification_codes CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Step 7: Drop ALL our custom functions
DROP FUNCTION IF EXISTS is_verification_rate_limited(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS record_verification_attempt(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS handle_new_user();

-- Step 8: Test if basic auth works now
SELECT 'ALL CUSTOM TABLES AND FUNCTIONS REMOVED - Test signup now' AS status;

-- Step 9: If it still fails, the issue is in Supabase auth configuration
-- Check your Supabase dashboard:
-- 1. Authentication → Settings → Email confirmation (should be OFF)
-- 2. Authentication → Settings → Email double confirmation (should be OFF)  
-- 3. Database → Replication → Check if replication is causing issues