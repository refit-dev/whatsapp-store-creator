-- Fix permissions and policies
-- Grant access to store_public
GRANT SELECT ON store_public TO anon;
GRANT SELECT ON store_public TO authenticated;

-- Make products readable
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active products" ON products;
CREATE POLICY "Public can view active products" ON products FOR SELECT USING (true);

-- Verify store_id matches
UPDATE products 
SET store_id = (SELECT id FROM stores WHERE handle = 'demo-bakes')
WHERE id IN (
  SELECT p.id
  FROM products p
  JOIN stores s ON s.handle = 'demo-bakes'
  WHERE p.store_id != s.id
);

-- Remove duplicates keeping newest
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY title, store_id ORDER BY created_at DESC) as rn
  FROM products
  WHERE store_id = (SELECT id FROM stores WHERE handle = 'demo-bakes')
)
DELETE FROM products
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);