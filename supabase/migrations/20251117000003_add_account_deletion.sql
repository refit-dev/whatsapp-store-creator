-- Account Deletion System
-- This migration adds functionality to allow users to delete their account
-- and all associated data (GDPR compliance)

-- =====================================================
-- 1. Create account_deletion_logs table
-- =====================================================
CREATE TABLE IF NOT EXISTS account_deletion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stores_deleted INTEGER DEFAULT 0,
  products_deleted INTEGER DEFAULT 0,
  orders_deleted INTEGER DEFAULT 0,
  images_deleted INTEGER DEFAULT 0,
  deletion_reason TEXT,
  ip_address TEXT,
  user_agent TEXT
);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_account_deletion_logs_deleted_at 
  ON account_deletion_logs(deleted_at);

-- =====================================================
-- 2. Create function to delete user and all data
-- =====================================================
CREATE OR REPLACE FUNCTION delete_user_account(
  p_user_id UUID,
  p_deletion_reason TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email TEXT;
  v_stores_count INTEGER := 0;
  v_products_count INTEGER := 0;
  v_orders_count INTEGER := 0;
  v_images_count INTEGER := 0;
  v_store_ids UUID[];
BEGIN
  -- Get user email before deletion
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Get all store IDs for this user
  SELECT ARRAY_AGG(id) INTO v_store_ids
  FROM stores
  WHERE owner_id = p_user_id;

  -- Count data before deletion
  SELECT COUNT(*) INTO v_stores_count
  FROM stores
  WHERE owner_id = p_user_id;

  SELECT COUNT(*) INTO v_products_count
  FROM products
  WHERE store_id = ANY(v_store_ids);

  SELECT COUNT(*) INTO v_orders_count
  FROM orders
  WHERE store_id = ANY(v_store_ids);

  -- Delete user-owned data (cascading deletes)
  
  -- 1. Delete virus scans (if any exist for user's uploads)
  DELETE FROM virus_scans
  WHERE user_id = p_user_id;

  -- 2. Delete API rate limiting records
  DELETE FROM api_requests
  WHERE user_id = p_user_id;

  -- 3. Delete login attempts
  DELETE FROM login_attempts
  WHERE user_id = p_user_id;

  -- 4. Delete image reviews for user's products
  DELETE FROM image_reviews
  WHERE store_id = ANY(v_store_ids);

  -- 5. Delete WhatsApp verifications
  DELETE FROM whatsapp_verifications
  WHERE store_id = ANY(v_store_ids);

  -- 6. Delete orders (must delete before products due to foreign keys)
  DELETE FROM orders
  WHERE store_id = ANY(v_store_ids);

  -- 7. Delete products
  DELETE FROM products
  WHERE store_id = ANY(v_store_ids);

  -- 8. Delete stores
  DELETE FROM stores
  WHERE owner_id = p_user_id;

  -- 9. Log the deletion
  INSERT INTO account_deletion_logs (
    user_id,
    email,
    stores_deleted,
    products_deleted,
    orders_deleted,
    deletion_reason
  ) VALUES (
    p_user_id,
    v_user_email,
    v_stores_count,
    v_products_count,
    v_orders_count,
    p_deletion_reason
  );

  -- 10. Delete the user from auth.users (final step)
  -- This uses Supabase's admin API, handled in the application layer
  -- The auth.users deletion should be done via API after this function

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'email', v_user_email,
    'stores_deleted', v_stores_count,
    'products_deleted', v_products_count,
    'orders_deleted', v_orders_count,
    'images_deleted', v_images_count
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error deleting user account: %', SQLERRM;
END;
$$;

-- =====================================================
-- 3. Create RLS policies for account_deletion_logs
-- =====================================================

-- Enable RLS
ALTER TABLE account_deletion_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view deletion logs
DROP POLICY IF EXISTS "Admins can view deletion logs" ON account_deletion_logs;
CREATE POLICY "Admins can view deletion logs"
  ON account_deletion_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- =====================================================
-- 4. Create view for deletion analytics (admins only)
-- =====================================================
CREATE OR REPLACE VIEW account_deletion_stats AS
SELECT
  DATE_TRUNC('day', deleted_at) AS deletion_date,
  COUNT(*) AS accounts_deleted,
  SUM(stores_deleted) AS total_stores_deleted,
  SUM(products_deleted) AS total_products_deleted,
  SUM(orders_deleted) AS total_orders_deleted,
  ARRAY_AGG(DISTINCT deletion_reason) FILTER (WHERE deletion_reason IS NOT NULL) AS reasons
FROM account_deletion_logs
GROUP BY DATE_TRUNC('day', deleted_at)
ORDER BY deletion_date DESC;

-- Grant access to authenticated users (RLS will filter)
GRANT SELECT ON account_deletion_stats TO authenticated;

-- =====================================================
-- 5. Create function to get deletion preview
-- =====================================================
CREATE OR REPLACE FUNCTION get_account_deletion_preview(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stores_count INTEGER := 0;
  v_products_count INTEGER := 0;
  v_orders_count INTEGER := 0;
  v_active_subscriptions INTEGER := 0;
  v_store_ids UUID[];
BEGIN
  -- Verify user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Get all store IDs
  SELECT ARRAY_AGG(id) INTO v_store_ids
  FROM stores
  WHERE owner_id = p_user_id;

  -- Count data
  SELECT COUNT(*) INTO v_stores_count
  FROM stores
  WHERE owner_id = p_user_id;

  SELECT COUNT(*) INTO v_products_count
  FROM products
  WHERE store_id = ANY(v_store_ids);

  SELECT COUNT(*) INTO v_orders_count
  FROM orders
  WHERE store_id = ANY(v_store_ids);

  SELECT COUNT(*) INTO v_active_subscriptions
  FROM stores
  WHERE owner_id = p_user_id
  AND subscription_status = 'active';

  RETURN jsonb_build_object(
    'stores_count', v_stores_count,
    'products_count', v_products_count,
    'orders_count', v_orders_count,
    'active_subscriptions', v_active_subscriptions,
    'has_active_subscription', v_active_subscriptions > 0
  );
END;
$$;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE account_deletion_logs IS 'Logs all account deletions for audit and analytics';
COMMENT ON FUNCTION delete_user_account IS 'Deletes user account and all associated data (GDPR compliance)';
COMMENT ON FUNCTION get_account_deletion_preview IS 'Returns preview of data that will be deleted';
COMMENT ON VIEW account_deletion_stats IS 'Analytics view for account deletions (admin only)';
