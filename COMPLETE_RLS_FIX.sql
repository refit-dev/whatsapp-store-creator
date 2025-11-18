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

