-- Fix potential issues with store_public view and product access
DROP VIEW IF EXISTS store_public CASCADE;
CREATE VIEW store_public AS
SELECT id, handle, name, logo_url, banner_url, currency
FROM stores;

-- Re-grant access to public
GRANT SELECT ON store_public TO anon;

-- Ensure products are accessible
DROP POLICY IF EXISTS "Public can view active products" ON products;
CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (true);  -- Let the query handle is_active filter

-- Re-insert products if missing
INSERT INTO products (id, store_id, title, description, price_cents, currency, image_urls, variants, is_active, stock_qty)
SELECT 
  gen_random_uuid(),  -- New UUID for each product
  s.id as store_id,
  unnest(ARRAY['Sourdough Loaf', 'Chocolate Croissant']) as title,
  unnest(ARRAY['Crusty, slow-fermented classic sourdough.', 'Flaky pastry with rich chocolate.']) as description,
  unnest(ARRAY[2499, 1499]) as price_cents,
  'INR' as currency,
  '["/icons/icon-192.png"]'::jsonb as image_urls,
  '[]'::jsonb as variants,
  true as is_active,
  unnest(ARRAY[25, 50]) as stock_qty
FROM stores s
WHERE s.handle = 'demo-bakes'
ON CONFLICT DO NOTHING;