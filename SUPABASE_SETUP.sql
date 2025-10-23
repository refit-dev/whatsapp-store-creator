-- ============================================
-- WhatsApp Store - Supabase Database Setup
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create tables
BEGIN;

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID,
  handle TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  whatsapp_e164 TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_payments_enabled BOOL DEFAULT false,
  payment_provider TEXT DEFAULT 'none',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  image_urls JSONB DEFAULT '[]'::jsonb,
  is_active BOOL DEFAULT true,
  stock_qty INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  buyer_address TEXT NOT NULL,
  items JSONB NOT NULL,
  subtotal_cents INT NOT NULL,
  discount_cents INT DEFAULT 0,
  total_cents INT NOT NULL,
  payment_link_url TEXT,
  status TEXT DEFAULT 'created',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMIT;

-- 2. Create the public view for storefronts
CREATE OR REPLACE VIEW store_public AS
SELECT 
  id,
  handle,
  name,
  logo_url,
  banner_url,
  currency,
  whatsapp_e164
FROM stores;

-- 3. Set up Row Level Security (RLS)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read stores through the view
CREATE POLICY "Public can read store_public" ON stores
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allow anyone to read active products
CREATE POLICY "Public can read active products" ON products
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Allow anyone to create orders
CREATE POLICY "Public can create orders" ON orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Store owners can manage their stores
CREATE POLICY "Authenticated users can manage their stores" ON stores
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR owner_id IS NULL);

-- Store owners can manage products
CREATE POLICY "Store owners can manage products" ON products
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = products.store_id 
      AND (stores.owner_id = auth.uid() OR stores.owner_id IS NULL)
    )
  );

-- Store owners can view orders
CREATE POLICY "Store owners can view orders" ON orders
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = orders.store_id 
      AND (stores.owner_id = auth.uid() OR stores.owner_id IS NULL)
    )
  );

-- Users can read their own record
CREATE POLICY "Users can read own record" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- 4. Insert demo store with products
INSERT INTO stores (
  handle, 
  name, 
  whatsapp_e164, 
  currency,
  logo_url,
  banner_url
) VALUES (
  'demo-bakery',
  'Sweet Delights Bakery',
  '+1234567890',
  'USD',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200',
  'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=1200'
) ON CONFLICT (handle) DO NOTHING;

-- Add products to the demo store
WITH store AS (
  SELECT id FROM stores WHERE handle = 'demo-bakery'
)
INSERT INTO products (store_id, title, description, price_cents, currency, image_urls, is_active) 
SELECT 
  store.id,
  title,
  description,
  price_cents,
  currency,
  image_urls::jsonb,
  is_active
FROM store, (VALUES
  ('Chocolate Croissant', 'Flaky, buttery croissant filled with rich dark chocolate', 450, 'USD', '["https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800"]', true),
  ('Blueberry Muffin', 'Fresh baked muffin bursting with juicy blueberries', 350, 'USD', '["https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=800"]', true),
  ('Red Velvet Cake Slice', 'Moist red velvet cake with cream cheese frosting', 650, 'USD', '["https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=800"]', true),
  ('Sourdough Bread', 'Artisanal sourdough with perfect crust and tangy flavor', 800, 'USD', '["https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800"]', true),
  ('Apple Pie', 'Classic homemade apple pie with cinnamon and flaky crust', 550, 'USD', '["https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=800"]', true),
  ('Bagel with Cream Cheese', 'Fresh baked bagel served with whipped cream cheese', 400, 'USD', '["https://images.unsplash.com/photo-1585220467297-21e0d3cf591f?w=800"]', true)
) AS p(title, description, price_cents, currency, image_urls, is_active)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE store_id = store.id);

-- Verify setup
SELECT 
  s.handle,
  s.name as store_name,
  COUNT(p.id) as product_count
FROM stores s
LEFT JOIN products p ON p.store_id = s.id
WHERE s.handle = 'demo-bakery'
GROUP BY s.handle, s.name;