-- Fix Function Search Path Mutable Warnings
-- Sets explicit search_path for all functions to prevent security issues
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- Drop all functions first to avoid signature conflicts
-- Using CASCADE to drop dependent triggers automatically
DROP FUNCTION IF EXISTS is_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_login_attempts() CASCADE;
DROP FUNCTION IF EXISTS give_free_trial(uuid) CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_api_requests() CASCADE;
DROP FUNCTION IF EXISTS get_request_count(UUID, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_virus_scans() CASCADE;
DROP FUNCTION IF EXISTS generate_referral_code() CASCADE;
DROP FUNCTION IF EXISTS create_user_referral_code() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_verification_codes() CASCADE;
DROP FUNCTION IF EXISTS is_verification_rate_limited(TEXT) CASCADE;
DROP FUNCTION IF EXISTS record_verification_attempt(TEXT, TEXT, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS set_secure_storage_headers() CASCADE;
DROP FUNCTION IF EXISTS check_storage_security() CASCADE;
DROP FUNCTION IF EXISTS extend_subscription(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS delete_user_account(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS auto_assign_trial() CASCADE;
DROP FUNCTION IF EXISTS process_referral_reward(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_account_deletion_preview(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_image_reviews() CASCADE;

-- =====================================================
-- 1. is_admin function
-- =====================================================
-- From: 20251116000001_add_store_approval_system.sql
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = is_admin.user_id
  );
END;
$$;

-- =====================================================
-- 2. cleanup_old_login_attempts function
-- =====================================================
-- From: 20251116000003_add_login_attempts.sql
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM login_attempts
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- =====================================================
-- 3. give_free_trial function
-- =====================================================
-- From: 20251112000001_update_trial_period_to_14_days.sql
CREATE OR REPLACE FUNCTION give_free_trial(user_uuid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  subscription_id uuid;
  trial_plan_id uuid;
BEGIN
  -- Get the trial plan ID (assuming there's a plan with name 'trial')
  SELECT id INTO trial_plan_id
  FROM subscription_plans
  WHERE name = 'trial' OR is_trial = true
  LIMIT 1;

  -- If no trial plan exists, use a default UUID or create one
  IF trial_plan_id IS NULL THEN
    -- Create a basic trial plan if it doesn't exist
    INSERT INTO subscription_plans (name, price, currency, interval_type, is_trial)
    VALUES ('trial', 0, 'INR', 'month', true)
    RETURNING id INTO trial_plan_id;
  END IF;

  -- Check if user already has an active subscription (including trial)
  IF EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = user_uuid
    AND status = 'active'
    AND ends_at > NOW()
  ) THEN
    -- Return the existing subscription ID
    SELECT id INTO subscription_id
    FROM user_subscriptions
    WHERE user_id = user_uuid
    AND status = 'active'
    AND ends_at > NOW()
    LIMIT 1;
    
    RETURN subscription_id;
  END IF;

  -- Create new trial subscription with 14-day duration
  INSERT INTO user_subscriptions (
    user_id,
    plan_id,
    starts_at,
    ends_at,
    status,
    is_trial,
    payment_provider,
    payment_id
  )
  VALUES (
    user_uuid,
    trial_plan_id,
    NOW(),
    NOW() + INTERVAL '14 days',
    'active',
    true,
    NULL,
    NULL
  )
  RETURNING id INTO subscription_id;

  RETURN subscription_id;
END;
$$;

-- =====================================================
-- 4. cleanup_old_api_requests function
-- =====================================================
-- From: 20251116000004_add_api_rate_limiting.sql
CREATE OR REPLACE FUNCTION cleanup_old_api_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM api_requests
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- =====================================================
-- 5. get_request_count function
-- =====================================================
-- From: 20251116000004_add_api_rate_limiting.sql
CREATE OR REPLACE FUNCTION get_request_count(
  p_user_id UUID,
  p_endpoint TEXT,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO request_count
  FROM api_requests
  WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  RETURN COALESCE(request_count, 0);
END;
$$;

-- =====================================================
-- 6. cleanup_old_virus_scans function
-- =====================================================
-- From: 20251117000001_add_virus_scanning.sql
CREATE OR REPLACE FUNCTION cleanup_old_virus_scans()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM virus_scans
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND infected = false;
END;
$$;

-- =====================================================
-- 7. generate_referral_code function
-- =====================================================
-- From: 20251112000002_update_referral_system_payment_based.sql
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM referrals WHERE referral_code = code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN code;
END;
$$;

-- =====================================================
-- 8. create_user_referral_code function
-- =====================================================
-- From: 20251112000002_update_referral_system_payment_based.sql
CREATE OR REPLACE FUNCTION create_user_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO referrals (user_id, referral_code)
  VALUES (NEW.id, generate_referral_code());
  RETURN NEW;
END;
$$;

-- =====================================================
-- 9. cleanup_expired_verification_codes function
-- =====================================================
-- From: 2025-11-02_add_whatsapp_verifications.sql
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM whatsapp_verifications
  WHERE expires_at < NOW()
    AND verified = false;
END;
$$;

-- =====================================================
-- 10. is_verification_rate_limited function
-- =====================================================
-- From: 2025-11-02_add_whatsapp_verifications.sql
CREATE OR REPLACE FUNCTION is_verification_rate_limited(phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO recent_count
  FROM whatsapp_verifications
  WHERE phone_number = phone
    AND created_at > NOW() - INTERVAL '1 hour';
  
  RETURN recent_count >= 3;
END;
$$;

-- =====================================================
-- 11. record_verification_attempt function
-- =====================================================
-- From: 2025-11-02_add_whatsapp_verifications.sql (if exists)
CREATE OR REPLACE FUNCTION record_verification_attempt(
  p_phone TEXT,
  p_code TEXT,
  p_success BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE whatsapp_verifications
  SET 
    attempts = attempts + 1,
    verified = CASE WHEN p_success THEN true ELSE verified END,
    verified_at = CASE WHEN p_success THEN NOW() ELSE verified_at END
  WHERE phone_number = p_phone
    AND code = p_code
    AND expires_at > NOW();
END;
$$;

-- =====================================================
-- 12. set_secure_storage_headers function
-- =====================================================
-- From: 20251117000002_add_file_execution_prevention.sql
CREATE OR REPLACE FUNCTION set_secure_storage_headers()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  -- Set security headers on storage objects
  NEW.metadata = jsonb_set(
    COALESCE(NEW.metadata, '{}'::jsonb),
    '{cacheControl}',
    '"public, max-age=3600"'::jsonb
  );
  
  NEW.metadata = jsonb_set(
    NEW.metadata,
    '{contentDisposition}',
    ('"attachment; filename=\"' || NEW.name || '\"\"')::jsonb
  );
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- 13. check_storage_security function
-- =====================================================
-- From: 20251117000002_add_file_execution_prevention.sql
CREATE OR REPLACE FUNCTION check_storage_security()
RETURNS TABLE(
  bucket_id TEXT,
  total_objects BIGINT,
  missing_security_headers BIGINT,
  executable_files BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.bucket_id::TEXT,
    COUNT(*)::BIGINT as total_objects,
    COUNT(*) FILTER (WHERE o.metadata->>'contentDisposition' IS NULL)::BIGINT as missing_security_headers,
    COUNT(*) FILTER (WHERE o.metadata->>'contentType' IN (
      'application/x-msdownload',
      'application/x-executable',
      'application/x-dosexec'
    ))::BIGINT as executable_files
  FROM storage.objects o
  GROUP BY o.bucket_id;
END;
$$;

-- =====================================================
-- 14. extend_subscription function
-- =====================================================
-- From: 20251112000002_update_referral_system_payment_based.sql
CREATE OR REPLACE FUNCTION extend_subscription(user_uuid uuid, days integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE subscriptions
  SET 
    end_date = GREATEST(
      COALESCE(end_date, NOW()),
      NOW()
    ) + (days || ' days')::INTERVAL,
    updated_at = NOW()
  WHERE user_id = user_uuid
    AND plan_type != 'trial';
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active subscription found for user';
  END IF;
END;
$$;

-- =====================================================
-- 15. delete_user_account function
-- =====================================================
-- From: 20251117000003_add_account_deletion.sql
CREATE OR REPLACE FUNCTION delete_user_account(
  target_user_id UUID,
  deletion_reason TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, storage
AS $$
DECLARE
  stores_count INTEGER;
  products_count INTEGER;
  orders_count INTEGER;
  result jsonb;
BEGIN
  -- Count items before deletion
  SELECT COUNT(*) INTO stores_count
  FROM stores WHERE owner_id = target_user_id;
  
  SELECT COUNT(*) INTO products_count
  FROM products WHERE store_id IN (
    SELECT id FROM stores WHERE owner_id = target_user_id
  );
  
  SELECT COUNT(*) INTO orders_count
  FROM orders WHERE store_id IN (
    SELECT id FROM stores WHERE owner_id = target_user_id
  );
  
  -- Log the deletion
  INSERT INTO account_deletion_logs (
    user_id,
    deletion_reason,
    stores_deleted,
    products_deleted,
    orders_deleted
  ) VALUES (
    target_user_id,
    deletion_reason,
    stores_count,
    products_count,
    orders_count
  );
  
  -- Delete in correct order (respecting foreign keys)
  DELETE FROM order_items WHERE order_id IN (
    SELECT id FROM orders WHERE store_id IN (
      SELECT id FROM stores WHERE owner_id = target_user_id
    )
  );
  
  DELETE FROM orders WHERE store_id IN (
    SELECT id FROM stores WHERE owner_id = target_user_id
  );
  
  DELETE FROM products WHERE store_id IN (
    SELECT id FROM stores WHERE owner_id = target_user_id
  );
  
  DELETE FROM stores WHERE owner_id = target_user_id;
  DELETE FROM subscriptions WHERE user_id = target_user_id;
  DELETE FROM referrals WHERE user_id = target_user_id OR referred_user_id = target_user_id;
  DELETE FROM whatsapp_verifications WHERE user_id = target_user_id;
  DELETE FROM login_attempts WHERE user_id = target_user_id;
  
  -- Delete from auth.users (requires service role)
  DELETE FROM auth.users WHERE id = target_user_id;
  
  result := jsonb_build_object(
    'success', true,
    'stores_deleted', stores_count,
    'products_deleted', products_count,
    'orders_deleted', orders_count
  );
  
  RETURN result;
END;
$$;

-- =====================================================
-- 16. auto_assign_trial function
-- =====================================================
-- From: 20251112000001_update_trial_period_to_14_days.sql (trigger function)
CREATE OR REPLACE FUNCTION auto_assign_trial()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM give_free_trial(NEW.id);
  RETURN NEW;
END;
$$;

-- =====================================================
-- 17. process_referral_reward function
-- =====================================================
-- From: 20251112000002_update_referral_system_payment_based.sql
CREATE OR REPLACE FUNCTION process_referral_reward(referred_user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_uuid uuid;
  already_rewarded boolean;
BEGIN
  -- Get the referrer
  SELECT user_id, reward_granted
  INTO referrer_uuid, already_rewarded
  FROM referrals
  WHERE referred_user_id = referred_user_uuid;
  
  -- Exit if no referrer or already rewarded
  IF referrer_uuid IS NULL OR already_rewarded THEN
    RETURN;
  END IF;
  
  -- Extend referrer's subscription by 30 days
  PERFORM extend_subscription(referrer_uuid, 30);
  
  -- Mark reward as granted
  UPDATE referrals
  SET reward_granted = true,
      reward_granted_at = NOW()
  WHERE referred_user_id = referred_user_uuid;
END;
$$;

-- =====================================================
-- 18. get_account_deletion_preview function
-- =====================================================
-- From: 20251117000003_add_account_deletion.sql
CREATE OR REPLACE FUNCTION get_account_deletion_preview(target_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stores_count INTEGER;
  products_count INTEGER;
  orders_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO stores_count
  FROM stores WHERE owner_id = target_user_id;
  
  SELECT COUNT(*) INTO products_count
  FROM products WHERE store_id IN (
    SELECT id FROM stores WHERE owner_id = target_user_id
  );
  
  SELECT COUNT(*) INTO orders_count
  FROM orders WHERE store_id IN (
    SELECT id FROM stores WHERE owner_id = target_user_id
  );
  
  RETURN jsonb_build_object(
    'stores', stores_count,
    'products', products_count,
    'orders', orders_count
  );
END;
$$;

-- =====================================================
-- 19. create_image_reviews function
-- =====================================================
-- From: 20251116000002_add_image_moderation_system.sql
CREATE OR REPLACE FUNCTION create_image_reviews()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process if image_urls changed or new product
  IF (TG_OP = 'INSERT' OR NEW.image_urls IS DISTINCT FROM OLD.image_urls) THEN
    -- Delete old reviews for this product if updating
    IF TG_OP = 'UPDATE' THEN
      DELETE FROM image_reviews WHERE product_id = NEW.id;
    END IF;
    
    -- Create review record for each image (handle JSONB array)
    IF NEW.image_urls IS NOT NULL AND jsonb_array_length(NEW.image_urls) > 0 THEN
      INSERT INTO image_reviews (product_id, store_id, image_url, review_status)
      SELECT 
        NEW.id,
        NEW.store_id,
        jsonb_array_elements_text(NEW.image_urls),
        'pending';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- Recreate Triggers (if they were dropped)
-- =====================================================

-- Trigger for auto-assigning trial on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_trial();

-- Trigger for creating referral code on user signup
DROP TRIGGER IF EXISTS create_referral_code_on_signup ON auth.users;
CREATE TRIGGER create_referral_code_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_referral_code();

-- Trigger for creating image reviews on product insert/update
DROP TRIGGER IF EXISTS trigger_create_image_reviews ON products;
CREATE TRIGGER trigger_create_image_reviews
  AFTER INSERT OR UPDATE OF image_urls ON products
  FOR EACH ROW
  EXECUTE FUNCTION create_image_reviews();

-- Trigger for secure storage headers (if applicable)
DROP TRIGGER IF EXISTS on_storage_object_created ON storage.objects;
CREATE TRIGGER on_storage_object_created
  BEFORE INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION set_secure_storage_headers();

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON FUNCTION is_admin(UUID) IS 'Checks if user is admin - search_path set to public';
COMMENT ON FUNCTION give_free_trial(uuid) IS 'Creates a 14-day free trial subscription - search_path set to public';
COMMENT ON FUNCTION extend_subscription(uuid, integer) IS 'Extends user subscription by days - search_path set to public';
COMMENT ON FUNCTION process_referral_reward(uuid) IS 'Processes referral reward on first payment - search_path set to public';
COMMENT ON FUNCTION delete_user_account(UUID, TEXT) IS 'Deletes user account with GDPR compliance - search_path set to public, auth, storage';

-- =====================================================
-- Verification
-- =====================================================
-- Run this to verify all functions have search_path set:
-- SELECT proname, proconfig FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public' AND proname LIKE '%admin%' OR proname LIKE '%trial%';
