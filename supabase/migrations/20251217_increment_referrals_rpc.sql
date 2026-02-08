-- RPC function to atomically increment affiliate partner referral count
-- This ensures thread-safe updates when referrals are created

CREATE OR REPLACE FUNCTION increment_affiliate_referrals(
  p_affiliate_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE affiliate_partners
  SET 
    total_referrals = total_referrals + 1,
    updated_at = NOW()
  WHERE id = p_affiliate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_affiliate_referrals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_affiliate_referrals(UUID) TO service_role;
