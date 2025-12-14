-- Quick fix to enable onboarding for new users
-- Run this in your Supabase SQL Editor

-- Step 1: First, run the migration to create profiles table
-- Copy and run the contents of: supabase/migrations/20251214000000_create_profiles_table.sql
-- OR run this if profiles table doesn't exist:

-- Check if profiles table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    RAISE NOTICE 'Profiles table does not exist. Please run: supabase/migrations/20251214000000_create_profiles_table.sql';
  END IF;
END $$;

-- Step 2: Reset onboarding for recently created users (last 24 hours)
-- These are likely test users or new users who should see onboarding
UPDATE public.profiles 
SET 
  onboarding_completed = FALSE,
  onboarding_skipped = FALSE,
  last_onboarding_step = 0,
  onboarding_completed_at = NULL
WHERE created_at >= NOW() - INTERVAL '1 day';

-- Step 3: Verify the changes
SELECT 
  p.id,
  p.email,
  p.created_at,
  p.onboarding_completed,
  p.onboarding_skipped,
  u.email as auth_email
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.created_at >= NOW() - INTERVAL '7 days'
ORDER BY p.created_at DESC;
