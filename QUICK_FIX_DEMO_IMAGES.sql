-- Quick Fix: Update demo store products with working image URLs
-- This uses placeholder images that will definitely work

-- Get demo-bakery store ID
DO $$
DECLARE
  v_store_id UUID;
  v_product_id UUID;
BEGIN
  -- Get store ID
  SELECT id INTO v_store_id FROM stores WHERE handle = 'demo-bakery';
  
  IF v_store_id IS NULL THEN
    RAISE NOTICE 'Demo store not found!';
    RETURN;
  END IF;

  RAISE NOTICE 'Found demo store: %', v_store_id;

  -- Update store logo and banner
  UPDATE stores
  SET 
    logo_url = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
    banner_url = 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=1200&q=80'
  WHERE id = v_store_id;
  
  RAISE NOTICE 'Updated store logo and banner';

  -- Update Blueberry Muffin
  UPDATE products
  SET image_urls = '["https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=800&q=80"]'::jsonb
  WHERE id = (
    SELECT id FROM products 
    WHERE store_id = v_store_id 
    AND title = 'Blueberry Muffin'
    LIMIT 1
  )
  RETURNING id INTO v_product_id;
  
  RAISE NOTICE 'Updated Blueberry Muffin: %', v_product_id;

  -- Update Chocolate Croissant
  UPDATE products
  SET image_urls = '["https://images.unsplash.com/photo-1623334044303-241021148842?w=800&q=80", "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80"]'::jsonb
  WHERE id = (
    SELECT id FROM products 
    WHERE store_id = v_store_id 
    AND title = 'Chocolate Croissant'
    LIMIT 1
  )
  RETURNING id INTO v_product_id;
  
  RAISE NOTICE 'Updated Chocolate Croissant: %', v_product_id;

  -- Update Sourdough Bread  
  UPDATE products
  SET image_urls = '["https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800&q=80", "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80"]'::jsonb
  WHERE id = (
    SELECT id FROM products 
    WHERE store_id = v_store_id 
    AND title = 'Sourdough Bread'
    LIMIT 1
  )
  RETURNING id INTO v_product_id;
  
  RAISE NOTICE 'Updated Sourdough Bread: %', v_product_id;

  -- Update Apple Pie
  UPDATE products
  SET image_urls = '["https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=800&q=80"]'::jsonb
  WHERE id = (
    SELECT id FROM products 
    WHERE store_id = v_store_id 
    AND title = 'Apple Pie'
    LIMIT 1
  )
  RETURNING id INTO v_product_id;
  
  RAISE NOTICE 'Updated Apple Pie: %', v_product_id;

  -- Update Bagel with Cream Cheese
  UPDATE products
  SET image_urls = '["https://images.unsplash.com/photo-1551106652-a5bcf4b29ab6?w=800&q=80"]'::jsonb
  WHERE id = (
    SELECT id FROM products 
    WHERE store_id = v_store_id 
    AND title = 'Bagel with Cream Cheese'
    LIMIT 1
  )
  RETURNING id INTO v_product_id;
  
  RAISE NOTICE 'Updated Bagel with Cream Cheese: %', v_product_id;

  -- Update Red Velvet Cake Slice
  UPDATE products
  SET image_urls = '["https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800&q=80"]'::jsonb
  WHERE id = (
    SELECT id FROM products 
    WHERE store_id = v_store_id 
    AND title = 'Red Velvet Cake Slice'
    LIMIT 1
  )
  RETURNING id INTO v_product_id;
  
  RAISE NOTICE 'Updated Red Velvet Cake Slice: %', v_product_id;

  RAISE NOTICE 'All products updated successfully!';
END $$;

-- Verify the updates
SELECT 
  p.title,
  CASE 
    WHEN p.image_urls IS NOT NULL AND jsonb_array_length(p.image_urls) > 0 
    THEN '✓ HAS IMAGES (' || jsonb_array_length(p.image_urls) || ')'
    ELSE '✗ NO IMAGES'
  END as status,
  p.image_urls->0 as first_image
FROM products p
JOIN stores s ON s.id = p.store_id
WHERE s.handle = 'demo-bakery'
ORDER BY p.created_at;
