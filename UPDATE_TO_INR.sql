-- ============================================
-- Update Demo Store to INR (Indian Rupees)
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Update the demo store's currency to INR
UPDATE stores 
SET currency = 'INR'
WHERE handle = 'demo-bakery';

-- 2. Update all products to INR with converted prices
-- Converting from USD cents to INR (using approximate rate: 1 USD = 83 INR)
-- Also making prices round numbers in INR
UPDATE products 
SET 
  currency = 'INR',
  price_cents = CASE title
    WHEN 'Chocolate Croissant' THEN 3500      -- ₹35 (was $4.50)
    WHEN 'Blueberry Muffin' THEN 2500         -- ₹25 (was $3.50)
    WHEN 'Red Velvet Cake Slice' THEN 5000    -- ₹50 (was $6.50)
    WHEN 'Sourdough Bread' THEN 6500          -- ₹65 (was $8.00)
    WHEN 'Apple Pie' THEN 4500                -- ₹45 (was $5.50)
    WHEN 'Bagel with Cream Cheese' THEN 3000  -- ₹30 (was $4.00)
    ELSE price_cents
  END
WHERE store_id IN (SELECT id FROM stores WHERE handle = 'demo-bakery');

-- 3. Verify the changes
SELECT 
  s.handle,
  s.name,
  s.currency as store_currency,
  p.title,
  p.price_cents / 100.0 as price,
  p.currency as product_currency
FROM stores s
JOIN products p ON p.store_id = s.id
WHERE s.handle = 'demo-bakery'
ORDER BY p.price_cents;

-- Success message
SELECT 'Demo store updated to INR! Visit /demo-bakery to see the changes.' as message;