-- COMPLETE FIX: Create profiles table and enable onboarding for new users
-- Run this entire file in your Supabase SQL Editor

-- ============================================================================
-- PART 1: Create profiles table if it doesn't exist
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  mobile_number TEXT,
  
  -- Onboarding tracking
  onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL,
  onboarding_skipped BOOLEAN DEFAULT FALSE NOT NULL,
  last_onboarding_step INTEGER DEFAULT 0 NOT NULL,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON public.profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- PART 2: Create trigger function for new user signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, mobile_number)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'mobile_number'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail user signup if profile creation fails
  RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_profile_for_new_user();

-- ============================================================================
-- PART 3: Create updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();

-- ============================================================================
-- PART 4: Backfill profiles for existing users
-- ============================================================================

-- Create profiles for any existing auth users that don't have one yet
INSERT INTO public.profiles (id, email, created_at, onboarding_completed)
SELECT 
  u.id, 
  u.email,
  u.created_at,
  TRUE -- Mark existing users as having completed onboarding
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- ============================================================================
-- PART 5: Fix onboarding for recent/new users
-- ============================================================================

-- Reset onboarding for users created in the last 24 hours
-- These should see the onboarding guide
UPDATE public.profiles 
SET 
  onboarding_completed = FALSE,
  onboarding_skipped = FALSE,
  last_onboarding_step = 0,
  onboarding_completed_at = NULL
WHERE created_at >= NOW() - INTERVAL '1 day';

-- ============================================================================
-- PART 6: Verify the results
-- ============================================================================

-- Show recent users and their onboarding status
SELECT 
  p.id,
  p.email,
  p.created_at,
  p.onboarding_completed,
  p.onboarding_skipped,
  u.email as auth_email,
  CASE 
    WHEN p.created_at >= NOW() - INTERVAL '1 day' THEN 'NEW - Should see onboarding'
    ELSE 'EXISTING - Onboarding completed'
  END as status
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC
LIMIT 20;

-- Show summary
SELECT 
  COUNT(*) FILTER (WHERE onboarding_completed = TRUE) as completed_count,
  COUNT(*) FILTER (WHERE onboarding_completed = FALSE) as pending_count,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day') as new_users_last_24h
FROM public.profiles;

-- ============================================================================
-- BONUS: Ensure account_deletion_logs table exists (if needed by your app)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.account_deletion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT,
  deletion_reason TEXT,
  stores_deleted INTEGER DEFAULT 0,
  products_deleted INTEGER DEFAULT 0,
  orders_deleted INTEGER DEFAULT 0,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_account_deletion_logs_user ON public.account_deletion_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_account_deletion_logs_deleted_at ON public.account_deletion_logs(deleted_at);

COMMENT ON TABLE public.account_deletion_logs IS 'Audit log of account deletions for GDPR compliance';
