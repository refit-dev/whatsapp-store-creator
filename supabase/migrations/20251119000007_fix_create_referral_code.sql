-- Fix create_user_referral_code to use correct column name
DROP FUNCTION IF EXISTS create_user_referral_code() CASCADE;

CREATE OR REPLACE FUNCTION create_user_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use referrer_id instead of user_id (the new user is the referrer for their own code)
  INSERT INTO referrals (referrer_id, referral_code)
  VALUES (NEW.id, generate_referral_code())
  ON CONFLICT DO NOTHING;  -- In case it already exists
  
  RETURN NEW;
EXCEPTION WHEN others THEN
  -- Log error but don't block signup
  RAISE WARNING 'create_user_referral_code error for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS create_referral_code_on_signup ON auth.users;
CREATE TRIGGER create_referral_code_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_referral_code();

COMMENT ON FUNCTION create_user_referral_code() IS 'Creates referral code for new user - FIXED column name';
