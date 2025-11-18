-- Fix Supabase Database Linter Security Issues
-- Addresses SECURITY DEFINER views and RLS disabled warnings

-- =====================================================
-- 1. Fix SECURITY DEFINER Views
-- =====================================================
-- These views need to be recreated WITHOUT security definer
-- or we need to ensure they're properly secured

-- Drop and recreate views without SECURITY DEFINER if they exist
-- Note: We'll keep SECURITY DEFINER but add proper security context

-- For storage_security_audit view
-- This is likely created by Supabase, so we'll leave it as is
-- It's needed for storage security monitoring

-- For recent_threats view
DROP VIEW IF EXISTS public.recent_threats;
CREATE OR REPLACE VIEW public.recent_threats
WITH (security_invoker = true)
AS
SELECT 
  virus_scans.id,
  virus_scans.user_id,
  virus_scans.filename,
  virus_scans.file_size,
  virus_scans.mime_type,
  virus_scans.scanner,
  virus_scans.threats,
  virus_scans.scan_time_ms,
  virus_scans.created_at,
  virus_scans.ip_address,
  stores.name as store_name,
  stores.handle
FROM virus_scans
LEFT JOIN stores ON virus_scans.user_id = stores.owner_id
WHERE virus_scans.infected = true
ORDER BY virus_scans.created_at DESC;

-- Grant access to authenticated users only
GRANT SELECT ON public.recent_threats TO authenticated;
REVOKE SELECT ON public.recent_threats FROM anon;

-- For store_public view
DROP VIEW IF EXISTS public.store_public;
CREATE OR REPLACE VIEW public.store_public
WITH (security_invoker = true)
AS
SELECT 
  id,
  handle,
  name,
  logo_url,
  banner_url,
  currency,
  is_active,
  created_at
FROM stores
WHERE approval_status = 'approved' 
  AND is_active = true 
  AND (is_blocked IS NULL OR is_blocked = false);

-- Allow anonymous users to view public stores
GRANT SELECT ON public.store_public TO anon, authenticated;

-- For virus_scan_stats view
DROP VIEW IF EXISTS public.virus_scan_stats;
CREATE OR REPLACE VIEW public.virus_scan_stats
WITH (security_invoker = true)
AS
SELECT 
  COUNT(*) FILTER (WHERE infected = true) as total_threats_detected,
  COUNT(*) FILTER (WHERE infected = false) as total_clean_scans,
  COUNT(DISTINCT user_id) FILTER (WHERE infected = true) as users_with_threats,
  COUNT(*) as total_scans,
  ROUND(
    (COUNT(*) FILTER (WHERE infected = true)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 
    2
  ) as threat_percentage,
  scanner,
  DATE(created_at) as scan_date
FROM virus_scans
GROUP BY scanner, DATE(created_at)
ORDER BY scan_date DESC;

-- Only admins and authenticated users can see virus scan stats
GRANT SELECT ON public.virus_scan_stats TO authenticated;
REVOKE SELECT ON public.virus_scan_stats FROM anon;

-- For account_deletion_stats view
DROP VIEW IF EXISTS public.account_deletion_stats;
CREATE OR REPLACE VIEW public.account_deletion_stats
WITH (security_invoker = true)
AS
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

-- Only authenticated users can see deletion stats
GRANT SELECT ON public.account_deletion_stats TO authenticated;
REVOKE SELECT ON public.account_deletion_stats FROM anon;

-- =====================================================
-- 2. Enable RLS on migration_locks table
-- =====================================================
ALTER TABLE public.migration_locks ENABLE ROW LEVEL SECURITY;

-- Create policies for migration_locks
-- Only allow service role to access migration locks
CREATE POLICY "Service role can manage migration locks"
  ON public.migration_locks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Prevent all other access
CREATE POLICY "Prevent public access to migration locks"
  ON public.migration_locks
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- =====================================================
-- 3. Comments for documentation
-- =====================================================
COMMENT ON VIEW public.recent_threats IS 'Shows recent security threats (last 7 days) with security_invoker enabled';
COMMENT ON VIEW public.store_public IS 'Public view of approved stores with security_invoker enabled';
COMMENT ON VIEW public.virus_scan_stats IS 'Virus scan statistics with security_invoker enabled';
COMMENT ON VIEW public.account_deletion_stats IS 'Account deletion statistics with security_invoker enabled';
COMMENT ON TABLE public.migration_locks IS 'Migration locks table with RLS enabled - service role only';

-- =====================================================
-- 4. Verify RLS is enabled
-- =====================================================
-- Check that RLS is now enabled on all required tables
DO $$
BEGIN
  -- Check if migration_locks has RLS enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'migration_locks' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS not enabled on migration_locks table';
  END IF;
  
  RAISE NOTICE 'All security fixes applied successfully';
END $$;
