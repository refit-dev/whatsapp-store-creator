-- Additional SQL updates for 6-month referral limit
-- Run this after the main setup_subscription_system.sql

-- Create a view to easily check user referral status
CREATE OR REPLACE VIEW user_referral_status AS
SELECT 
  u.id as user_id,
  u.email,
  COALESCE(r.referral_count, 0) as referral_count,
  6 - COALESCE(r.referral_count, 0) as remaining_referrals,
  CASE WHEN COALESCE(r.referral_count, 0) >= 6 THEN true ELSE false END as has_reached_limit,
  rc.code as referral_code,
  us.ends_at as subscription_ends_at,
  us.is_trial,
  us.status as subscription_status
FROM auth.users u
LEFT JOIN (
  SELECT referrer_id, COUNT(*) as referral_count
  FROM referrals
  GROUP BY referrer_id
) r ON u.id = r.referrer_id
LEFT JOIN referral_codes rc ON u.id = rc.user_id
LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
ORDER BY u.created_at DESC;

-- Function to check if user can still get referral rewards
CREATE OR REPLACE FUNCTION can_receive_referral_reward(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  referral_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO referral_count
  FROM referrals
  WHERE referrer_id = user_uuid;
  
  RETURN referral_count < 6;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's referral statistics
CREATE OR REPLACE FUNCTION get_user_referral_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_referrals', COALESCE(COUNT(*), 0),
    'remaining_referrals', GREATEST(0, 6 - COALESCE(COUNT(*), 0)),
    'has_reached_limit', COALESCE(COUNT(*), 0) >= 6,
    'free_months_earned', COALESCE(COUNT(*), 0),
    'max_free_months', 6
  ) INTO stats
  FROM referrals
  WHERE referrer_id = user_uuid;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a check constraint to prevent more than 6 referrals per user
-- Note: This is advisory as we handle the logic in the extend_subscription function
ALTER TABLE referrals 
ADD CONSTRAINT check_max_referrals 
CHECK (
  (SELECT COUNT(*) FROM referrals r2 WHERE r2.referrer_id = referrer_id) <= 6
);

-- Create a trigger to log when referral limits are reached
CREATE OR REPLACE FUNCTION log_referral_limit_reached()
RETURNS TRIGGER AS $$
DECLARE
  referral_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO referral_count
  FROM referrals
  WHERE referrer_id = NEW.referrer_id;
  
  IF referral_count >= 6 THEN
    RAISE NOTICE 'User % has reached the 6-month referral limit', NEW.referrer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_referral_limit ON referrals;
CREATE TRIGGER trigger_log_referral_limit
  AFTER INSERT ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION log_referral_limit_reached();

-- Update the existing extend_subscription function comment
COMMENT ON FUNCTION extend_subscription(UUID, INTEGER) IS 'Extends user subscription by specified days. Limited to maximum 6 months (180 days) of free time through referrals to prevent abuse.';

-- Add helpful comments
COMMENT ON VIEW user_referral_status IS 'Provides a comprehensive view of each user''s referral status and limits';
COMMENT ON FUNCTION can_receive_referral_reward(UUID) IS 'Checks if a user can still receive referral rewards (under 6-month limit)';
COMMENT ON FUNCTION get_user_referral_stats(UUID) IS 'Returns JSON object with complete referral statistics for a user';

-- Test query to verify the 6-month limit is working
-- SELECT * FROM user_referral_status WHERE referral_count > 0;