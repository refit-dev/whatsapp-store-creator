-- Fix store_members policy recursion
BEGIN;

-- Drop existing policies
DROP POLICY IF EXISTS "Store owners can manage members" ON store_members;
DROP POLICY IF EXISTS "Store members can view members" ON store_members;

-- Create non-recursive policies
CREATE POLICY "Store owners can manage members" ON store_members
  FOR ALL
  USING (
    -- Owner of the store can manage members
    EXISTS (
      SELECT 1 FROM stores s
      WHERE s.id = store_members.store_id
      AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Owner of the store can manage members
    EXISTS (
      SELECT 1 FROM stores s
      WHERE s.id = store_members.store_id
      AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "Store members can view members" ON store_members
  FOR SELECT
  USING (
    -- Members can view other members of their stores
    EXISTS (
      SELECT 1 FROM stores s
      WHERE s.id = store_members.store_id
      AND s.owner_id = auth.uid()
    )
    OR store_members.user_id = auth.uid()
  );

-- Re-verify demo store and products
DO $$
BEGIN
  -- Re-grant demo store access to service role
  INSERT INTO store_members (store_id, user_id, role)
  SELECT id, owner_id, 'owner'
  FROM stores 
  WHERE handle = 'demo-bakes'
  ON CONFLICT (store_id, user_id) DO NOTHING;
END $$;

COMMIT;