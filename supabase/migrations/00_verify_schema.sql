-- Ensure required extension for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create core tables if they do not already exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  title TEXT NOT NULL,
  description TEXT,
  price_cents INT NOT NULL,
  currency TEXT NOT NULL,
  image_urls JSONB,
  variants JSONB,
  is_active BOOL DEFAULT true,
  stock_qty INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_store_active_idx ON products(store_id, is_active);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
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

CREATE TABLE IF NOT EXISTS store_members (
  store_id UUID REFERENCES stores(id),
  user_id UUID REFERENCES users(id),
  role TEXT CHECK (role IN ('owner','admin')),
  PRIMARY KEY (store_id, user_id)
);
