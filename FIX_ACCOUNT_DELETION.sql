-- Fix account deletion functions to work without errors
-- Run this in Supabase SQL Editor after running COMPLETE_ONBOARDING_FIX.sql

-- ============================================================================
-- 1. Create/Update get_account_deletion_preview function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_account_deletion_preview(target_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stores_count INTEGER := 0;
  v_products_count INTEGER := 0;
  v_orders_count INTEGER := 0;
  v_active_subscriptions INTEGER := 0;
  v_store_ids UUID[];
BEGIN
  -- Verify user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Get all store IDs
  SELECT COALESCE(ARRAY_AGG(id), ARRAY[]::UUID[]) INTO v_store_ids
  FROM stores
  WHERE owner_id = target_user_id;

  -- Count stores
  SELECT COUNT(*) INTO v_stores_count
  FROM stores
  WHERE owner_id = target_user_id;

  -- Count products
  IF array_length(v_store_ids, 1) > 0 THEN
    SELECT COUNT(*) INTO v_products_count
    FROM products
    WHERE store_id = ANY(v_store_ids);

    SELECT COUNT(*) INTO v_orders_count
    FROM orders
    WHERE store_id = ANY(v_store_ids);
    
    -- Count active subscriptions (if user_subscriptions table exists)
    BEGIN
      SELECT COUNT(*) INTO v_active_subscriptions
      FROM user_subscriptions
      WHERE user_id = target_user_id
      AND status = 'active'
      AND ends_at > NOW();
    EXCEPTION WHEN undefined_table THEN
      v_active_subscriptions := 0;
    END;
  END IF;

  RETURN jsonb_build_object(
    'stores_count', v_stores_count,
    'products_count', v_products_count,
    'orders_count', v_orders_count,
    'active_subscriptions', v_active_subscriptions,
    'has_active_subscription', v_active_subscriptions > 0
  );
END;
$$;

-- ============================================================================
-- 2. Create/Update delete_user_account function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_user_account(
  target_user_id UUID,
  deletion_reason TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, storage
AS $$
DECLARE
  v_user_email TEXT;
  v_stores_count INTEGER := 0;
  v_products_count INTEGER := 0;
  v_orders_count INTEGER := 0;
  v_store_ids UUID[];
BEGIN
  -- Get user email before deletion
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = target_user_id;

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Get all store IDs
  SELECT COALESCE(ARRAY_AGG(id), ARRAY[]::UUID[]) INTO v_store_ids
  FROM stores
  WHERE owner_id = target_user_id;

  -- Count before deletion
  SELECT COUNT(*) INTO v_stores_count FROM stores WHERE owner_id = target_user_id;
  
  IF array_length(v_store_ids, 1) > 0 THEN
    SELECT COUNT(*) INTO v_products_count FROM products WHERE store_id = ANY(v_store_ids);
    SELECT COUNT(*) INTO v_orders_count FROM orders WHERE store_id = ANY(v_store_ids);
  END IF;

  -- Delete in correct order (respecting foreign keys)
  
  -- Delete order items first (if table exists)
  BEGIN
    DELETE FROM order_items WHERE order_id IN (
      SELECT id FROM orders WHERE store_id = ANY(v_store_ids)
    );
  EXCEPTION WHEN undefined_table OR undefined_column THEN
    NULL; -- Table or column doesn't exist, skip
  END;
  
  -- Delete orders
  BEGIN
    DELETE FROM orders WHERE store_id = ANY(v_store_ids);
  EXCEPTION WHEN undefined_column THEN
    NULL;
  END;
  
  -- Delete products
  BEGIN
    DELETE FROM products WHERE store_id = ANY(v_store_ids);
  EXCEPTION WHEN undefined_column THEN
    NULL;
  END;
  
  -- Delete image reviews (if table exists)
  BEGIN
    DELETE FROM image_reviews WHERE store_id = ANY(v_store_ids);
  EXCEPTION WHEN undefined_table OR undefined_column THEN
    NULL;
  END;
  
  -- Delete WhatsApp verifications (if table exists)
  BEGIN
    DELETE FROM whatsapp_verifications WHERE store_id = ANY(v_store_ids);
  EXCEPTION WHEN undefined_table OR undefined_column THEN
    NULL;
  END;
  
  -- Delete stores
  BEGIN
    DELETE FROM stores WHERE owner_id = target_user_id;
  EXCEPTION WHEN undefined_column THEN
    NULL;
  END;
  
  -- Delete user subscriptions (if table exists)
  BEGIN
    DELETE FROM user_subscriptions WHERE user_id = target_user_id;
  EXCEPTION WHEN undefined_table OR undefined_column THEN
    NULL;
  END;
  
  -- Delete referrals (if table exists)
  BEGIN
    DELETE FROM referrals WHERE user_id = target_user_id OR referred_user_id = target_user_id;
  EXCEPTION WHEN undefined_table OR undefined_column THEN
    NULL;
  END;
  
  -- Delete login attempts (if table exists)
  BEGIN
    DELETE FROM login_attempts WHERE user_id = target_user_id;
  EXCEPTION WHEN undefined_table OR undefined_column THEN
    NULL;
  END;
  
  -- Delete profile (if table exists)
  BEGIN
    DELETE FROM profiles WHERE id = target_user_id;
  EXCEPTION WHEN undefined_table OR undefined_column THEN
    NULL;
  END;
  
  -- Log the deletion
  INSERT INTO account_deletion_logs (
    user_id,
    email,
    deletion_reason,
    stores_deleted,
    products_deleted,
    orders_deleted
  ) VALUES (
    target_user_id,
    v_user_email,
    deletion_reason,
    v_stores_count,
    v_products_count,
    v_orders_count
  );
  
  -- Note: auth.users deletion should be handled by the application
  -- using the admin API, not here
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'email', v_user_email,
    'stores_deleted', v_stores_count,
    'products_deleted', v_products_count,
    'orders_deleted', v_orders_count
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error deleting user account: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- ============================================================================
-- 3. Add comments
-- ============================================================================

COMMENT ON FUNCTION public.get_account_deletion_preview(UUID) IS 'Returns preview of data that will be deleted for a user account';
COMMENT ON FUNCTION public.delete_user_account(UUID, TEXT) IS 'Deletes all user data except auth.users (GDPR compliance)';
