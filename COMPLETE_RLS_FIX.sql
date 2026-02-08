-- COMPLETE FIX FOR STORE VISIBILITY ISSUE
-- Run this entire script in Supabase SQL Editor

-- =====================================================
-- 1. Fix RLS Policies on Stores Table
-- =====================================================

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Public can view approved active stores" ON stores;
DROP POLICY IF EXISTS "Anyone can view approved stores by handle" ON stores;
DROP POLICY IF EXISTS "Store owners can view their own stores" ON stores;
DROP POLICY IF EXISTS "Admins can view all stores" ON stores;
DROP POLICY IF EXISTS "Admins can update any store" ON stores;

-- Allow anonymous/public users to view approved, active, non-blocked stores
CREATE POLICY "Public can view approved active stores"
  ON stores
  FOR SELECT
  TO anon, authenticated
  USING (
    approval_status = 'approved'
    AND is_active = true
    AND (is_blocked IS NULL OR is_blocked = false)
  );

-- Allow store owners to view their own stores (ANY status)
CREATE POLICY "Store owners can view their own stores"
  ON stores
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
  );

-- Allow admins to view all stores
CREATE POLICY "Admins can view all stores"
  ON stores
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- Allow admins to update any store
CREATE POLICY "Admins can update any store"
  ON stores
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- =====================================================
-- 2. Fix RLS Policies on Products Table
-- =====================================================

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Public can view products from approved stores" ON products;
DROP POLICY IF EXISTS "Anyone can view active products from approved stores" ON products;
DROP POLICY IF EXISTS "Store owners can view their own products" ON products;

-- Allow public to view active products from approved stores
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

-- Allow store owners to view their own products (ANY status)
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

-- =====================================================
-- 3. Create store_public View
-- =====================================================

-- Drop view if exists
DROP VIEW IF EXISTS store_public CASCADE;

-- Create view with only public information
CREATE VIEW store_public AS
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
  approval_status = 'approved'
  AND is_active = true
  AND (is_blocked IS NULL OR is_blocked = false);

-- Grant access
GRANT SELECT ON store_public TO anon, authenticated;

-- =====================================================
-- 4. Add Helpful Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_stores_handle ON stores(handle);
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_approval_active ON stores(approval_status, is_active) 
  WHERE is_blocked = false OR is_blocked IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_store_id_active ON products(store_id, is_active);

-- =====================================================
-- 5. Verify Your Store Data
-- =====================================================

-- Check stores that should be public
SELECT 
  handle,
  name,
  approval_status,
  is_active,
  is_blocked,
  owner_id
FROM stores
WHERE approval_status = 'approved';

-- If your store is not approved, run this (replace 'your-handle' with actual handle):
-- UPDATE stores 
-- SET 
--   approval_status = 'approved',
--   is_active = true,
--   is_blocked = false,
--   approved_at = NOW()
-- WHERE handle = 'your-handle';

-- =====================================================
-- 6. Fix RLS Policies on user_subscriptions Table
-- =====================================================

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can view their subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "users_view_own_subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can read their own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Service role has full access" ON user_subscriptions;

-- Create a proper SELECT policy for users to read their own subscriptions
CREATE POLICY "Users can read their own subscriptions"
ON user_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Ensure service_role can do everything (for admin/backend)
CREATE POLICY "Service role has full access"
ON user_subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify the subscription policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  '✅ Subscription RLS Policy' as check_type
FROM pg_policies
WHERE tablename = 'user_subscriptions'
ORDER BY policyname;

-- Test: Try to read subscription as authenticated user
SELECT 
  us.id,
  us.status,
  us.is_trial,
  us.ends_at,
  sp.name,
  sp.price_cents,
  '✅ If you see this, RLS is working!' as test_result
FROM user_subscriptions us
LEFT JOIN subscription_plans sp ON sp.id = us.plan_id
-- Example query to check user subscriptions
-- WHERE us.user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com')
  AND us.status = 'active'
LIMIT 1;

