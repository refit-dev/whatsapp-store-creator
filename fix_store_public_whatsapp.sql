-- Fix store_public view to include whatsapp_e164 field
-- This ensures that the checkout page can access the updated phone number

BEGIN;

-- Drop and recreate store_public view with whatsapp_e164
DROP VIEW IF EXISTS store_public CASCADE;

CREATE OR REPLACE VIEW store_public AS
SELECT 
  id,
  handle,
  name,
  logo_url,
  banner_url,
  currency,
  whatsapp_e164,
  is_payments_enabled
FROM stores;

-- Grant permissions
GRANT SELECT ON store_public TO anon;
GRANT SELECT ON store_public TO authenticated;

-- Verify the view includes all necessary fields
SELECT 
  column_name,
  data_type 
FROM information_schema.columns 
WHERE table_name = 'store_public' 
ORDER BY ordinal_position;

COMMIT;