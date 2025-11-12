-- Update referral system to be payment-based instead of signup-based
-- Remove 6-month limit and add tracking for payment verification

-- Step 1: Add new columns to referrals table
ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS reward_granted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reward_granted_at TIMESTAMP WITH TIME ZONE;

-- Step 2: Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id_payment ON referrals(referred_id, payment_verified);
CREATE INDEX IF NOT EXISTS idx_referrals_reward_granted ON referrals(referrer_id, reward_granted);

-- Step 3: Drop existing extend_subscription function if it exists
DROP FUNCTION IF EXISTS extend_subscription(uuid, integer);

-- Step 4: Create the extend_subscription function WITHOUT 6-month limit
CREATE OR REPLACE FUNCTION extend_subscription(user_uuid uuid, days integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_subscription_id uuid;
  current_ends_at timestamp with time zone;
  new_ends_at timestamp with time zone;
BEGIN
  -- Get the user's current active subscription
  SELECT id, ends_at INTO current_subscription_id, current_ends_at
  FROM user_subscriptions
  WHERE user_id = user_uuid
    AND status = 'active'
  ORDER BY ends_at DESC
  LIMIT 1;

  -- If no active subscription, return false
  IF current_subscription_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Calculate new end date (extend from current end date)
  new_ends_at := current_ends_at + (days || ' days')::interval;

  -- Update the subscription end date
  UPDATE user_subscriptions
  SET ends_at = new_ends_at,
      updated_at = NOW()
  WHERE id = current_subscription_id;

  RETURN TRUE;
END;
$$;

-- Step 5: Create function to process referral reward when payment is verified
CREATE OR REPLACE FUNCTION process_referral_reward(referred_user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  referral_record RECORD;
  extension_success boolean;
BEGIN
  -- Find the referral record for this user
  SELECT * INTO referral_record
  FROM referrals
  WHERE referred_id = referred_user_uuid
    AND payment_verified = FALSE
    AND reward_granted = FALSE
  LIMIT 1;

  -- If no referral record found or already processed, return false
  IF referral_record IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Mark payment as verified
  UPDATE referrals
  SET payment_verified = TRUE,
      payment_verified_at = NOW()
  WHERE id = referral_record.id;

  -- Extend the referrer's subscription by 30 days
  SELECT extend_subscription(referral_record.referrer_id, 30) INTO extension_success;

  -- If extension was successful, mark reward as granted
  IF extension_success THEN
    UPDATE referrals
    SET reward_granted = TRUE,
        reward_granted_at = NOW()
    WHERE id = referral_record.id;
    
    RETURN TRUE;
  ELSE
    -- Extension failed (no active subscription to extend)
    -- Keep payment_verified=true but reward_granted=false
    -- The reward can be granted later when they have an active subscription
    RETURN FALSE;
  END IF;
END;
$$;

-- Step 6: Add comments for documentation
COMMENT ON FUNCTION extend_subscription(uuid, integer) IS 'Extends user subscription by specified days. No limit on total extensions.';
COMMENT ON FUNCTION process_referral_reward(uuid) IS 'Processes referral reward when referred user makes their first payment. Extends referrer subscription by 30 days.';
COMMENT ON COLUMN referrals.reward_granted IS 'True if referrer has received their 1 month free reward';
COMMENT ON COLUMN referrals.payment_verified IS 'True if referred user has paid for their first subscription';
COMMENT ON COLUMN referrals.payment_verified_at IS 'Timestamp when referred user first paid';
COMMENT ON COLUMN referrals.reward_granted_at IS 'Timestamp when referrer received their reward';

-- Step 7: Update existing referrals (mark old ones as already processed to avoid retroactive rewards)
UPDATE referrals
SET reward_granted = TRUE,
    payment_verified = TRUE,
    payment_verified_at = created_at,
    reward_granted_at = created_at
WHERE reward_granted IS NULL OR reward_granted = FALSE;
