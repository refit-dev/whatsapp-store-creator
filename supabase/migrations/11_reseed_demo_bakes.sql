-- Reseed demo-bakes store and products
BEGIN;

-- Ensure the demo-bakes store exists
DO $$
DECLARE
  _store_id UUID;
BEGIN
  SELECT id INTO _store_id FROM stores WHERE handle = 'demo-bakes';
  IF NOT FOUND THEN
    INSERT INTO stores (handle, name, currency, whatsapp_e164, is_payments_enabled)
    VALUES (
      'demo-bakes',
      'Demo Bakes',
      'INR',
      '919999999999',
      false
    );
  END IF;
END $$;

-- Ensure demo products exist
INSERT INTO products (
  store_id, 
  title, 
  description, 
  price_cents, 
  currency, 
  image_urls, 
  variants, 
  is_active, 
  stock_qty
)
SELECT
  (SELECT id FROM stores WHERE handle = 'demo-bakes'),
  title,
  description,
  price_cents,
  'INR',
  '["/images/product-placeholder.jpg"]'::jsonb,
  '[]'::jsonb,
  true,
  50
FROM (
  VALUES
    ('Classic Sourdough', 'Crusty artisanal bread', 15000),
    ('Chocolate Croissant', 'Buttery, flaky pastry', 8000),
    ('Almond Tart', 'Rich almond filling', 12000)
) AS t(title, description, price_cents)
ON CONFLICT (id) DO UPDATE
SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  is_active = true;

COMMIT;