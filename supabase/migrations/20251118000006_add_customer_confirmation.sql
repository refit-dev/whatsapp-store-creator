-- Add customer confirmation tracking
-- Adds 'customer_confirmed' status and timestamp for when customer confirms WhatsApp message was sent

-- =====================================================
-- 1. Add whatsapp_sent_at timestamp to orders table
-- =====================================================
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS whatsapp_sent_at TIMESTAMPTZ;

-- Add index for querying orders by confirmation time
CREATE INDEX IF NOT EXISTS idx_orders_whatsapp_sent_at ON orders(whatsapp_sent_at);

-- =====================================================
-- 2. Update status column check constraint (if exists)
-- =====================================================
-- Note: The orders table uses TEXT type for status, not enum
-- We don't need to modify the column type, just update any check constraints

-- Drop existing check constraint if it exists
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add updated check constraint that includes customer_confirmed
-- This is optional - if no constraint exists, the column will accept any text value
-- Uncomment below if you want to enforce specific status values:
/*
ALTER TABLE orders
ADD CONSTRAINT orders_status_check
CHECK (status IN (
  'created',
  'opened_whatsapp', 
  'customer_confirmed',
  'paid',
  'processing',
  'confirmed',
  'delivered',
  'cancelled',
  'refunded',
  'failed'
));
*/

-- =====================================================
-- 3. Comments
-- =====================================================
COMMENT ON COLUMN orders.whatsapp_sent_at IS 'Timestamp when customer confirmed they sent the WhatsApp message';
