-- Fix permissions and verify data
BEGIN;

-- Ensure RLS is properly set up
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Grant basic read permissions
GRANT SELECT ON products TO anon;
GRANT SELECT ON products TO authenticated;
GRANT SELECT ON stores TO anon;
GRANT SELECT ON stores TO authenticated;
GRANT SELECT ON store_public TO anon;
GRANT SELECT ON store_public TO authenticated;

-- Make products publicly readable
DROP POLICY IF EXISTS "Public can view active products" ON products;
CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (true);

-- Make stores publicly readable through view
DROP POLICY IF EXISTS "Public can view stores" ON stores;
CREATE POLICY "Public can view stores" ON stores
  FOR SELECT USING (true);

-- Create service role policy for products
DROP POLICY IF EXISTS "Service role can manage products" ON products;
CREATE POLICY "Service role can manage products" ON products
  FOR ALL USING (auth.role() = 'service_role');

-- Verify the demo-bakes store exists
DO $$
DECLARE
  _store_id UUID;
BEGIN
  SELECT id INTO _store_id FROM stores WHERE handle = 'demo-bakes';
  IF NOT FOUND THEN
    INSERT INTO stores (id, handle, name, currency, whatsapp_e164, is_payments_enabled)
    VALUES (
      'c0000000-0000-0000-0000-000000000001',
      'demo-bakes',
      'Demo Bakes',
      'INR',
      '919999999999',
      false
    );
  END IF;
END $$;

-- Ensure demo products exist
INSERT INTO products (id, store_id, title, description, price_cents, currency, image_urls, variants, is_active, stock_qty)
SELECT
  uuid_in(md5(i::text || clock_timestamp()::text)::cstring),
  (SELECT id FROM stores WHERE handle = 'demo-bakes'),
  title,
  description,
  price_cents,
  'INR',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  50
FROM (
  VALUES
    (1, 'Classic Sourdough', 'Crusty artisanal bread', 15000),
    (2, 'Chocolate Croissant', 'Buttery, flaky pastry', 8000),
    (3, 'Almond Tart', 'Rich almond filling', 12000)
) AS t(i, title, description, price_cents)
ON CONFLICT DO NOTHING;

COMMIT;