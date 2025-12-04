-- Create a simple table to store user referral codes
-- One user = one unique code that can be shared multiple times
CREATE TABLE IF NOT EXISTS user_referral_codes (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups by code
CREATE INDEX IF NOT EXISTS idx_user_referral_codes_code ON user_referral_codes(referral_code);

-- Enable RLS
ALTER TABLE user_referral_codes ENABLE ROW LEVEL SECURITY;

-- Users can read their own referral code
CREATE POLICY "Users can read own referral code" ON user_referral_codes
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own referral code (via the function)
CREATE POLICY "Users can create own referral code" ON user_referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create simple RPC function to generate or return existing code
CREATE OR REPLACE FUNCTION create_user_referral_code(user_uuid uuid)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  existing_code TEXT;
  new_code TEXT;
BEGIN
  -- Check if user already has a referral code
  SELECT referral_code INTO existing_code
  FROM user_referral_codes
  WHERE user_id = user_uuid;

  -- If code exists, return it
  IF existing_code IS NOT NULL THEN
    RETURN existing_code;
  END IF;

  -- Generate new unique code
  new_code := generate_referral_code();

  -- Insert new referral code
  INSERT INTO user_referral_codes (user_id, referral_code)
  VALUES (user_uuid, new_code);

  RETURN new_code;
EXCEPTION WHEN others THEN
  RAISE EXCEPTION 'Error creating referral code: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$function$;

COMMENT ON TABLE user_referral_codes IS 'Stores one unique referral code per user that can be shared multiple times';
COMMENT ON FUNCTION create_user_referral_code(uuid) IS 'Creates or returns existing referral code for a user - can be called via RPC';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_referral_code(uuid) TO authenticated;
