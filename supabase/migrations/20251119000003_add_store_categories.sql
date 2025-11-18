-- Store Categories System
-- Three-tier category hierarchy for better store discovery and organization
-- Categories → Sub-Categories → Product Types

-- =====================================================
-- 1. Create categories table
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT, -- Emoji or icon name
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 3), -- 1=primary, 2=sub, 3=product type
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. Create store_categories junction table
-- =====================================================
CREATE TABLE IF NOT EXISTS store_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  is_primary BOOLEAN DEFAULT false, -- One primary category per store
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, category_id) -- Prevent duplicate category assignments
);

-- =====================================================
-- 3. Create indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_level ON categories(level);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_store_categories_store_id ON store_categories(store_id);
CREATE INDEX IF NOT EXISTS idx_store_categories_category_id ON store_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_store_categories_primary ON store_categories(store_id, is_primary) WHERE is_primary = true;

-- =====================================================
-- 4. Enable RLS on tables
-- =====================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_categories ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. RLS Policies for categories
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

-- Everyone can view active categories
CREATE POLICY "Anyone can view active categories"
  ON categories FOR SELECT
  USING (is_active = true);

-- Admins can manage categories
CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- =====================================================
-- 6. RLS Policies for store_categories
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view store categories" ON store_categories;
DROP POLICY IF EXISTS "Store owners can add categories to their stores" ON store_categories;
DROP POLICY IF EXISTS "Store owners can remove categories from their stores" ON store_categories;
DROP POLICY IF EXISTS "Store owners can update their store categories" ON store_categories;
DROP POLICY IF EXISTS "Admins can manage all store categories" ON store_categories;

-- Everyone can view store categories
CREATE POLICY "Anyone can view store categories"
  ON store_categories FOR SELECT
  USING (true);

-- Store owners can insert their own store categories
CREATE POLICY "Store owners can add categories to their stores"
  ON store_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_categories.store_id
      AND stores.owner_id = auth.uid()
    )
  );

-- Store owners can delete their own store categories
CREATE POLICY "Store owners can remove categories from their stores"
  ON store_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_categories.store_id
      AND stores.owner_id = auth.uid()
    )
  );

-- Store owners can update their own store categories
CREATE POLICY "Store owners can update their store categories"
  ON store_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_categories.store_id
      AND stores.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_categories.store_id
      AND stores.owner_id = auth.uid()
    )
  );

-- Admins can manage all store categories
CREATE POLICY "Admins can manage all store categories"
  ON store_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- =====================================================
-- 7. Helper function to ensure only one primary category
-- =====================================================
DROP TRIGGER IF EXISTS ensure_single_primary_category_trigger ON store_categories;

CREATE OR REPLACE FUNCTION ensure_single_primary_category()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- If setting this as primary, unset other primaries for this store
  IF NEW.is_primary = true THEN
    UPDATE store_categories
    SET is_primary = false
    WHERE store_id = NEW.store_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_single_primary_category_trigger
  BEFORE INSERT OR UPDATE ON store_categories
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_category();

-- =====================================================
-- 8. Pre-populate primary categories (Level 1)
-- =====================================================
INSERT INTO categories (name, slug, description, icon, level, sort_order) VALUES
  -- E-commerce categories
  ('Fashion & Apparel', 'fashion-apparel', 'Clothing, footwear, and fashion accessories', '👗', 1, 1),
  ('Electronics & Gadgets', 'electronics-gadgets', 'Phones, laptops, and electronic devices', '📱', 1, 2),
  ('Home & Living', 'home-living', 'Furniture, decor, and home essentials', '🏠', 1, 3),
  ('Beauty & Personal Care', 'beauty-personal-care', 'Cosmetics, skincare, and wellness products', '💄', 1, 4),
  ('Food & Beverages', 'food-beverages', 'Restaurant, cafe, bakery, and food delivery', '🍔', 1, 5),
  ('Health & Fitness', 'health-fitness', 'Gym equipment, supplements, and wellness', '💪', 1, 6),
  ('Books & Stationery', 'books-stationery', 'Books, educational materials, and office supplies', '📚', 1, 7),
  ('Toys & Baby Products', 'toys-baby', 'Children toys, baby care, and kids essentials', '🧸', 1, 8),
  ('Sports & Outdoors', 'sports-outdoors', 'Sports equipment, outdoor gear, and adventure', '⚽', 1, 9),
  ('Automotive', 'automotive', 'Car accessories, parts, and vehicle services', '🚗', 1, 10),
  ('Jewelry & Accessories', 'jewelry-accessories', 'Jewelry, watches, and fashion accessories', '💍', 1, 11),
  ('Pet Supplies', 'pet-supplies', 'Pet food, toys, and animal care products', '🐕', 1, 12),
  ('Art & Crafts', 'art-crafts', 'Art supplies, handmade crafts, and DIY materials', '🎨', 1, 13),
  ('Services', 'services', 'Professional services and consultations', '🔧', 1, 14),
  ('Real Estate', 'real-estate', 'Property sales, rentals, and real estate services', '🏢', 1, 15),
  ('Other', 'other', 'Miscellaneous products and services', '📦', 1, 99)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 9. Pre-populate sub-categories (Level 2) - Fashion
-- =====================================================
INSERT INTO categories (name, slug, description, icon, parent_id, level, sort_order)
SELECT 
  name, slug, description, icon, 
  (SELECT id FROM categories WHERE slug = 'fashion-apparel'),
  2, sort_order
FROM (VALUES
  ('Men''s Clothing', 'mens-clothing', 'Shirts, pants, and men''s wear', '👔', 1),
  ('Women''s Clothing', 'womens-clothing', 'Dresses, tops, and women''s wear', '👚', 2),
  ('Kids Clothing', 'kids-clothing', 'Children''s and infant clothing', '👶', 3),
  ('Footwear', 'footwear', 'Shoes, sandals, and sneakers', '👟', 4),
  ('Accessories', 'fashion-accessories', 'Bags, belts, and fashion accessories', '👜', 5),
  ('Ethnic Wear', 'ethnic-wear', 'Traditional and cultural clothing', '🥻', 6)
) AS sub(name, slug, description, icon, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 10. Pre-populate sub-categories (Level 2) - Electronics
-- =====================================================
INSERT INTO categories (name, slug, description, icon, parent_id, level, sort_order)
SELECT 
  name, slug, description, icon, 
  (SELECT id FROM categories WHERE slug = 'electronics-gadgets'),
  2, sort_order
FROM (VALUES
  ('Mobile Phones', 'mobile-phones', 'Smartphones and feature phones', '📱', 1),
  ('Laptops & Computers', 'laptops-computers', 'Laptops, desktops, and accessories', '💻', 2),
  ('Audio & Video', 'audio-video', 'Headphones, speakers, and cameras', '🎧', 3),
  ('Smart Home', 'smart-home', 'Smart devices and home automation', '🏡', 4),
  ('Gaming', 'gaming', 'Gaming consoles and accessories', '🎮', 5)
) AS sub(name, slug, description, icon, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 11. Pre-populate sub-categories (Level 2) - Food
-- =====================================================
INSERT INTO categories (name, slug, description, icon, parent_id, level, sort_order)
SELECT 
  name, slug, description, icon, 
  (SELECT id FROM categories WHERE slug = 'food-beverages'),
  2, sort_order
FROM (VALUES
  ('Restaurant', 'restaurant', 'Dining and restaurant services', '🍽️', 1),
  ('Cafe & Bakery', 'cafe-bakery', 'Coffee shops and bakeries', '☕', 2),
  ('Fast Food', 'fast-food', 'Quick service and fast food', '🍕', 3),
  ('Catering', 'catering', 'Event catering and bulk orders', '🎉', 4),
  ('Groceries', 'groceries', 'Fresh produce and grocery items', '🛒', 5)
) AS sub(name, slug, description, icon, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 12. Pre-populate sub-categories (Level 2) - Services
-- =====================================================
INSERT INTO categories (name, slug, description, icon, parent_id, level, sort_order)
SELECT 
  name, slug, description, icon, 
  (SELECT id FROM categories WHERE slug = 'services'),
  2, sort_order
FROM (VALUES
  ('Repair & Maintenance', 'repair-maintenance', 'Repair and maintenance services', '🔧', 1),
  ('Cleaning Services', 'cleaning-services', 'Home and office cleaning', '🧹', 2),
  ('Education & Training', 'education-training', 'Tutoring and skill training', '📖', 3),
  ('Photography', 'photography', 'Photo and video services', '📸', 4),
  ('Consultation', 'consultation', 'Professional consulting services', '💼', 5)
) AS sub(name, slug, description, icon, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 13. Comments for documentation
-- =====================================================
COMMENT ON TABLE categories IS 'Hierarchical category system for stores (Level 1-3)';
COMMENT ON TABLE store_categories IS 'Junction table linking stores to multiple categories';
COMMENT ON COLUMN categories.level IS '1=Primary, 2=Sub-category, 3=Product type';
COMMENT ON COLUMN categories.parent_id IS 'References parent category for hierarchy';
COMMENT ON COLUMN store_categories.is_primary IS 'One primary category per store for main classification';
COMMENT ON FUNCTION ensure_single_primary_category() IS 'Ensures only one primary category per store';
