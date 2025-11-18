-- Check ALL triggers on auth.users table
SELECT 
  tgname as trigger_name,
  tgenabled as is_enabled,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND tgisinternal = false
ORDER BY tgname;

-- Check what functions these triggers call
SELECT DISTINCT
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'auth.users'::regclass
  AND t.tgisinternal = false
ORDER BY p.proname;
