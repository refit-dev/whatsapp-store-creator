-- Add payment configuration to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS payment_enabled BOOLEAN DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'direct'; -- 'direct' or 'gateway'
ALTER TABLE stores ADD COLUMN IF NOT EXISTS upi_id VARCHAR(255);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS paytm_number VARCHAR(20);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS payment_instructions TEXT;

-- Update the orders table to include payment tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_screenshot_url VARCHAR(500);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_confirmed BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';

-- Add customer information columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount INTEGER; -- Amount in smallest currency unit (cents/paise)

-- Add payment status constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- Create notifications table for tracking system events
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view their notifications" ON notifications
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = notifications.store_id 
      AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT TO authenticated, anon WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_seller_confirmed ON orders(seller_confirmed);
CREATE INDEX IF NOT EXISTS idx_notifications_store_id ON notifications(store_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Update RLS policies for orders
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Store owners can view their orders" ON orders;
CREATE POLICY "Store owners can view their orders" ON orders
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = orders.store_id 
      AND stores.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store owners can update their orders" ON orders;
CREATE POLICY "Store owners can update their orders" ON orders
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = orders.store_id 
      AND stores.owner_id = auth.uid()
    )
  );