-- ============================================
-- WhatsApp Micro-Store - Complete Database Setup
-- Run this ONCE in your Supabase SQL Editor
-- ============================================

BEGIN;

-- ============================================
-- 1. Create Tables
-- ============================================

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Stores
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id),
  handle TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  whatsapp_e164 TEXT NOT NULL,
  currency TEXT NOT NULL,
  is_payments_enabled BOOL DEFAULT false,
  payment_provider TEXT CHECK (payment_provider IN ('none','stripe','razorpay')) DEFAULT 'none',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS stores_handle_idx ON stores(handle);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price_cents INT NOT NULL,
  currency TEXT NOT NULL,
  image_urls JSONB DEFAULT '[]'::jsonb,
  variants JSONB DEFAULT '[]'::jsonb,
  is_active BOOL DEFAULT true,
  stock_qty INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_store_active_idx ON products(store_id, is_active);

-- Orders
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
  status TEXT CHECK (status IN ('created','opened_whatsapp','paid','cancelled')) DEFAULT 'created',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_store_created_idx ON orders(store_id, created_at DESC);

-- Store Members
CREATE TABLE IF NOT EXISTS store_members (
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner','admin')),
  PRIMARY KEY (store_id, user_id)
);

-- Order Events (audit trail)
CREATE TABLE IF NOT EXISTS order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. Create Public View for Storefronts
-- ============================================

DROP VIEW IF EXISTS store_public CASCADE;

CREATE VIEW store_public AS
SELECT 
  id,
  handle,
  name,
  logo_url,
  banner_url,
  currency,
  whatsapp_e164
FROM stores;

-- ============================================
-- 3. Set up Row Level Security (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;

-- Users: can read their own record
DROP POLICY IF EXISTS "Users can read own record" ON users;
CREATE POLICY "Users can read own record" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Stores: owners can manage, public can read store_public
DROP POLICY IF EXISTS "Store owners can manage their stores" ON stores;
CREATE POLICY "Store owners can manage their stores" ON stores
  FOR ALL TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM store_members WHERE store_id = stores.id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Anyone can view stores" ON stores;
CREATE POLICY "Anyone can view stores" ON stores
  FOR SELECT TO anon, authenticated
  USING (true);

-- Products: store owners can manage, public can view active products
DROP POLICY IF EXISTS "Store owners can manage products" ON products;
CREATE POLICY "Store owners can manage products" ON products
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = products.store_id 
      AND (stores.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM store_members WHERE store_id = stores.id AND user_id = auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Anyone can view active products" ON products;
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Orders: store owners can view, anyone can create
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Store owners can view orders" ON orders;
CREATE POLICY "Store owners can view orders" ON orders
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = orders.store_id 
      AND (stores.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM store_members WHERE store_id = stores.id AND user_id = auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Store owners can update orders" ON orders;
CREATE POLICY "Store owners can update orders" ON orders
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = orders.store_id 
      AND (stores.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM store_members WHERE store_id = stores.id AND user_id = auth.uid()))
    )
  );

-- Store Members
DROP POLICY IF EXISTS "Members can read their memberships" ON store_members;
CREATE POLICY "Members can read their memberships" ON store_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Order Events
DROP POLICY IF EXISTS "Anyone can create order events" ON order_events;
CREATE POLICY "Anyone can create order events" ON order_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- ============================================
-- 4. Grant Permissions
-- ============================================

GRANT SELECT ON store_public TO anon, authenticated;
GRANT SELECT ON products TO anon, authenticated;
GRANT INSERT ON orders TO anon, authenticated;
GRANT INSERT ON order_events TO anon, authenticated;

-- ============================================
-- 5. Create Demo Store with Real Data
-- ============================================

-- Insert demo user
INSERT INTO users (id, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'demo@microstore.app')
ON CONFLICT (id) DO NOTHING;

-- Insert demo store
INSERT INTO stores (
  id,
  owner_id,
  handle,
  name,
  whatsapp_e164,
  currency,
  is_payments_enabled,
  payment_provider
) VALUES (
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000001',
  'demo-bakes',
  '🥐 Demo Bakery',
  '919999999999',
  'USD',
  false,
  'none'
) ON CONFLICT (handle) DO UPDATE SET
  name = EXCLUDED.name,
  whatsapp_e164 = EXCLUDED.whatsapp_e164,
  currency = EXCLUDED.currency;

-- Insert demo products with real image URLs
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
  (
    '00000000-0000-0000-0000-000000000200',
    '00000000-0000-0000-0000-000000000020',
    'Artisan Sourdough Loaf',
    'Handcrafted sourdough bread with a perfectly crispy crust and soft, tangy interior. Made with a 72-hour fermentation process.',
    899,
    'USD',
    '["https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800&q=80"]'::jsonb,
    true,
    15
  ),
  (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000020',
    'Chocolate Croissant',
    'Buttery, flaky croissant filled with premium dark chocolate. Baked fresh every morning.',
    495,
    'USD',
    '["https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80"]'::jsonb,
    true,
    30
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000020',
    'Blueberry Muffin',
    'Moist and fluffy muffin bursting with fresh blueberries and a golden crumb topping.',
    349,
    'USD',
    '["https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=800&q=80"]'::jsonb,
    true,
    25
  ),
  (
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000020',
    'Cinnamon Roll',
    'Soft, gooey cinnamon rolls topped with cream cheese frosting. A customer favorite!',
    425,
    'USD',
    '["https://images.unsplash.com/photo-1626094309830-abbb0c99da4a?w=800&q=80"]'::jsonb,
    true,
    20
  ),
  (
    '00000000-0000-0000-0000-000000000204',
    '00000000-0000-0000-0000-000000000020',
    'Baguette',
    'Traditional French baguette with a crispy crust and airy crumb. Perfect for sandwiches or with butter.',
    325,
    'USD',
    '["https://images.unsplash.com/photo-1534620808146-d33bb39128b2?w=800&q=80"]'::jsonb,
    true,
    40
  ),
  (
    '00000000-0000-0000-0000-000000000205',
    '00000000-0000-0000-0000-000000000020',
    'Almond Croissant',
    'Classic croissant filled with sweet almond paste and topped with sliced almonds.',
    525,
    'USD',
    '["https://images.unsplash.com/photo-1623334044303-241021148842?w=800&q=80"]'::jsonb,
    true,
    18
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  image_urls = EXCLUDED.image_urls,
  stock_qty = EXCLUDED.stock_qty;

-- Insert store membership
INSERT INTO store_members (store_id, user_id, role)
VALUES ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'owner')
ON CONFLICT (store_id, user_id) DO NOTHING;

COMMIT;

-- ============================================
-- Verification
-- ============================================
SELECT 
  'Database setup complete!' as message,
  (SELECT COUNT(*) FROM stores) as total_stores,
  (SELECT COUNT(*) FROM products WHERE is_active = true) as active_products,
  (SELECT COUNT(*) FROM store_public) as public_stores;
