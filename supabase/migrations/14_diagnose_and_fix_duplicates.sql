-- Diagnostic query to check product duplication
BEGIN;

-- Get store information
WITH store_check AS (
  SELECT id, handle, name 
  FROM stores 
  WHERE handle = 'demo-bakes'
)
SELECT 'Store Info' as check_type, json_agg(store_check.*) as details
FROM store_check

UNION ALL

-- Check for duplicate products by title
SELECT 
  'Product Duplicates' as check_type,
  COALESCE(json_agg(json_build_object(
    'title', title,
    'count', count,
    'ids', ids,
    'store_ids', store_ids
  )), '[]'::json) as details
FROM (
  SELECT 
    title,
    COUNT(*) as count,
    array_agg(id) as ids,
    array_agg(store_id) as store_ids
  FROM products
  WHERE store_id IN (SELECT id FROM stores WHERE handle = 'demo-bakes')
  GROUP BY title
  HAVING COUNT(*) > 1
) dupes

UNION ALL

-- List all products for verification
SELECT 
  'All Products' as check_type,
  COALESCE(json_agg(json_build_object(
    'id', products.id,
    'title', products.title,
    'price_cents', products.price_cents,
    'is_active', products.is_active,
    'store_handle', s.handle
  ) ORDER BY products.title), '[]'::json) as details
FROM products
JOIN stores s ON s.id = products.store_id
WHERE s.handle = 'demo-bakes';

-- Now clean up ALL duplicate products, keeping only the newest version of each
WITH ranked_products AS (
  SELECT 
    id,
    store_id,
    title,
    ROW_NUMBER() OVER (PARTITION BY store_id, title ORDER BY created_at DESC) as rn
  FROM products
  WHERE store_id IN (SELECT id FROM stores WHERE handle = 'demo-bakes')
),
deleted_products AS (
  DELETE FROM products
  WHERE id IN (
    SELECT id 
    FROM ranked_products 
    WHERE rn > 1
  )
  RETURNING id
)
SELECT 'Deleted Products Count' as check_type, json_build_object('count', COUNT(*)) as details
FROM deleted_products;

-- Set correct prices for remaining products
UPDATE products
SET price_cents = CASE
  WHEN title = 'Almond Tart' THEN 12000
  WHEN title = 'Chocolate Croissant' THEN 8000
  WHEN title = 'Classic Sourdough' THEN 15000
  ELSE price_cents
END
WHERE store_id IN (SELECT id FROM stores WHERE handle = 'demo-bakes');

-- Final verification
SELECT 
  'Final Product Count' as check_type,
  json_build_object(
    'total_count', COUNT(*),
    'products', json_agg(json_build_object(
      'title', title,
      'price_cents', price_cents,
      'is_active', is_active
    ))
  ) as details
FROM products p
JOIN stores s ON s.id = p.store_id
WHERE s.handle = 'demo-bakes'
GROUP BY s.handle;

COMMIT;