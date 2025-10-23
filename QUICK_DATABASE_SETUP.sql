-- ============================================
-- WhatsApp Store - Quick Database Setup
-- Run this in PostgreSQL/Supabase SQL Editor
-- ============================================

-- Create basic tables (no auth dependencies)
BEGIN;

-- 1. Create stores table
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

-- 2. Create products table
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

-- 3. Create orders table
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

-- 4. Create users table (simplified)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create the public view for storefronts
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

COMMIT;

-- ============================================
-- Insert Demo Store with Products
-- ============================================

-- Insert demo bakery store
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

-- Insert products for demo store
DO $$
DECLARE 
  store_uuid UUID;
BEGIN
  -- Get the store ID
  SELECT id INTO store_uuid FROM stores WHERE handle = 'demo-bakery';
  
  -- Only insert if store exists and no products exist
  IF store_uuid IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM products WHERE store_id = store_uuid) THEN
      INSERT INTO products (store_id, title, description, price_cents, currency, image_urls, is_active) VALUES
      (store_uuid, 'Chocolate Croissant', 'Flaky, buttery croissant filled with rich dark chocolate', 450, 'USD', '["https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800"]', true),
      (store_uuid, 'Blueberry Muffin', 'Fresh baked muffin bursting with juicy blueberries', 350, 'USD', '["https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=800"]', true),
      (store_uuid, 'Red Velvet Cake Slice', 'Moist red velvet cake with cream cheese frosting', 650, 'USD', '["https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=800"]', true),
      (store_uuid, 'Sourdough Bread', 'Artisanal sourdough with perfect crust and tangy flavor', 800, 'USD', '["https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800"]', true),
      (store_uuid, 'Apple Pie', 'Classic homemade apple pie with cinnamon and flaky crust', 550, 'USD', '["https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=800"]', true),
      (store_uuid, 'Bagel with Cream Cheese', 'Fresh baked bagel served with whipped cream cheese', 400, 'USD', '["https://images.unsplash.com/photo-1585220467297-21e0d3cf591f?w=800"]', true);
    END IF;
  END IF;
END $$;

-- Verify the setup
SELECT 'Setup complete! Visit /demo-bakery to see the store' as message;
SELECT COUNT(*) as product_count FROM products WHERE store_id IN (SELECT id FROM stores WHERE handle = 'demo-bakery');