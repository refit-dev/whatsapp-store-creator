-- Image Moderation System Migration
-- Allows admins to review uploaded images and block stores with inappropriate content

-- Add is_blocked column to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS block_reason TEXT;

-- Create image_reviews table to track all product images
CREATE TABLE IF NOT EXISTS image_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'flagged')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  flag_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_image_reviews_status ON image_reviews(review_status);
CREATE INDEX IF NOT EXISTS idx_image_reviews_store_id ON image_reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_image_reviews_product_id ON image_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_stores_is_blocked ON stores(is_blocked);

-- Enable RLS on image_reviews
ALTER TABLE image_reviews ENABLE ROW LEVEL SECURITY;

-- Admins can view all image reviews
CREATE POLICY "Admins can view all image reviews"
  ON image_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- Admins can update image reviews
CREATE POLICY "Admins can update image reviews"
  ON image_reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- Admins can insert image reviews
CREATE POLICY "Admins can insert image reviews"
  ON image_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- Store owners can view their own store's image reviews
CREATE POLICY "Store owners can view their image reviews"
  ON image_reviews FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- Function to automatically create image review records when products are created/updated
CREATE OR REPLACE FUNCTION create_image_reviews()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if image_urls changed or new product
  IF (TG_OP = 'INSERT' OR NEW.image_urls IS DISTINCT FROM OLD.image_urls) THEN
    -- Delete old reviews for this product if updating
    IF TG_OP = 'UPDATE' THEN
      DELETE FROM image_reviews WHERE product_id = NEW.id;
    END IF;
    
    -- Create review record for each image (handle JSONB array)
    IF NEW.image_urls IS NOT NULL AND jsonb_array_length(NEW.image_urls) > 0 THEN
      INSERT INTO image_reviews (product_id, store_id, image_url, review_status)
      SELECT 
        NEW.id,
        NEW.store_id,
        jsonb_array_elements_text(NEW.image_urls),
        'pending';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically track new images
DROP TRIGGER IF EXISTS trigger_create_image_reviews ON products;
CREATE TRIGGER trigger_create_image_reviews
  AFTER INSERT OR UPDATE OF image_urls ON products
  FOR EACH ROW
  EXECUTE FUNCTION create_image_reviews();

-- Backfill existing product images into image_reviews (one-time)
INSERT INTO image_reviews (product_id, store_id, image_url, review_status)
SELECT 
  p.id,
  p.store_id,
  jsonb_array_elements_text(p.image_urls) as image_url,
  'approved' as review_status  -- Mark existing images as approved
FROM products p
WHERE p.image_urls IS NOT NULL
  AND jsonb_array_length(p.image_urls) > 0
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE image_reviews IS 'Tracks all product images for admin moderation';
COMMENT ON COLUMN stores.is_blocked IS 'Whether store is blocked due to policy violations';
COMMENT ON COLUMN stores.block_reason IS 'Reason provided when store was blocked';
COMMENT ON COLUMN image_reviews.review_status IS 'Status: pending (default), approved, or flagged';
COMMENT ON COLUMN image_reviews.flag_reason IS 'Reason image was flagged by admin';
