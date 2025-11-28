-- Update apply_special_offer to support discounts, targeting, and creating/extending trials

DROP FUNCTION IF EXISTS apply_special_offer(UUID, TEXT, UUID);
CREATE OR REPLACE FUNCTION apply_special_offer(
  target_user_id UUID,
  offer_code TEXT,
  applied_by_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  offer_record special_offers%ROWTYPE;
  user_redemption_count INTEGER;
  subscription_record user_subscriptions%ROWTYPE;
  discount_amount INTEGER := 0;
  trial_days INTEGER := 0;
  final_amount INTEGER := 0;
BEGIN
  -- Get the offer (active, within dates, and targeted to this user)
  SELECT * INTO offer_record
  FROM special_offers
  WHERE code = UPPER(offer_code)
    AND is_active = true
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW())
    AND (
      'all' = ANY(applicable_to)
      OR target_user_ids IS NULL
      OR target_user_ids = '{}'
      OR target_user_ids @> ARRAY[target_user_id]
    )
  LIMIT 1;

  IF offer_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Offer not found, inactive, or not applicable');
  END IF;

  -- Usage limits
  IF offer_record.usage_limit_type = 'limited' AND offer_record.max_uses IS NOT NULL AND offer_record.current_uses >= offer_record.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Offer has reached maximum uses');
  END IF;

  -- Per-user limit
  SELECT COUNT(*) INTO user_redemption_count
  FROM offer_redemptions
  WHERE offer_id = offer_record.id AND user_id = target_user_id;

  IF offer_record.max_uses_per_user IS NOT NULL AND user_redemption_count >= offer_record.max_uses_per_user THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already used this offer');
  END IF;

  -- Handle offer types
  IF offer_record.offer_type = 'extended_trial' THEN
    trial_days := COALESCE(offer_record.extended_trial_days, 0);

    -- Ensure the user has a trial subscription; create one if missing
    SELECT * INTO subscription_record
    FROM user_subscriptions
    WHERE user_id = target_user_id AND is_trial = true AND status = 'active'
    ORDER BY ends_at DESC
    LIMIT 1;

    IF subscription_record IS NULL THEN
      -- Create a base trial then fetch it
      PERFORM give_free_trial(target_user_id);
      SELECT * INTO subscription_record
      FROM user_subscriptions
      WHERE user_id = target_user_id AND is_trial = true AND status = 'active'
      ORDER BY ends_at DESC
      LIMIT 1;
    END IF;

    IF subscription_record IS NOT NULL AND trial_days > 0 THEN
      UPDATE user_subscriptions
      SET ends_at = ends_at + (trial_days || ' days')::INTERVAL
      WHERE id = subscription_record.id;
    END IF;
  ELSIF offer_record.offer_type = 'percentage_discount' THEN
    discount_amount := COALESCE(offer_record.percentage_off, 0); -- actual amount is computed at checkout
  ELSIF offer_record.offer_type = 'fixed_amount' THEN
    discount_amount := COALESCE(offer_record.fixed_amount_off, 0);
  END IF;

  -- Record redemption (subscription_id null until checkout)
  INSERT INTO offer_redemptions (
    offer_id,
    user_id,
    discount_applied,
    trial_days_added,
    subscription_id,
    status,
    applied_at
  )
  VALUES (
    offer_record.id,
    target_user_id,
    NULL,
    trial_days,
    NULL,
    'applied',
    NOW()
  );

  -- Increment usage count
  UPDATE special_offers
  SET current_uses = current_uses + 1
  WHERE id = offer_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'offer_name', offer_record.name,
    'offer_type', offer_record.offer_type,
    'discount_placeholder', discount_amount,
    'trial_days_added', trial_days
  );
END;
$$;

COMMENT ON FUNCTION apply_special_offer IS 'Apply a special offer to a user account (creates redemption, supports discounts and trial creation/extension)';
