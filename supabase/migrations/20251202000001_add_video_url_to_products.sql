-- Add video_url column to products table
-- This allows store owners to add video links to their products

-- 1. Add video_url column
ALTER TABLE products
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 2. Add comment
COMMENT ON COLUMN products.video_url IS 'Optional video URL (YouTube, Vimeo, or direct link) to showcase the product';

-- 3. Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name = 'video_url';

-- 4. Test: Update a product with video URL (optional)
-- UPDATE products
-- SET video_url = 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID'
-- WHERE id = 'your-product-id';
