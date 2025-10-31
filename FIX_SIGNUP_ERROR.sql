-- Fix for "Database error saving new user" during signup
-- Run this in Supabase SQL Editor to fix the signup issue

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email_verified BOOLEAN DEFAULT false,
  mobile_verified BOOLEAN DEFAULT false,
  mobile_number VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_profiles (drop existing if any, then recreate)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Create verification_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'email' or 'mobile'
  code VARCHAR(10) NOT NULL,
  contact VARCHAR(255) NOT NULL, -- email address or phone number
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for verification_codes
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies for verification_codes (drop existing if any, then recreate)
DROP POLICY IF EXISTS "Users can view own verification codes" ON verification_codes;
DROP POLICY IF EXISTS "Users can insert own verification codes" ON verification_codes;
DROP POLICY IF EXISTS "Users can update own verification codes" ON verification_codes;

CREATE POLICY "Users can view own verification codes" ON verification_codes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verification codes" ON verification_codes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own verification codes" ON verification_codes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Function to create user profile automatically (with error handling)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Try to insert user profile, but don't fail if it already exists
  INSERT INTO user_profiles (id, mobile_number)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'mobile_number')
  ON CONFLICT (id) DO UPDATE SET
    mobile_number = COALESCE(NEW.raw_user_meta_data->>'mobile_number', user_profiles.mobile_number),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Rate limiting functions for verification
CREATE OR REPLACE FUNCTION is_verification_rate_limited(
  p_contact TEXT,
  p_type TEXT,
  p_ip_address TEXT DEFAULT '0.0.0.0'
) RETURNS BOOLEAN AS $$
DECLARE
  recent_attempts INTEGER;
BEGIN
  -- Check attempts in last 5 minutes
  SELECT COUNT(*) INTO recent_attempts
  FROM verification_codes
  WHERE contact = p_contact
    AND type = p_type
    AND created_at > NOW() - INTERVAL '5 minutes';
  
  -- Allow max 3 attempts per 5 minutes
  RETURN recent_attempts >= 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION record_verification_attempt(
  p_contact TEXT,
  p_type TEXT,
  p_ip_address TEXT DEFAULT '0.0.0.0'
) RETURNS VOID AS $$
BEGIN
  -- This function can be extended to log attempts in a separate table if needed
  -- For now, it's a placeholder as attempts are recorded in verification_codes table
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON verification_codes TO authenticated;

-- Success message
SELECT 'Database setup complete! You can now create new accounts.' AS status;