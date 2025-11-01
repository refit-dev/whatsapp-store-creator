-- SQL script to fix broken product images in demo-bakery store
-- Run this in your Supabase SQL Editor

-- Fix Sourdough Loaf image
UPDATE products 
SET image_urls = '["https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80"]'::jsonb
WHERE store_id = (SELECT id FROM stores WHERE handle = 'demo-bakery')
  AND title = 'Sourdough Loaf'
  AND image_urls @> '["/icons/icon-192.png"]';

-- Fix Chocolate Croissant image  
UPDATE products 
SET image_urls = '["https://images.unsplash.com/photo-1623334044303-241021148842?w=500&auto=format&fit=crop&q=80"]'::jsonb
WHERE store_id = (SELECT id FROM stores WHERE handle = 'demo-bakery')
  AND title = 'Chocolate Croissant'
  AND image_urls @> '["/icons/icon-192.png"]';

-- Fix Bagel with Cream Cheese image
UPDATE products 
SET image_urls = '["https://images.unsplash.com/photo-1551218808-94e220e084d2?w=500&auto=format&fit=crop&q=80"]'::jsonb
WHERE store_id = (SELECT id FROM stores WHERE handle = 'demo-bakery')
  AND title = 'Bagel with Cream Cheese';

-- Verify the updates
SELECT title, image_urls 
FROM products 
WHERE store_id = (SELECT id FROM stores WHERE handle = 'demo-bakery')
ORDER BY title;