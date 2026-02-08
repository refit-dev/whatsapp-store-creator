-- RPC function to atomically update affiliate partner earnings
-- This ensures thread-safe updates when multiple commissions are processed

CREATE OR REPLACE FUNCTION update_affiliate_earnings(
  p_affiliate_id UUID,
  p_commission_amount DECIMAL(10, 2)
)
RETURNS VOID AS $$
BEGIN
  UPDATE affiliate_partners
  SET 
    total_earnings = total_earnings + p_commission_amount,
    pending_balance = pending_balance + p_commission_amount,
    total_commissions = total_commissions + 1,
    updated_at = NOW()
  WHERE id = p_affiliate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_affiliate_earnings(UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION update_affiliate_earnings(UUID, DECIMAL) TO service_role;
