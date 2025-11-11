-- Add delivery settings columns to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(50) DEFAULT 'none', -- 'none', 'time_slots', 'days', 'immediate'
ADD COLUMN IF NOT EXISTS delivery_slots JSONB DEFAULT '[]'::jsonb; -- Array of time slots like ["9AM-12PM", "2PM-5PM"]

COMMENT ON COLUMN stores.delivery_enabled IS 'Whether delivery scheduling is enabled';
COMMENT ON COLUMN stores.delivery_type IS 'Type of delivery scheduling: none, time_slots, days, immediate';
COMMENT ON COLUMN stores.delivery_slots IS 'Array of available delivery slots or days';

-- Example data structure for delivery_slots:
-- For time_slots: ["9AM-12PM", "12PM-3PM", "3PM-6PM", "6PM-9PM"]
-- For days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
-- For immediate: []
