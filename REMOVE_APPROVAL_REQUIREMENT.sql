-- Remove Admin Approval Requirement - Auto-Approve All Stores
-- Keeps moderation capability (blocking) while removing approval bottleneck

-- =====================================================
-- 1. Set default approval_status to 'approved'
-- =====================================================

-- Update column default to 'approved' instead of 'pending'
ALTER TABLE stores 
ALTER COLUMN approval_status SET DEFAULT 'approved';

-- Auto-approve all existing pending stores
UPDATE stores
SET 
  approval_status = 'approved',
  approved_at = NOW(),
  approved_by = NULL  -- System auto-approval
WHERE approval_status = 'pending';

-- =====================================================
-- 2. Update RLS policies to not check approval_status
-- =====================================================

-- Drop old policy that requires approval
DROP POLICY IF EXISTS "Public can view approved active stores" ON stores;

-- Create new policy - only check is_active and is_blocked
CREATE POLICY "Public can view active non-blocked stores"
  ON stores
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND (is_blocked IS NULL OR is_blocked = false)
  );

-- =====================================================
-- 3. Update products RLS to not check approval_status
-- =====================================================

DROP POLICY IF EXISTS "Public can view products from approved stores" ON products;

CREATE POLICY "Public can view products from active stores"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = products.store_id
      AND stores.is_active = true
      AND (stores.is_blocked IS NULL OR stores.is_blocked = false)
    )
  );

-- =====================================================
-- 4. Update store_public view
-- =====================================================

DROP VIEW IF EXISTS public.store_public CASCADE;

CREATE VIEW public.store_public AS
SELECT
  id,
  handle,
  name,
  logo_url,
  banner_url,
  currency,
  whatsapp_e164,
  is_active,
  created_at
FROM stores
WHERE
  is_active = true
  AND (is_blocked IS NULL OR is_blocked = false);

GRANT SELECT ON public.store_public TO anon, authenticated;

-- =====================================================
-- 5. Update indexes
-- =====================================================

-- Drop old index that includes approval_status
DROP INDEX IF EXISTS idx_stores_approval_active;

-- Create new index without approval_status
CREATE INDEX IF NOT EXISTS idx_stores_active_blocked 
  ON stores(is_active, is_blocked)
  WHERE is_blocked = false OR is_blocked IS NULL;

-- =====================================================
-- 6. Add comment to document the change
-- =====================================================

COMMENT ON COLUMN stores.approval_status IS 'Auto-approved by default. Keep for backward compatibility but no longer used in access control. Use is_blocked for moderation.';

-- =====================================================
-- 7. Verify the changes
-- =====================================================

-- Check default value
SELECT 
  column_name,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'stores' 
  AND column_name = 'approval_status';

-- Check all stores are approved
SELECT 
  approval_status,
  COUNT(*) as count
FROM stores
GROUP BY approval_status;

-- Verify RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('stores', 'products')
  AND policyname LIKE '%active%'
ORDER BY tablename, policyname;

-- =====================================================
-- NOTES:
-- =====================================================
-- ✅ Stores are now auto-approved on creation
-- ✅ Public can view active, non-blocked stores
-- ✅ Moderation still works via is_blocked field
-- ✅ Admin can still block/unblock stores
-- ✅ No functionality broken
-- ✅ Backward compatible - approval_status column kept but not enforced
