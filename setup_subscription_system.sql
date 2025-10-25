-- Subscription and Referral System
-- Adds subscription plans, user subscriptions, and referral tracking

BEGIN;

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  price_cents INTEGER NOT NULL,
  duration_days INTEGER NOT NULL,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  payment_id VARCHAR(255),
  payment_provider VARCHAR(50) DEFAULT 'razorpay',
  is_trial BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referral codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(20) UNIQUE NOT NULL,
  uses_count INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT NULL, -- NULL means unlimited
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referrals table to track who referred whom
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code_id UUID NOT NULL REFERENCES referral_codes(id),
  reward_given BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referred_id) -- Each user can only be referred once
);

-- Insert default subscription plan
INSERT INTO subscription_plans (name, price_cents, duration_days, features) VALUES 
('Monthly Pro', 25900, 30, '{"stores": "unlimited", "products": "unlimited", "orders": "unlimited", "support": "priority"}')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_ends_at ON user_subscriptions(ends_at);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);

-- Add RLS policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Subscription plans - readable by all authenticated users
DROP POLICY IF EXISTS "Subscription plans are readable by authenticated users" ON subscription_plans;
CREATE POLICY "Subscription plans are readable by authenticated users" ON subscription_plans
  FOR SELECT TO authenticated USING (true);

-- User subscriptions - users can only see their own
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Referral codes - users can manage their own codes
DROP POLICY IF EXISTS "Users can manage their own referral codes" ON referral_codes;
CREATE POLICY "Users can manage their own referral codes" ON referral_codes
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Referrals - users can view referrals they made or received
DROP POLICY IF EXISTS "Users can view their referrals" ON referrals;
CREATE POLICY "Users can view their referrals" ON referrals
  FOR SELECT TO authenticated USING (
    auth.uid() = referrer_id OR auth.uid() = referred_id
  );

DROP POLICY IF EXISTS "System can insert referrals" ON referrals;
CREATE POLICY "System can insert referrals" ON referrals
  FOR INSERT TO authenticated WITH CHECK (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8 character alphanumeric code
    new_code := upper(substring(encode(gen_random_bytes(6), 'base64') from 1 for 8));
    new_code := translate(new_code, '+/=', 'XYZ');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE referral_codes.code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to create referral code for user
CREATE OR REPLACE FUNCTION create_user_referral_code(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  existing_code TEXT;
BEGIN
  -- Check if user already has a referral code
  SELECT code INTO existing_code FROM referral_codes WHERE user_id = user_uuid LIMIT 1;
  
  IF existing_code IS NOT NULL THEN
    RETURN existing_code;
  END IF;
  
  -- Generate new code
  new_code := generate_referral_code();
  
  -- Insert new referral code
  INSERT INTO referral_codes (user_id, code) VALUES (user_uuid, new_code);
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to give 30-day free trial to new users
CREATE OR REPLACE FUNCTION give_free_trial(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  plan_uuid UUID;
  subscription_uuid UUID;
  existing_sub UUID;
BEGIN
  -- Check if user already has a subscription
  SELECT id INTO existing_sub FROM user_subscriptions 
  WHERE user_id = user_uuid AND status = 'active' 
  LIMIT 1;
  
  IF existing_sub IS NOT NULL THEN
    RETURN existing_sub;
  END IF;
  
  -- Get the monthly plan
  SELECT id INTO plan_uuid FROM subscription_plans WHERE name = 'Monthly Pro' LIMIT 1;
  
  -- Create 30-day trial subscription
  INSERT INTO user_subscriptions (
    user_id, 
    plan_id, 
    starts_at, 
    ends_at, 
    status, 
    is_trial
  ) VALUES (
    user_uuid,
    plan_uuid,
    NOW(),
    NOW() + INTERVAL '30 days',
    'active',
    true
  ) RETURNING id INTO subscription_uuid;
  
  RETURN subscription_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to extend subscription by 30 days (for referral rewards)
-- Maximum 6 months (180 days) of free time can be accumulated through referrals
CREATE OR REPLACE FUNCTION extend_subscription(user_uuid UUID, days INTEGER DEFAULT 30)
RETURNS BOOLEAN AS $$
DECLARE
  current_sub UUID;
  current_ends_at TIMESTAMPTZ;
  max_free_end_date TIMESTAMPTZ;
  trial_start_date TIMESTAMPTZ;
  total_referral_count INTEGER;
BEGIN
  -- Get user's active subscription
  SELECT id, ends_at INTO current_sub, current_ends_at
  FROM user_subscriptions 
  WHERE user_id = user_uuid AND status = 'active' 
  ORDER BY ends_at DESC LIMIT 1;
  
  -- Count total successful referrals to enforce 6-month limit
  SELECT COUNT(*) INTO total_referral_count
  FROM referrals 
  WHERE referrer_id = user_uuid;
  
  -- Limit to maximum 6 referrals (6 months free)
  IF total_referral_count >= 6 THEN
    RAISE NOTICE 'Maximum referral limit reached (6 months). No more extensions allowed.';
    RETURN false;
  END IF;
  
  IF current_sub IS NOT NULL THEN
    -- Get the original trial start date to calculate maximum free period
    SELECT starts_at INTO trial_start_date
    FROM user_subscriptions 
    WHERE user_id = user_uuid 
    ORDER BY starts_at ASC 
    LIMIT 1;
    
    -- Calculate maximum free end date (6 months from trial start)
    max_free_end_date := trial_start_date + INTERVAL '180 days';
    
    -- Check if extending would exceed the 6-month free limit
    IF (current_ends_at + (days || ' days')::INTERVAL) > max_free_end_date THEN
      -- Only extend to the maximum allowed date
      UPDATE user_subscriptions 
      SET ends_at = max_free_end_date,
          updated_at = NOW()
      WHERE id = current_sub;
      
      RAISE NOTICE 'Extension limited to maximum 6 months free period.';
      RETURN true;
    ELSE
      -- Normal extension within limits
      UPDATE user_subscriptions 
      SET ends_at = ends_at + (days || ' days')::INTERVAL,
          updated_at = NOW()
      WHERE id = current_sub;
      RETURN true;
    END IF;
  ELSE
    -- Create new 30-day subscription if no active subscription
    PERFORM give_free_trial(user_uuid);
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign trial on user signup (if table exists)
CREATE OR REPLACE FUNCTION auto_assign_trial()
RETURNS TRIGGER AS $$
BEGIN
  -- Give free trial to new user
  PERFORM give_free_trial(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if auth.users table exists (will be in Supabase)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    DROP TRIGGER IF EXISTS trigger_auto_assign_trial ON auth.users;
    CREATE TRIGGER trigger_auto_assign_trial
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION auto_assign_trial();
  END IF;
END $$;

-- Update demo store WhatsApp number (if stores table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stores') THEN
    UPDATE stores 
    SET whatsapp_e164 = '+91-7304848472' 
    WHERE handle LIKE '%demo%' OR name ILIKE '%demo%';
  END IF;
END $$;

COMMIT;

-- Verification queries
SELECT 'Subscription system created successfully!' as message;
SELECT name, price_cents, duration_days FROM subscription_plans;

-- Test functions
SELECT 'Testing referral code generation...' as test;
SELECT generate_referral_code() as sample_code;