# RLS Policy Fix - Apply to Supabase

## 🔴 CRITICAL: Your Store Pages Return 404 Because of Missing RLS Policies

**Problem**: Anonymous users cannot view stores because there's no RLS policy allowing it.

**Solution**: Apply the SQL migrations below to your Supabase database.

---

## ⚡ Quick Fix Steps

### 1. Go to Supabase Dashboard

- Visit: https://supabase.com/dashboard
- Select your project
- Go to **SQL Editor** (left sidebar)

### 2. Copy & Run This SQL

```sql
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
DROP POLICY IF EXISTS "Store owners can view their own stores" ON stores;
CREATE POLICY "Store owners can view their own stores"
  ON stores
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR owner_id = auth.uid()
  );

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_stores_handle ON stores(handle);
CREATE INDEX IF NOT EXISTS idx_stores_approval_active ON stores(approval_status, is_active) WHERE is_blocked = false OR is_blocked IS NULL;
```

### 3. Run Products Policy Fix

```sql
-- Fix Public Product Access
-- Allow anonymous users to view products from approved stores

DROP POLICY IF EXISTS "Public can view products from approved stores" ON products;
DROP POLICY IF EXISTS "Anyone can view active products from approved stores" ON products;

-- Allow public/anonymous users to view products
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

-- Allow store owners to view their own products
DROP POLICY IF EXISTS "Store owners can view their own products" ON products;
CREATE POLICY "Store owners can view their own products"
  ON products
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores
      WHERE user_id = auth.uid() OR owner_id = auth.uid()
    )
  );

-- Add index
CREATE INDEX IF NOT EXISTS idx_products_store_id_active ON products(store_id, is_active);
```

### 4. Verify Your Store

After running the SQL:

1. **Check your store is approved**: Go to Supabase → Table Editor → `stores` → Find your store → Ensure `approval_status` = `'approved'`
2. **Check is_active**: Ensure `is_active` = `true`
3. **Test the URL**: Visit `https://www.watzy.app/your-handle` (or your Vercel URL)

---

## ✅ What This Fixes

- ✅ Anonymous users can now view approved stores
- ✅ Store pages will load instead of showing 404
- ✅ Products will be visible to customers
- ✅ Store owners can still see their own stores regardless of approval status

---

## 🔍 Troubleshooting

### Still getting 404?

Check your store in the database:

1. Go to Supabase → **Table Editor** → `stores`
2. Find your store (handle: "watzy" or whatever you're using)
3. Verify:
   - `approval_status` = `'approved'`
   - `is_active` = `true`
   - `is_blocked` = `false` or `NULL`

If any of these are incorrect, update them in the table editor.

### How to approve a store manually:

```sql
UPDATE stores
SET
  approval_status = 'approved',
  is_active = true,
  is_blocked = false,
  approved_at = NOW()
WHERE handle = 'watzy';  -- Replace with your handle
```

---

## 📝 Files Created

- `supabase/migrations/20251118000002_fix_public_store_access.sql`
- `supabase/migrations/20251118000003_fix_public_product_access.sql`

These migrations are ready to apply to your production database!
