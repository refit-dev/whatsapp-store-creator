-- Reset and simplify all policies
BEGIN;

-- 1. Drop ALL existing policies on affected tables
DO $$
DECLARE
    _pol record;
BEGIN
    -- Drop all policies on products table
    FOR _pol IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'products'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON products', _pol.policyname);
    END LOOP;

    -- Drop all policies on stores table
    FOR _pol IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'stores'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON stores', _pol.policyname);
    END LOOP;

    -- Drop all policies on store_members table
    FOR _pol IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'store_members'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON store_members', _pol.policyname);
    END LOOP;
END $$;

-- 2. Disable RLS temporarily on affected tables
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_members DISABLE ROW LEVEL SECURITY;

-- 3. Re-enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_members ENABLE ROW LEVEL SECURITY;

-- 4. Create simple policies for public access
-- Product policies
CREATE POLICY "anon_select_products" ON products
  FOR SELECT USING (is_active = true);

-- Store policies
CREATE POLICY "anon_select_stores" ON stores
  FOR SELECT USING (true);

-- Store member policies
CREATE POLICY "anon_select_members" ON store_members
  FOR SELECT USING (true);

-- 5. Grant necessary permissions
GRANT SELECT ON products TO anon;
GRANT SELECT ON products TO authenticated;
GRANT SELECT ON stores TO anon;
GRANT SELECT ON stores TO authenticated;
GRANT SELECT ON store_members TO anon;
GRANT SELECT ON store_members TO authenticated;
GRANT SELECT ON store_public TO anon;
GRANT SELECT ON store_public TO authenticated;

-- 6. Ensure demo store exists
DO $$
DECLARE
  _store_id UUID;
BEGIN
  -- Check if demo store exists
  SELECT id INTO _store_id FROM stores WHERE handle = 'demo-bakes';
  
  -- If not, create it
  IF NOT FOUND THEN
    INSERT INTO stores (handle, name, currency, whatsapp_e164, is_payments_enabled)
    VALUES (
      'demo-bakes',
      'Demo Bakes',
      'INR',
      '919999999999',
      false
    ) RETURNING id INTO _store_id;
  END IF;

  -- Add some products if none exist
  IF NOT EXISTS (SELECT 1 FROM products WHERE store_id = _store_id) THEN
    INSERT INTO products (
      store_id,
      title,
      description,
      price_cents,
      currency,
      image_urls,
      is_active,
      stock_qty
    ) VALUES
      (_store_id, 'Sourdough Loaf', 'Classic sourdough bread', 2499, 'INR', '["/images/product-placeholder.jpg"]', true, 10),
      (_store_id, 'Chocolate Croissant', 'Flaky pastry with rich chocolate', 1999, 'INR', '["/images/product-placeholder.jpg"]', true, 15),
      (_store_id, 'Whole Wheat Bread', 'Healthy whole grain bread', 1499, 'INR', '["/images/product-placeholder.jpg"]', true, 20);
  END IF;
END $$;

-- 7. Verify setup
SELECT 
  (SELECT COUNT(*) FROM stores WHERE handle = 'demo-bakes') as store_count,
  (SELECT COUNT(*) FROM products p JOIN stores s ON s.id = p.store_id WHERE s.handle = 'demo-bakes' AND p.is_active = true) as active_products;

COMMIT;