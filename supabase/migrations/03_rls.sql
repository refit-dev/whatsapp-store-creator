-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_members ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own data
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Stores policies
DROP POLICY IF EXISTS "Public can view basic store info" ON stores;
CREATE POLICY "Public can view basic store info" ON stores
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Store members can view full store details" ON stores;
CREATE POLICY "Store members can view full store details" ON stores
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM store_members 
    WHERE store_id = id 
    AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Store owner can manage store" ON stores;
CREATE POLICY "Store owner can manage store" ON stores
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM store_members 
    WHERE store_id = id 
    AND user_id = auth.uid() 
    AND role = 'owner'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM store_members 
    WHERE store_id = id 
    AND user_id = auth.uid() 
    AND role = 'owner'
  ));

-- Products policies
DROP POLICY IF EXISTS "Public can view active products" ON products;
CREATE POLICY "Public can view active products" ON products
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Store members can manage products" ON products;
CREATE POLICY "Store members can manage products" ON products
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM store_members 
    WHERE store_id = products.store_id 
    AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM store_members 
    WHERE store_id = products.store_id 
    AND user_id = auth.uid()
  ));

-- Orders policies
DROP POLICY IF EXISTS "Store members can view orders" ON orders;
CREATE POLICY "Store members can view orders" ON orders
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM store_members 
    WHERE store_id = orders.store_id 
    AND user_id = auth.uid()
  ));

-- Only service role can create orders (from API)
DROP POLICY IF EXISTS "Service role can create orders" ON orders;
CREATE POLICY "Service role can create orders" ON orders
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Store members policies
DROP POLICY IF EXISTS "Store owners can manage members" ON store_members;
CREATE POLICY "Store owners can manage members" ON store_members
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM store_members sm2
    WHERE sm2.store_id = store_members.store_id
    AND sm2.user_id = auth.uid()
    AND sm2.role = 'owner'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM store_members sm2
    WHERE sm2.store_id = store_members.store_id
    AND sm2.user_id = auth.uid()
    AND sm2.role = 'owner'
  ));