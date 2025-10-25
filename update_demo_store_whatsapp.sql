-- Update demo store WhatsApp number
-- This will update the demo store to use the new WhatsApp number

BEGIN;

-- Update any existing demo stores (both demo-bakery and demo-bakes handles)
UPDATE stores 
SET whatsapp_e164 = '+917304848472'
WHERE handle IN ('demo-bakery', 'demo-bakes');

-- Check and create demo-bakery store if it doesn't exist
INSERT INTO stores (
  handle,
  name,
  whatsapp_e164,
  currency,
  is_payments_enabled,
  owner_id
) VALUES (
  'demo-bakery',
  'Sweet Delights Bakery',
  '+917304848472',
  'INR',
  false,
  NULL
) 
ON CONFLICT (handle) 
DO UPDATE SET 
  whatsapp_e164 = EXCLUDED.whatsapp_e164;

-- Verify the update
SELECT 
  handle,
  name,
  whatsapp_e164,
  currency,
  owner_id,
  created_at
FROM stores 
WHERE handle IN ('demo-bakery', 'demo-bakes')
ORDER BY handle;

COMMIT;

-- Final check
SELECT 'Demo store WhatsApp number updated successfully!' as message;
SELECT 
  'Visit http://localhost:3001/' || handle || ' to test the updated store' as test_url
FROM stores 
WHERE handle = 'demo-bakery';