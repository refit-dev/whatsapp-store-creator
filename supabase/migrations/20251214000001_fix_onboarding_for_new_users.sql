-- Fix onboarding tracking to properly handle new users
-- The previous migration incorrectly marked ALL users as having completed onboarding
-- because "created_at < NOW()" is always true

-- NOTE: This migration assumes profiles table already exists
-- If not, run 20251214000000_create_profiles_table.sql first

-- First, reset onboarding status for recent users
-- We'll mark users created more than 1 day ago as completed (they've already been using the system)
-- and new users as not completed (they need to see onboarding)
UPDATE public.profiles 
SET 
  onboarding_completed = FALSE,
  onboarding_skipped = FALSE,
  last_onboarding_step = 0,
  onboarding_completed_at = NULL
WHERE created_at >= NOW() - INTERVAL '1 day';

-- Mark existing users (created more than 1 day ago) as completed
UPDATE public.profiles 
SET 
  onboarding_completed = TRUE,
  onboarding_completed_at = created_at
WHERE created_at < NOW() - INTERVAL '1 day'
  AND onboarding_completed = FALSE;

-- Ensure new users default to not completed
ALTER TABLE public.profiles 
  ALTER COLUMN onboarding_completed SET DEFAULT FALSE,
  ALTER COLUMN onboarding_skipped SET DEFAULT FALSE,
  ALTER COLUMN last_onboarding_step SET DEFAULT 0;

COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Whether user has completed the onboarding tour';
COMMENT ON COLUMN public.profiles.onboarding_skipped IS 'Whether user has skipped the onboarding tour';
COMMENT ON COLUMN public.profiles.last_onboarding_step IS 'Last onboarding step completed (for resuming)';
