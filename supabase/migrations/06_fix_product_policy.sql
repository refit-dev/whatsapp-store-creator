-- Make product policy more permissive
DROP POLICY IF EXISTS "Public can view active products" ON products;
CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (true);  -- Allow all reads, is_active check in query

-- Verify store data
SELECT * FROM store_public WHERE handle = 'demo-bakes';

-- Verify products are linked
SELECT p.* 
FROM products p
JOIN stores s ON s.id = p.store_id
WHERE s.handle = 'demo-bakes'
AND p.is_active = true;