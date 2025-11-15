-- Add is_active column to stores table
-- Allows sellers to temporarily disable their entire store

ALTER TABLE stores
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

COMMENT ON COLUMN stores.is_active IS 'Whether the store is active and visible to customers. If false, store will show as temporarily closed.';
