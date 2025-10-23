-- Final cleanup of all demo products
BEGIN;

-- 1. Get the demo store id
DO $$
DECLARE
  _store_id UUID;
BEGIN
  -- Get store ID
  SELECT id INTO _store_id FROM stores WHERE handle = 'demo-bakes';
  
  -- Delete ALL existing products
  DELETE FROM products WHERE store_id = _store_id;
  
  -- Insert ONLY these three products
  INSERT INTO products (
    id,
    store_id,
    title,
    description,
    price_cents,
    currency,
    image_urls,
    variants,
    is_active,
    stock_qty,
    created_at
  ) VALUES
    (
      gen_random_uuid(),
      _store_id,
      'Almond Tart',
      'Rich almond filling',
      12000,
      'INR',
      '["/images/product-placeholder.jpg"]',
      '[]',
      true,
      10,
      now()
    ),
    (
      gen_random_uuid(),
      _store_id,
      'Chocolate Croissant',
      'Buttery, flaky pastry',
      8000,
      'INR',
      '["/images/product-placeholder.jpg"]',
      '[]',
      true,
      15,
      now()
    ),
    (
      gen_random_uuid(),
      _store_id,
      'Classic Sourdough',
      'Crusty artisanal bread',
      15000,
      'INR',
      '["/images/product-placeholder.jpg"]',
      '[]',
      true,
      20,
      now()
    );
END $$;

-- Disable all migrations that might add more products
CREATE TABLE IF NOT EXISTS migration_locks (
  migration_name TEXT PRIMARY KEY,
  locked_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO migration_locks (migration_name) VALUES 
  ('02_demo_seed.sql'),
  ('05_seed_demo_bakes.sql'),
  ('08_fix_store_public.sql'),
  ('10_fix_permissions_and_data.sql'),
  ('11_reseed_demo_bakes.sql')
ON CONFLICT (migration_name) DO NOTHING;

-- Final verification
SELECT 
  'Final State' as check_type,
  json_build_object(
    'store_count', (SELECT COUNT(*) FROM stores WHERE handle = 'demo-bakes'),
    'product_count', (SELECT COUNT(*) FROM products p JOIN stores s ON s.id = p.store_id WHERE s.handle = 'demo-bakes'),
    'products', (
      SELECT json_agg(json_build_object(
        'title', p.title,
        'price_cents', p.price_cents,
        'is_active', p.is_active
      ))
      FROM products p
      JOIN stores s ON s.id = p.store_id
      WHERE s.handle = 'demo-bakes'
    )
  ) as details;

COMMIT;