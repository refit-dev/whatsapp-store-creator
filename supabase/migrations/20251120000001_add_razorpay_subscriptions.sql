-- Add Razorpay Plan ID to subscription_plans table
-- This migration enables Razorpay subscription integration with offer support

-- Add razorpay_plan_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' 
    AND column_name = 'razorpay_plan_id'
  ) THEN
    ALTER TABLE subscription_plans 
    ADD COLUMN razorpay_plan_id TEXT UNIQUE;
    
    COMMENT ON COLUMN subscription_plans.razorpay_plan_id 
    IS 'Razorpay Plan ID for recurring subscriptions (e.g., plan_abc123)';
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_plans_razorpay_plan_id 
ON subscription_plans(razorpay_plan_id);

-- Update status column in user_subscriptions if not complete
DO $$ 
BEGIN
  -- Check if status column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' 
    AND column_name = 'status'
  ) THEN
    -- Drop existing constraint if it exists
    ALTER TABLE user_subscriptions 
    DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;
    
    -- Add new constraint with all statuses
    ALTER TABLE user_subscriptions 
    ADD CONSTRAINT user_subscriptions_status_check 
    CHECK (status IN (
      'pending', 
      'authenticated', 
      'active', 
      'paused', 
      'cancelled', 
      'completed', 
      'expired',
      'halted'
    ));
  ELSE
    -- Create status column if it doesn't exist
    ALTER TABLE user_subscriptions 
    ADD COLUMN status TEXT DEFAULT 'active' 
    CHECK (status IN (
      'pending', 
      'authenticated', 
      'active', 
      'paused', 
      'cancelled', 
      'completed', 
      'expired',
      'halted'
    ));
  END IF;
END $$;

-- Create payment_logs table for tracking recurring payments
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT NOT NULL,
  subscription_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL,
  method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for payment_logs
CREATE INDEX IF NOT EXISTS idx_payment_logs_subscription_id 
ON payment_logs(subscription_id);

CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_id 
ON payment_logs(payment_id);

CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at 
ON payment_logs(created_at DESC);

-- Add comment
COMMENT ON TABLE payment_logs IS 'Tracks all Razorpay payment transactions for subscriptions';

-- Enable RLS on payment_logs
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_logs
-- Admins can view all payment logs
CREATE POLICY "Admins can view all payment logs" 
ON payment_logs 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user_id = auth.uid() 
    AND admins.is_active = true
  )
);

-- Users can view their own payment logs
CREATE POLICY "Users can view their own payment logs" 
ON payment_logs 
FOR SELECT 
TO authenticated 
USING (
  subscription_id IN (
    SELECT payment_id FROM user_subscriptions 
    WHERE user_id = auth.uid()
  )
);

-- Create a view for easier subscription analytics
CREATE OR REPLACE VIEW subscription_analytics AS
SELECT 
  sp.name as plan_name,
  sp.price_cents,
  sp.razorpay_plan_id,
  COUNT(DISTINCT us.user_id) as total_subscribers,
  COUNT(DISTINCT CASE WHEN us.status = 'active' THEN us.user_id END) as active_subscribers,
  COUNT(DISTINCT CASE WHEN us.status = 'cancelled' THEN us.user_id END) as cancelled_subscribers,
  SUM(CASE WHEN us.status = 'active' THEN sp.price_cents ELSE 0 END) as monthly_revenue,
  COUNT(DISTINCT pl.payment_id) as total_payments,
  SUM(pl.amount) as total_payment_amount
FROM subscription_plans sp
LEFT JOIN user_subscriptions us ON sp.id = us.plan_id
LEFT JOIN payment_logs pl ON us.payment_id = pl.subscription_id
GROUP BY sp.id, sp.name, sp.price_cents, sp.razorpay_plan_id;

-- Grant access to the view
GRANT SELECT ON subscription_analytics TO authenticated;

-- Create function to get user's subscription history
CREATE OR REPLACE FUNCTION get_user_subscription_history(user_uuid UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan_name TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT,
  payment_count BIGINT,
  total_paid BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id as subscription_id,
    sp.name as plan_name,
    us.starts_at,
    us.ends_at,
    us.status,
    COUNT(pl.id) as payment_count,
    COALESCE(SUM(pl.amount), 0) as total_paid
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  LEFT JOIN payment_logs pl ON us.payment_id = pl.subscription_id
  WHERE us.user_id = user_uuid
  GROUP BY us.id, sp.name, us.starts_at, us.ends_at, us.status
  ORDER BY us.created_at DESC;
END;
$$;

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: Added Razorpay subscription support';
  RAISE NOTICE '   - Added razorpay_plan_id to subscription_plans';
  RAISE NOTICE '   - Updated user_subscriptions status column';
  RAISE NOTICE '   - Created payment_logs table';
  RAISE NOTICE '   - Created subscription_analytics view';
  RAISE NOTICE '   - Created get_user_subscription_history function';
END $$;
