-- Check and fix store_public view
BEGIN;

-- Drop and recreate store_public view
DROP VIEW IF EXISTS store_public CASCADE;

CREATE OR REPLACE VIEW store_public AS
SELECT 
  id,
  handle,
  name,
  logo_url,
  banner_url,
  currency
FROM stores;

-- Grant permissions
GRANT SELECT ON store_public TO anon;
GRANT SELECT ON store_public TO authenticated;

-- Verify demo store exists in the view
SELECT EXISTS(
  SELECT 1 FROM store_public WHERE handle = 'demo-bakes'
) as demo_store_exists;

-- If demo store doesn't exist in stores table, create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM stores WHERE handle = 'demo-bakes') THEN
    INSERT INTO stores (
      handle,
      name,
      currency,
      whatsapp_e164,
      is_payments_enabled
    ) VALUES (
      'demo-bakes',
      'Demo Bakes',
      'INR',
      '919999999999',
      false
    );
  END IF;
END $$;

-- Final verification
SELECT 
  json_build_object(
    'store_exists_in_stores', (SELECT EXISTS(SELECT 1 FROM stores WHERE handle = 'demo-bakes')),
    'store_exists_in_view', (SELECT EXISTS(SELECT 1 FROM store_public WHERE handle = 'demo-bakes')),
    'store_details', (SELECT row_to_json(s) FROM store_public s WHERE handle = 'demo-bakes')
  ) as store_check;

COMMIT;