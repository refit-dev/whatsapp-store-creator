-- NOTE: We cannot directly modify auth.users table as it's managed by Supabase Auth
-- Instead, we'll use user_metadata in auth.users and create our own user_profiles table

-- Create user_profiles table to extend user information
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

-- RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Function to create user profile automatically
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (id, mobile_number)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'mobile_number');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create verification_codes table for OTP management
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

-- RLS policies for verification_codes
CREATE POLICY "Users can view their own verification codes" ON verification_codes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verification codes" ON verification_codes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verification codes" ON verification_codes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Allow anonymous users to create verification codes during signup
CREATE POLICY "Anonymous can create verification codes" ON verification_codes
  FOR INSERT TO anon WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_type ON verification_codes(type);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);

-- Function to clean up expired verification codes
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes 
  WHERE expires_at < NOW() AND used = false;
END;
$$ LANGUAGE plpgsql;

-- Create a function to be called periodically to clean up expired codes
-- Note: You can set up a cron job in Supabase Dashboard or call this manually
-- For Supabase, you can also use Edge Functions with cron triggers

-- Uncomment the next line if pg_cron extension is available in your Supabase project
-- SELECT cron.schedule('cleanup-verification-codes', '0 * * * *', 'SELECT cleanup_expired_verification_codes();');

-- Create verification_attempts table to prevent abuse
CREATE TABLE IF NOT EXISTS verification_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact VARCHAR(255) NOT NULL, -- email or phone
  type VARCHAR(20) NOT NULL, -- 'email' or 'mobile'
  ip_address INET,
  attempts INTEGER DEFAULT 1,
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for verification_attempts
ALTER TABLE verification_attempts ENABLE ROW LEVEL SECURITY;

-- RLS policies for verification_attempts (restrictive for security)
CREATE POLICY "Service role can manage verification attempts" ON verification_attempts
  FOR ALL TO service_role;

-- Indexes for verification_attempts
CREATE INDEX IF NOT EXISTS idx_verification_attempts_contact ON verification_attempts(contact);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_ip ON verification_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_blocked_until ON verification_attempts(blocked_until);

-- Function to check if a contact/IP is rate limited
CREATE OR REPLACE FUNCTION is_verification_rate_limited(
  p_contact VARCHAR(255),
  p_type VARCHAR(20),
  p_ip_address INET DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_attempts INTEGER;
  v_blocked_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check contact-based rate limiting
  SELECT attempts, blocked_until 
  INTO v_attempts, v_blocked_until
  FROM verification_attempts 
  WHERE contact = p_contact AND type = p_type;
  
  -- If blocked until a future time, return true
  IF v_blocked_until IS NOT NULL AND v_blocked_until > NOW() THEN
    RETURN true;
  END IF;
  
  -- If more than 5 attempts in the last hour, rate limit
  IF v_attempts IS NOT NULL AND v_attempts >= 5 THEN
    -- Check if last attempt was within the last hour
    IF EXISTS (
      SELECT 1 FROM verification_attempts 
      WHERE contact = p_contact 
      AND type = p_type 
      AND last_attempt_at > NOW() - INTERVAL '1 hour'
    ) THEN
      -- Block for 1 hour
      UPDATE verification_attempts 
      SET blocked_until = NOW() + INTERVAL '1 hour'
      WHERE contact = p_contact AND type = p_type;
      RETURN true;
    ELSE
      -- Reset attempts if more than 1 hour has passed
      UPDATE verification_attempts 
      SET attempts = 1, last_attempt_at = NOW(), blocked_until = NULL
      WHERE contact = p_contact AND type = p_type;
      RETURN false;
    END IF;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to record verification attempt
CREATE OR REPLACE FUNCTION record_verification_attempt(
  p_contact VARCHAR(255),
  p_type VARCHAR(20),
  p_ip_address INET DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO verification_attempts (contact, type, ip_address, attempts, last_attempt_at)
  VALUES (p_contact, p_type, p_ip_address, 1, NOW())
  ON CONFLICT (contact, type) DO UPDATE SET
    attempts = verification_attempts.attempts + 1,
    last_attempt_at = NOW(),
    ip_address = COALESCE(EXCLUDED.ip_address, verification_attempts.ip_address);
END;
$$ LANGUAGE plpgsql;

-- Add unique constraint to prevent duplicate contact/type combinations in attempts table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_contact_type' 
    AND table_name = 'verification_attempts'
  ) THEN
    ALTER TABLE verification_attempts ADD CONSTRAINT unique_contact_type UNIQUE (contact, type);
  END IF;
END $$;