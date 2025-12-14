-- Create profiles table to track user metadata including onboarding status
-- This extends auth.users with application-specific data

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

-- Create index for faster onboarding queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON public.profiles(onboarding_completed);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Function to automatically create profile on user signup
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
END;
$$;

-- Trigger to create profile on new user signup
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_profile_for_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger to update updated_at on profile updates
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();

-- Backfill profiles for existing users
INSERT INTO public.profiles (id, email, created_at, onboarding_completed)
SELECT 
  id, 
  email,
  created_at,
  TRUE -- Mark existing users as having completed onboarding
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.profiles IS 'User profile information and onboarding tracking';
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Whether user has completed the onboarding tour';
COMMENT ON COLUMN public.profiles.onboarding_skipped IS 'Whether user has skipped the onboarding tour';
COMMENT ON COLUMN public.profiles.last_onboarding_step IS 'Last onboarding step completed (for resuming)';
