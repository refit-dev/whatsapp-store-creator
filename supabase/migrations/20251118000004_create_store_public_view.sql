-- Create store_public view for safe public access
-- This view only exposes necessary public information about stores

-- Drop view if exists
DROP VIEW IF EXISTS store_public;

-- Create view with only public-facing store information
CREATE VIEW store_public AS
SELECT
  id,
  handle,
  name,
  logo_url,
  banner_url,
  currency,
  whatsapp_e164,
  is_active,
  created_at
FROM stores
WHERE
  approval_status = 'approved'
  AND is_active = true
  AND (is_blocked IS NULL OR is_blocked = false);

-- Grant access to view
GRANT SELECT ON store_public TO anon, authenticated;

-- Add comment
COMMENT ON VIEW store_public IS 'Public view of approved, active, non-blocked stores. Safe for anonymous access.';
