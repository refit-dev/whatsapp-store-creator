-- Run this SQL to enable video-only products feature
-- This migration adds video_url column to products table

-- Add video_url column
ALTER TABLE products
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add comment
COMMENT ON COLUMN products.video_url IS 'Optional video URL (YouTube, Vimeo, or direct link) to showcase the product';

-- Make image_urls column nullable (if not already)
ALTER TABLE products 
ALTER COLUMN image_urls DROP NOT NULL;

-- Verify changes
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('image_urls', 'video_url')
ORDER BY column_name;

-- Test: Query to show products with and without images
SELECT 
  id,
  title,
  CASE 
    WHEN image_urls IS NULL OR jsonb_array_length(image_urls) = 0 THEN '📦 No Image'
    ELSE '🖼️ Has Image(s)'
  END as image_status,
  CASE 
    WHEN video_url IS NOT NULL THEN '🎥 Has Video'
    ELSE '❌ No Video'
  END as video_status,
  created_at
FROM products
ORDER BY created_at DESC
LIMIT 10;
