-- Order Cancellation System
-- Tracks order cancellations and refunds

-- =====================================================
-- 1. Add cancellation fields to orders table
-- =====================================================
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_notes TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS refund_id TEXT,
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10, 2);

-- Add check constraint for cancellation reason
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_cancellation_reason_check;

ALTER TABLE orders
ADD CONSTRAINT orders_cancellation_reason_check
CHECK (
  cancellation_reason IS NULL OR
  cancellation_reason IN (
    'out_of_stock',
    'customer_request',
    'pricing_error',
    'address_issue',
    'duplicate_order',
    'other'
  )
);

-- Add indexes for cancellation queries
CREATE INDEX IF NOT EXISTS idx_orders_cancelled_at ON orders(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_orders_cancellation_reason ON orders(cancellation_reason);

-- =====================================================
-- 2. Create order_cancellation_logs table
-- =====================================================
CREATE TABLE IF NOT EXISTS order_cancellation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  cancelled_by UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Cancellation details
  reason TEXT NOT NULL CHECK (
    reason IN (
      'out_of_stock',
      'customer_request',
      'pricing_error',
      'address_issue',
      'duplicate_order',
      'other'
    )
  ),
  notes TEXT,
  
  -- Refund details
  refund_processed BOOLEAN DEFAULT false,
  refund_amount NUMERIC(10, 2),
  refund_id TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ip_address TEXT,
  user_agent TEXT
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_order_cancellation_logs_order_id 
  ON order_cancellation_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_cancellation_logs_store_id 
  ON order_cancellation_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_order_cancellation_logs_created_at 
  ON order_cancellation_logs(created_at DESC);

-- =====================================================
-- 3. Enable RLS on order_cancellation_logs
-- =====================================================
ALTER TABLE order_cancellation_logs ENABLE ROW LEVEL SECURITY;

-- Store owners can view their own cancellation logs
DROP POLICY IF EXISTS "Store owners can view cancellation logs" ON order_cancellation_logs;
CREATE POLICY "Store owners can view cancellation logs"
  ON order_cancellation_logs
  FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Admins can view all cancellation logs
DROP POLICY IF EXISTS "Admins can view all cancellation logs" ON order_cancellation_logs;
CREATE POLICY "Admins can view all cancellation logs"
  ON order_cancellation_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- =====================================================
-- 4. Comments
-- =====================================================
COMMENT ON TABLE order_cancellation_logs IS 'Tracks all order cancellations and refund processing';
COMMENT ON COLUMN orders.cancellation_reason IS 'Reason for order cancellation';
COMMENT ON COLUMN orders.cancelled_by IS 'User ID who cancelled the order (store owner or admin)';
COMMENT ON COLUMN orders.refund_id IS 'Payment provider refund ID (Stripe/Razorpay)';
