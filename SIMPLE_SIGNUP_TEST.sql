-- ALTERNATIVE: Simple signup without triggers
-- If the above doesn't work, run this to temporarily disable all triggers

-- Disable the trigger completely for testing
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Simplify user_profiles table
DROP TABLE IF EXISTS user_profiles CASCADE;
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  mobile_number VARCHAR(20),
  mobile_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS temporarily for testing
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL ON user_profiles TO public;

-- Simple verification_codes table
DROP TABLE IF EXISTS verification_codes CASCADE;
CREATE TABLE verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  type VARCHAR(20) NOT NULL,
  code VARCHAR(10) NOT NULL,
  contact VARCHAR(255) NOT NULL,
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for testing
ALTER TABLE verification_codes DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL ON verification_codes TO public;

-- Create minimal functions
CREATE OR REPLACE FUNCTION is_verification_rate_limited(
  p_contact TEXT,
  p_type TEXT,
  p_ip_address TEXT DEFAULT '0.0.0.0'
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN false; -- Always allow for testing
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION record_verification_attempt(
  p_contact TEXT,
  p_type TEXT,
  p_ip_address TEXT DEFAULT '0.0.0.0'
) RETURNS VOID AS $$
BEGIN
  NULL; -- Do nothing for testing
END;
$$ LANGUAGE plpgsql;

SELECT 'Simplified setup complete - try signup now!' AS status;