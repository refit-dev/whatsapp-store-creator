-- Clean up duplicate products and ensure correct data
BEGIN;

-- 1. Get the demo store id
DO $$
DECLARE
  _store_id UUID;
BEGIN
  SELECT id INTO _store_id FROM stores WHERE handle = 'demo-bakes';
  
  -- 2. Remove all existing products for this store
  DELETE FROM products WHERE store_id = _store_id;
  
  -- 3. Insert fresh products with specific IDs to prevent duplication
  INSERT INTO products (
    id,
    store_id,
    title,
    description,
    price_cents,
    currency,
    image_urls,
    is_active,
    stock_qty
  ) VALUES
    (gen_random_uuid(), _store_id, 'Almond Tart', 'Rich almond filling', 12000, 'INR', '["/images/product-placeholder.jpg"]', true, 10),
    (gen_random_uuid(), _store_id, 'Chocolate Croissant', 'Buttery, flaky pastry', 8000, 'INR', '["/images/product-placeholder.jpg"]', true, 15),
    (gen_random_uuid(), _store_id, 'Classic Sourdough', 'Crusty artisanal bread', 15000, 'INR', '["/images/product-placeholder.jpg"]', true, 20);

END $$;

-- 4. Verify the cleanup
SELECT 
  (SELECT COUNT(*) FROM stores WHERE handle = 'demo-bakes') as store_count,
  (SELECT COUNT(*) FROM products p 
   JOIN stores s ON s.id = p.store_id 
   WHERE s.handle = 'demo-bakes' AND p.is_active = true) as active_products;

COMMIT;