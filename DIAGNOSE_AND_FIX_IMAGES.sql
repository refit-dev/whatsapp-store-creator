-- DIAGNOSTIC AND FIX SCRIPT
-- Run this in Supabase SQL Editor to diagnose and fix all issues

-- =====================================================
-- STEP 1: Check bucket configuration
-- =====================================================
SELECT 
  '=== BUCKET CHECK ===' as step,
  id,
  name,
  CASE 
    WHEN public = true THEN '✓ PUBLIC'
    ELSE '✗ NOT PUBLIC - WILL FIX'
  END as status,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'store-images';

-- =====================================================
-- STEP 2: Fix bucket - Make it public
-- =====================================================
UPDATE storage.buckets
SET public = true
WHERE id = 'store-images';

SELECT '✓ Bucket is now public' as fix_applied;

-- =====================================================
-- STEP 3: Check demo store status
-- =====================================================
SELECT 
  '=== DEMO STORE CHECK ===' as step,
  handle,
  name,
  CASE 
    WHEN approval_status = 'approved' THEN '✓ APPROVED'
    ELSE '✗ NOT APPROVED: ' || COALESCE(approval_status, 'NULL')
  END as approval,
  CASE 
    WHEN is_active = true THEN '✓ ACTIVE'
    ELSE '✗ INACTIVE'
  END as active_status,
  CASE 
    WHEN is_blocked = false OR is_blocked IS NULL THEN '✓ NOT BLOCKED'
    ELSE '✗ BLOCKED'
  END as block_status
FROM stores
WHERE handle = 'demo-bakery';

-- =====================================================
-- STEP 4: Fix demo store - Approve and activate
-- =====================================================
UPDATE stores
SET 
  approval_status = 'approved',
  is_active = true,
  is_blocked = false,
  approved_at = NOW()
WHERE handle = 'demo-bakery';

SELECT '✓ Demo store is now approved and active' as fix_applied;

-- =====================================================
-- STEP 5: Check demo store products and images
-- =====================================================
SELECT 
  '=== DEMO PRODUCTS CHECK ===' as step,
  p.id,
  p.title,
  CASE 
    WHEN p.image_urls IS NOT NULL AND jsonb_array_length(p.image_urls) > 0 
    THEN '✓ HAS IMAGES (' || jsonb_array_length(p.image_urls) || ')'
    ELSE '✗ NO IMAGES'
  END as image_status,
  p.image_urls->0 as first_image_url,
  CASE 
    WHEN p.is_active = true THEN '✓ ACTIVE'
    ELSE '✗ INACTIVE'
  END as product_status
FROM products p
JOIN stores s ON s.id = p.store_id
WHERE s.handle = 'demo-bakery'
ORDER BY p.created_at DESC
LIMIT 10;

-- =====================================================
-- STEP 6: Check storage policies for anonymous access
-- =====================================================
SELECT 
  '=== STORAGE POLICIES CHECK ===' as step,
  policyname,
  cmd as operation,
  CASE 
    WHEN 'anon' = ANY(roles) THEN '✓ Anonymous allowed'
    ELSE '✗ Anonymous blocked'
  END as anon_access,
  CASE 
    WHEN 'authenticated' = ANY(roles) THEN '✓ Authenticated allowed'
    ELSE '✗ Authenticated blocked'
  END as auth_access
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
ORDER BY policyname;

-- =====================================================
-- STEP 7: Summary and recommendations
-- =====================================================
SELECT 
  '=== SUMMARY ===' as section,
  'Run the queries above to see what was fixed' as message
UNION ALL
SELECT 
  'Next Steps' as section,
  '1. Clear your browser cache' as message
UNION ALL
SELECT 
  'Next Steps' as section,
  '2. Visit /demo-bakery in incognito/private window' as message
UNION ALL
SELECT 
  'Next Steps' as section,
  '3. Check browser console (F12) for image load errors' as message
UNION ALL
SELECT 
  'Next Steps' as section,
  '4. Test image URL directly in browser address bar' as message;

