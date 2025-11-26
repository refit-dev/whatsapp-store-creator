-- Add Inquiry/Interest System for High-Value Products (Property Dealers, etc.)
-- Enables stores to operate in Order Mode, Inquiry Mode, or Hybrid Mode

-- =====================================================
-- 1. Add store_mode to stores table
-- =====================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' 
    AND column_name = 'store_mode'
  ) THEN
    ALTER TABLE stores 
    ADD COLUMN store_mode TEXT DEFAULT 'order' 
    CHECK (store_mode IN ('order', 'inquiry', 'hybrid'));
    
    COMMENT ON COLUMN stores.store_mode 
    IS 'Store interaction mode: order (traditional e-commerce), inquiry (lead generation), hybrid (both)';
  END IF;
END $$;

-- =====================================================
-- 2. Add interaction_type to products table
-- =====================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'interaction_type'
  ) THEN
    ALTER TABLE products 
    ADD COLUMN interaction_type TEXT DEFAULT 'buy_now' 
    CHECK (interaction_type IN ('buy_now', 'inquiry'));
    
    COMMENT ON COLUMN products.interaction_type 
    IS 'Product interaction: buy_now (add to cart), inquiry (express interest form)';
  END IF;
END $$;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_interaction_type 
ON products(interaction_type);

-- =====================================================
-- 3. Create inquiries table for lead tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  -- Customer Information
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  
  -- Inquiry Details
  message TEXT,
  preferred_contact_time TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  
  -- Lead Tracking
  status TEXT DEFAULT 'new' CHECK (status IN (
    'new', 
    'contacted', 
    'site_visit_scheduled', 
    'negotiating', 
    'converted', 
    'lost'
  )),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  
  -- Follow-up & Notes
  notes TEXT,
  follow_up_date TIMESTAMPTZ,
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Conversion Tracking
  converted_at TIMESTAMPTZ,
  conversion_value INTEGER,
  lost_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inquiries_store_id ON inquiries(store_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_product_id ON inquiries(product_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_follow_up_date ON inquiries(follow_up_date);

-- Add comment
COMMENT ON TABLE inquiries IS 'Tracks customer inquiries/leads for high-value products (properties, vehicles, B2B)';

-- =====================================================
-- 4. Create inquiry_interactions table for timeline
-- =====================================================
CREATE TABLE IF NOT EXISTS inquiry_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  
  -- Interaction Details
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'status_change',
    'call',
    'whatsapp',
    'email',
    'site_visit',
    'meeting',
    'note'
  )),
  notes TEXT,
  previous_status TEXT,
  new_status TEXT,
  
  -- Tracking
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inquiry_interactions_inquiry_id 
ON inquiry_interactions(inquiry_id);

CREATE INDEX IF NOT EXISTS idx_inquiry_interactions_created_at 
ON inquiry_interactions(created_at DESC);

-- =====================================================
-- 5. Enable RLS on inquiries table
-- =====================================================
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Store owners can view their inquiries
CREATE POLICY "Store owners can view their inquiries"
ON inquiries FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = inquiries.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- Store owners can update their inquiries
CREATE POLICY "Store owners can update their inquiries"
ON inquiries FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = inquiries.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- Anyone can insert inquiries (customers)
CREATE POLICY "Anyone can submit inquiries"
ON inquiries FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admins can view all inquiries
CREATE POLICY "Admins can view all inquiries"
ON inquiries FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
    AND admins.is_active = true
  )
);

-- =====================================================
-- 6. Enable RLS on inquiry_interactions
-- =====================================================
ALTER TABLE inquiry_interactions ENABLE ROW LEVEL SECURITY;

-- Store owners can view interactions for their inquiries
CREATE POLICY "Store owners can view inquiry interactions"
ON inquiry_interactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM inquiries
    JOIN stores ON stores.id = inquiries.store_id
    WHERE inquiries.id = inquiry_interactions.inquiry_id
    AND stores.owner_id = auth.uid()
  )
);

-- Store owners can add interactions
CREATE POLICY "Store owners can add inquiry interactions"
ON inquiry_interactions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM inquiries
    JOIN stores ON stores.id = inquiries.store_id
    WHERE inquiries.id = inquiry_interactions.inquiry_id
    AND stores.owner_id = auth.uid()
  )
);

-- =====================================================
-- 7. Create function to update inquiry updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_inquiry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inquiries_updated_at
BEFORE UPDATE ON inquiries
FOR EACH ROW
EXECUTE FUNCTION update_inquiry_updated_at();

-- =====================================================
-- 8. Create analytics view for inquiries
-- =====================================================
CREATE OR REPLACE VIEW inquiry_analytics AS
SELECT 
  stores.id as store_id,
  stores.name as store_name,
  COUNT(DISTINCT inquiries.id) as total_inquiries,
  COUNT(DISTINCT CASE WHEN inquiries.status = 'new' THEN inquiries.id END) as new_leads,
  COUNT(DISTINCT CASE WHEN inquiries.status = 'contacted' THEN inquiries.id END) as contacted_leads,
  COUNT(DISTINCT CASE WHEN inquiries.status = 'converted' THEN inquiries.id END) as converted_leads,
  COUNT(DISTINCT CASE WHEN inquiries.status = 'lost' THEN inquiries.id END) as lost_leads,
  ROUND(
    (COUNT(DISTINCT CASE WHEN inquiries.status = 'converted' THEN inquiries.id END)::NUMERIC / 
     NULLIF(COUNT(DISTINCT inquiries.id), 0) * 100), 
    2
  ) as conversion_rate,
  SUM(inquiries.conversion_value) as total_conversion_value,
  AVG(EXTRACT(EPOCH FROM (inquiries.converted_at - inquiries.created_at)) / 86400) as avg_days_to_convert
FROM stores
LEFT JOIN inquiries ON stores.id = inquiries.store_id
GROUP BY stores.id, stores.name;

-- Grant access to view
GRANT SELECT ON inquiry_analytics TO authenticated;

-- =====================================================
-- 9. Create function to get inquiry timeline
-- =====================================================
CREATE OR REPLACE FUNCTION get_inquiry_timeline(inquiry_uuid UUID)
RETURNS TABLE (
  id UUID,
  interaction_type TEXT,
  notes TEXT,
  previous_status TEXT,
  new_status TEXT,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    inquiry_interactions.id,
    inquiry_interactions.interaction_type,
    inquiry_interactions.notes,
    inquiry_interactions.previous_status,
    inquiry_interactions.new_status,
    inquiry_interactions.created_at
  FROM inquiry_interactions
  WHERE inquiry_interactions.inquiry_id = inquiry_uuid
  ORDER BY inquiry_interactions.created_at DESC;
END;
$$;

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: Added inquiry/lead system';
  RAISE NOTICE '   - Added store_mode to stores (order/inquiry/hybrid)';
  RAISE NOTICE '   - Added interaction_type to products (buy_now/inquiry)';
  RAISE NOTICE '   - Created inquiries table with lead tracking';
  RAISE NOTICE '   - Created inquiry_interactions table for timeline';
  RAISE NOTICE '   - Created inquiry_analytics view';
  RAISE NOTICE '   - Added RLS policies for secure access';
END $$;
