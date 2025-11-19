-- Admin Control for Trial Duration & Special Offers System
-- Provides flexible admin dashboard with granular control over trials and promotional offers

-- =====================================================
-- 1. Global Trial Settings Table
-- =====================================================
CREATE TABLE IF NOT EXISTS trial_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  default_trial_days INTEGER NOT NULL DEFAULT 14 CHECK (default_trial_days >= 0 AND default_trial_days <= 365),
  auto_extend_active_users BOOLEAN DEFAULT false,
  auto_extend_days INTEGER DEFAULT 0,
  min_activity_threshold INTEGER DEFAULT 5, -- Minimum orders to qualify for auto-extend
  is_active BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO trial_settings (default_trial_days, auto_extend_active_users, auto_extend_days)
VALUES (14, false, 0)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. User Trial Overrides Table
-- =====================================================
CREATE TABLE IF NOT EXISTS user_trial_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trial_days INTEGER NOT NULL CHECK (trial_days >= 0 AND trial_days <= 365),
  reason TEXT, -- Why was this override applied
  applied_by UUID REFERENCES auth.users(id), -- Admin who applied it
  expires_at TIMESTAMPTZ, -- When this override expires (NULL = permanent)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- 3. Special Offers Table
-- =====================================================
CREATE TABLE IF NOT EXISTS special_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- Coupon code (e.g., FIRSTMONTH50)
  name TEXT NOT NULL, -- Display name
  description TEXT,
  offer_type TEXT NOT NULL CHECK (offer_type IN ('percentage_discount', 'fixed_amount', 'extended_trial', 'free_upgrade', 'referral_bonus')),
  
  -- Discount details
  percentage_off INTEGER CHECK (percentage_off >= 0 AND percentage_off <= 100),
  fixed_amount_off INTEGER CHECK (fixed_amount_off >= 0), -- In cents
  currency TEXT DEFAULT 'INR',
  extended_trial_days INTEGER CHECK (extended_trial_days >= 0),
  free_months INTEGER CHECK (free_months >= 0),
  
  -- Targeting
  applicable_to TEXT[] DEFAULT ARRAY['all'], -- 'all', 'new_users', 'existing_users', 'specific_users'
  target_user_ids UUID[], -- Specific users this offer applies to
  target_categories TEXT[], -- Store categories this applies to
  
  -- Time bounds
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  
  -- Usage limits
  usage_limit_type TEXT NOT NULL DEFAULT 'unlimited' CHECK (usage_limit_type IN ('one_time', 'limited', 'unlimited')),
  max_uses INTEGER, -- NULL for unlimited
  current_uses INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false, -- Show on homepage/dashboard
  
  -- Tracking
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. Offer Redemptions Table
-- =====================================================
CREATE TABLE IF NOT EXISTS offer_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES special_offers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- What was applied
  discount_applied INTEGER, -- Actual discount in cents
  trial_days_added INTEGER,
  subscription_id UUID REFERENCES user_subscriptions(id),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'expired', 'revoked')),
  applied_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Analytics
  revenue_impact INTEGER, -- Negative for discounts, calculated
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(offer_id, user_id) -- One redemption per user per offer (can be adjusted based on max_uses_per_user)
);

-- =====================================================
-- 5. Trial Extension Log Table
-- =====================================================
CREATE TABLE IF NOT EXISTS trial_extension_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES user_subscriptions(id),
  days_added INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'admin_manual', 'auto_extend', 'special_offer', 'referral'
  applied_by UUID REFERENCES auth.users(id), -- NULL for automated
  previous_end_date TIMESTAMPTZ,
  new_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. Create Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_trial_overrides_user_id ON user_trial_overrides(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_special_offers_code ON special_offers(code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_special_offers_active ON special_offers(is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_special_offers_featured ON special_offers(is_featured) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_offer_redemptions_user_id ON offer_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_offer_redemptions_offer_id ON offer_redemptions(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_redemptions_status ON offer_redemptions(status, applied_at);
CREATE INDEX IF NOT EXISTS idx_trial_extension_logs_user_id ON trial_extension_logs(user_id);

-- =====================================================
-- 7. Enable RLS
-- =====================================================
ALTER TABLE trial_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trial_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_extension_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. RLS Policies - Trial Settings (Admin Only)
-- =====================================================
DROP POLICY IF EXISTS "Admins can view trial settings" ON trial_settings;
DROP POLICY IF EXISTS "Admins can manage trial settings" ON trial_settings;

CREATE POLICY "Admins can view trial settings"
  ON trial_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

CREATE POLICY "Admins can manage trial settings"
  ON trial_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- =====================================================
-- 9. RLS Policies - User Trial Overrides
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own trial override" ON user_trial_overrides;
DROP POLICY IF EXISTS "Admins can manage all trial overrides" ON user_trial_overrides;

CREATE POLICY "Users can view their own trial override"
  ON user_trial_overrides FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM admins WHERE admins.user_id = auth.uid() AND admins.is_active = true
  ));

CREATE POLICY "Admins can manage all trial overrides"
  ON user_trial_overrides FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- =====================================================
-- 10. RLS Policies - Special Offers
-- =====================================================
DROP POLICY IF EXISTS "Users can view active offers" ON special_offers;
DROP POLICY IF EXISTS "Admins can manage all offers" ON special_offers;

CREATE POLICY "Users can view active offers"
  ON special_offers FOR SELECT
  TO authenticated
  USING (
    is_active = true 
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW())
    AND (
      'all' = ANY(applicable_to) 
      OR auth.uid() = ANY(target_user_ids)
      OR EXISTS (
        SELECT 1 FROM admins WHERE admins.user_id = auth.uid() AND admins.is_active = true
      )
    )
  );

CREATE POLICY "Admins can manage all offers"
  ON special_offers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- =====================================================
-- 11. RLS Policies - Offer Redemptions
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own redemptions" ON offer_redemptions;
DROP POLICY IF EXISTS "Admins can view all redemptions" ON offer_redemptions;
DROP POLICY IF EXISTS "Users can create redemptions" ON offer_redemptions;

CREATE POLICY "Users can view their own redemptions"
  ON offer_redemptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM admins WHERE admins.user_id = auth.uid() AND admins.is_active = true
  ));

CREATE POLICY "Admins can view all redemptions"
  ON offer_redemptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

CREATE POLICY "Users can create redemptions"
  ON offer_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 12. RLS Policies - Trial Extension Logs
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own extension logs" ON trial_extension_logs;
DROP POLICY IF EXISTS "Admins can view all extension logs" ON trial_extension_logs;

CREATE POLICY "Users can view their own extension logs"
  ON trial_extension_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM admins WHERE admins.user_id = auth.uid() AND admins.is_active = true
  ));

CREATE POLICY "Admins can view all extension logs"
  ON trial_extension_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- =====================================================
-- 13. Functions for Admin Actions
-- =====================================================

-- Function to extend user trial
DROP FUNCTION IF EXISTS admin_extend_user_trial(UUID, INTEGER, TEXT, UUID);
CREATE OR REPLACE FUNCTION admin_extend_user_trial(
  target_user_id UUID,
  days_to_add INTEGER,
  extension_reason TEXT,
  admin_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  subscription_record RECORD;
  new_end_date TIMESTAMPTZ;
  result JSONB;
BEGIN
  -- Get user's active trial subscription
  SELECT * INTO subscription_record
  FROM user_subscriptions
  WHERE user_id = target_user_id
    AND is_trial = true
    AND status = 'active'
  ORDER BY ends_at DESC
  LIMIT 1;

  IF subscription_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active trial found');
  END IF;

  -- Calculate new end date
  new_end_date := subscription_record.ends_at + (days_to_add || ' days')::INTERVAL;

  -- Update subscription
  UPDATE user_subscriptions
  SET ends_at = new_end_date,
      updated_at = NOW()
  WHERE id = subscription_record.id;

  -- Log the extension
  INSERT INTO trial_extension_logs (
    user_id, subscription_id, days_added, reason,
    applied_by, previous_end_date, new_end_date
  ) VALUES (
    target_user_id, subscription_record.id, days_to_add, extension_reason,
    admin_user_id, subscription_record.ends_at, new_end_date
  );

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', subscription_record.id,
    'previous_end_date', subscription_record.ends_at,
    'new_end_date', new_end_date,
    'days_added', days_to_add
  );
END;
$$;

-- Function to apply special offer to user
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
  offer_record RECORD;
  user_redemption_count INTEGER;
  result JSONB;
  subscription_record RECORD;
  discount_amount INTEGER := 0;
  trial_days INTEGER := 0;
BEGIN
  -- Get the offer
  SELECT * INTO offer_record
  FROM special_offers
  WHERE code = offer_code
    AND is_active = true
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW())
  LIMIT 1;

  IF offer_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Offer not found or expired');
  END IF;

  -- Check if offer has reached max uses
  IF offer_record.usage_limit_type = 'limited' AND offer_record.current_uses >= offer_record.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Offer has reached maximum uses');
  END IF;

  -- Check user's redemption count for this offer
  SELECT COUNT(*) INTO user_redemption_count
  FROM offer_redemptions
  WHERE offer_id = offer_record.id AND user_id = target_user_id;

  IF user_redemption_count >= offer_record.max_uses_per_user THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already used this offer');
  END IF;

  -- Apply the offer based on type
  IF offer_record.offer_type = 'extended_trial' THEN
    trial_days := offer_record.extended_trial_days;
    
    -- Extend user's trial
    SELECT * INTO subscription_record
    FROM user_subscriptions
    WHERE user_id = target_user_id AND is_trial = true AND status = 'active'
    ORDER BY ends_at DESC LIMIT 1;
    
    IF subscription_record IS NOT NULL THEN
      UPDATE user_subscriptions
      SET ends_at = ends_at + (trial_days || ' days')::INTERVAL
      WHERE id = subscription_record.id;
    END IF;
  END IF;

  -- Create redemption record
  INSERT INTO offer_redemptions (
    offer_id, user_id, discount_applied, trial_days_added,
    subscription_id, status, applied_at
  ) VALUES (
    offer_record.id, target_user_id, discount_amount, trial_days,
    subscription_record.id, 'applied', NOW()
  );

  -- Update offer usage count
  UPDATE special_offers
  SET current_uses = current_uses + 1
  WHERE id = offer_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'offer_name', offer_record.name,
    'discount_applied', discount_amount,
    'trial_days_added', trial_days
  );
END;
$$;

-- =====================================================
-- 14. Trigger to update timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_trial_settings_updated_at ON trial_settings;
CREATE TRIGGER update_trial_settings_updated_at
  BEFORE UPDATE ON trial_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_trial_overrides_updated_at ON user_trial_overrides;
CREATE TRIGGER update_user_trial_overrides_updated_at
  BEFORE UPDATE ON user_trial_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_special_offers_updated_at ON special_offers;
CREATE TRIGGER update_special_offers_updated_at
  BEFORE UPDATE ON special_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 15. Comments
-- =====================================================
COMMENT ON TABLE trial_settings IS 'Global trial configuration managed by admins';
COMMENT ON TABLE user_trial_overrides IS 'Individual user trial duration overrides';
COMMENT ON TABLE special_offers IS 'Promotional offers and coupon codes';
COMMENT ON TABLE offer_redemptions IS 'Tracking of offer usage by users';
COMMENT ON TABLE trial_extension_logs IS 'Audit log of all trial extensions';
COMMENT ON FUNCTION admin_extend_user_trial IS 'Admin function to manually extend user trial period';
COMMENT ON FUNCTION apply_special_offer IS 'Apply a special offer to a user account';
