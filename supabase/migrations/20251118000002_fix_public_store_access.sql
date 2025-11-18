-- Fix Public Store Access
-- Allow anonymous users to view approved and active stores by handle

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public can view approved active stores" ON stores;
DROP POLICY IF EXISTS "Anyone can view approved stores by handle" ON stores;

-- Allow public/anonymous users to view stores by handle if:
-- 1. Store is approved
-- 2. Store is active
-- 3. Store is not blocked
CREATE POLICY "Public can view approved active stores"
  ON stores
  FOR SELECT
  TO anon, authenticated
  USING (
    approval_status = 'approved'
    AND is_active = true
    AND (is_blocked IS NULL OR is_blocked = false)
  );

-- Allow store owners to view their own stores regardless of status
-- (This policy may already exist, but let's ensure it)
DROP POLICY IF EXISTS "Store owners can view their own stores" ON stores;
CREATE POLICY "Store owners can view their own stores"
  ON stores
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
  );

-- Add index for faster handle lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_stores_handle ON stores(handle);
CREATE INDEX IF NOT EXISTS idx_stores_approval_active ON stores(approval_status, is_active) WHERE is_blocked = false OR is_blocked IS NULL;

-- Add comment
COMMENT ON POLICY "Public can view approved active stores" ON stores IS 'Allows anonymous and authenticated users to view stores that are approved, active, and not blocked';

