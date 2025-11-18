-- Fix Public Product Access
-- Allow anonymous users to view products from approved and active stores

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view products from approved stores" ON products;
DROP POLICY IF EXISTS "Anyone can view active products from approved stores" ON products;

-- Allow public/anonymous users to view products if:
-- 1. Product is active
-- 2. Store is approved
-- 3. Store is active
-- 4. Store is not blocked
CREATE POLICY "Public can view products from approved stores"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = products.store_id
      AND stores.approval_status = 'approved'
      AND stores.is_active = true
      AND (stores.is_blocked IS NULL OR stores.is_blocked = false)
    )
  );

-- Allow store owners to view their own products regardless of status
DROP POLICY IF EXISTS "Store owners can view their own products" ON products;
CREATE POLICY "Store owners can view their own products"
  ON products
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores
      WHERE owner_id = auth.uid()
    )
  );

-- Add indexes for faster queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_products_store_id_active ON products(store_id, is_active);

-- Add comment
COMMENT ON POLICY "Public can view products from approved stores" ON products IS 'Allows anonymous and authenticated users to view active products from approved, active, non-blocked stores';

