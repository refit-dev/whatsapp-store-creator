-- Add onboarding tracking fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_onboarding_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_completed);

-- Update existing users to have onboarding completed (they're already using the system)
UPDATE profiles SET onboarding_completed = TRUE WHERE created_at < NOW();
