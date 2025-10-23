-- ============================================
-- Simple Update to INR - Run this NOW
-- ============================================

-- Update demo store to INR
UPDATE stores 
SET currency = 'INR'
WHERE handle = 'demo-bakery';

-- Update all products to INR with Indian pricing
UPDATE products 
SET 
  currency = 'INR',
  price_cents = CASE title
    WHEN 'Chocolate Croissant' THEN 3500      -- ₹35
    WHEN 'Blueberry Muffin' THEN 2500         -- ₹25
    WHEN 'Red Velvet Cake Slice' THEN 5000    -- ₹50
    WHEN 'Sourdough Bread' THEN 6500          -- ₹65
    WHEN 'Apple Pie' THEN 4500                -- ₹45
    WHEN 'Bagel with Cream Cheese' THEN 3000  -- ₹30
    ELSE price_cents
  END
WHERE store_id = (SELECT id FROM stores WHERE handle = 'demo-bakery');

-- Verify the update
SELECT 'Updated to INR!' as status, COUNT(*) as products_updated 
FROM products 
WHERE currency = 'INR' 
  AND store_id = (SELECT id FROM stores WHERE handle = 'demo-bakery');