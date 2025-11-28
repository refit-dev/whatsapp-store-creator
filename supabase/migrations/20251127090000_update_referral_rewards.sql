-- Add referee reward tracking and update referral rewards for both parties

-- Track referee reward state separately so we can avoid duplicate extensions
ALTER TABLE referrals
ADD COLUMN IF NOT EXISTS referee_reward_granted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS referee_reward_granted_at TIMESTAMPTZ;

-- Drop old signature before recreating with new return type
DROP FUNCTION IF EXISTS process_referral_reward(uuid) CASCADE;

-- Grant 30 days to referrer and 15 days to referee after the first payment
CREATE OR REPLACE FUNCTION process_referral_reward(referred_user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referral_record RECORD;
  referrer_extended BOOLEAN := FALSE;
  referee_extended BOOLEAN := FALSE;
BEGIN
  SELECT *
  INTO referral_record
  FROM referrals
  WHERE referred_id = referred_user_uuid
  LIMIT 1;

  IF referral_record IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Exit early if both rewards are already applied
  IF COALESCE(referral_record.reward_granted, FALSE)
     AND COALESCE(referral_record.referee_reward_granted, FALSE) THEN
    RETURN TRUE;
  END IF;

  -- Mark payment as verified the first time we process the reward
  IF NOT COALESCE(referral_record.payment_verified, FALSE) THEN
    UPDATE referrals
    SET payment_verified = TRUE,
        payment_verified_at = NOW()
    WHERE id = referral_record.id;
  END IF;

  -- Extend the referrer's subscription by 30 days (once)
  IF NOT COALESCE(referral_record.reward_granted, FALSE) THEN
    referrer_extended := extend_subscription(referral_record.referrer_id, 30);
    IF referrer_extended THEN
      UPDATE referrals
      SET reward_granted = TRUE,
          reward_granted_at = NOW()
      WHERE id = referral_record.id;
    END IF;
  ELSE
    referrer_extended := TRUE;
  END IF;

  -- Extend the referee's subscription by 15 days (once)
  IF NOT COALESCE(referral_record.referee_reward_granted, FALSE) THEN
    referee_extended := extend_subscription(referral_record.referred_id, 15);
    IF referee_extended THEN
      UPDATE referrals
      SET referee_reward_granted = TRUE,
          referee_reward_granted_at = NOW()
      WHERE id = referral_record.id;
    END IF;
  ELSE
    referee_extended := TRUE;
  END IF;

  RETURN referrer_extended OR referee_extended;
END;
$$;

COMMENT ON COLUMN referrals.referee_reward_granted IS 'True if referred user received their 15-day reward';
COMMENT ON COLUMN referrals.referee_reward_granted_at IS 'Timestamp when referred user received their 15-day reward';
COMMENT ON FUNCTION process_referral_reward(uuid) IS 'Extends referrer by 30 days and referee by 15 days once payment is verified.';
