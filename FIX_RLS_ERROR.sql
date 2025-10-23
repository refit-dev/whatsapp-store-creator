-- ============================================
-- Fix Row Level Security Error for Store Creation
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (new.id, new.email, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- 2. Create trigger to automatically add users when they sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Also add any existing auth users to the users table
INSERT INTO public.users (id, email, created_at)
SELECT id, email, created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 4. Update RLS policies for stores to be more flexible
DROP POLICY IF EXISTS "Store owners can manage their stores" ON stores;
CREATE POLICY "Store owners can manage their stores" ON stores
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- 5. Allow authenticated users to insert stores they own
DROP POLICY IF EXISTS "Users can create their own stores" ON stores;
CREATE POLICY "Users can create their own stores" ON stores
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- 6. Allow authenticated users to view their own stores
DROP POLICY IF EXISTS "Users can view their own stores" ON stores;
CREATE POLICY "Users can view their own stores" ON stores
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- 7. Allow authenticated users to update their own stores
DROP POLICY IF EXISTS "Users can update their own stores" ON stores;
CREATE POLICY "Users can update their own stores" ON stores
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- 8. Update products RLS to use owner_id directly
DROP POLICY IF EXISTS "Store owners can manage products" ON products;
CREATE POLICY "Store owners can manage products" ON products
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = products.store_id 
      AND stores.owner_id = auth.uid()
    )
  );

-- 9. Update orders RLS for better access
DROP POLICY IF EXISTS "Store owners can view orders" ON orders;
CREATE POLICY "Store owners can view orders" ON orders
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = orders.store_id 
      AND stores.owner_id = auth.uid()
    )
  );

-- 10. Ensure store_members table has proper policies
DROP POLICY IF EXISTS "Owners can manage store members" ON store_members;
CREATE POLICY "Owners can manage store members" ON store_members
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = store_members.store_id 
      AND stores.owner_id = auth.uid()
    )
  );

-- Success message
SELECT 'RLS policies updated successfully! Users can now create and manage their stores.' as message;