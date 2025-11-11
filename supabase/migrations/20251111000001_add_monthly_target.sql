-- Add monthly_target_cents column to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS monthly_target_cents INTEGER DEFAULT 0;

COMMENT ON COLUMN stores.monthly_target_cents IS 'Monthly revenue target in cents';
