-- Public view for storefront (only safe columns)
CREATE OR REPLACE VIEW store_public AS
SELECT id, handle, name, logo_url, banner_url, currency
FROM stores;

-- Metrics: order events (e.g., opened_whatsapp)
CREATE TABLE IF NOT EXISTS order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert events
DROP POLICY IF EXISTS "Service role can insert order events" ON order_events;
CREATE POLICY "Service role can insert order events" ON order_events
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Indexes (idempotent create using IF NOT EXISTS where supported by PG 14+; otherwise re-run is fine)
CREATE UNIQUE INDEX IF NOT EXISTS stores_handle_idx ON stores(handle);
CREATE INDEX IF NOT EXISTS products_store_active_idx ON products(store_id, is_active);
CREATE INDEX IF NOT EXISTS orders_store_created_idx ON orders(store_id, created_at DESC);
