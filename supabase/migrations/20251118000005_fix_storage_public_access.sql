-- Fix Storage Bucket Policies for Public Image Access
-- This ensures anonymous users can view images from approved stores

-- =====================================================
-- 1. Drop ALL existing policies on storage.objects for store-images
-- =====================================================

DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    END LOOP;
END $$;

-- =====================================================
-- 2. Create fresh policies with correct permissions
-- =====================================================

-- Allow authenticated users to upload (INSERT)
CREATE POLICY "Authenticated users can upload to store-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'store-images'
);

-- Allow EVERYONE (anonymous + authenticated) to view/download images (SELECT)
DROP POLICY IF EXISTS "Anyone can view store-images" ON storage.objects;
CREATE POLICY "Anyone can view store-images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'store-images');

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update own store-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'store-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete own store-images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'store-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- 3. Ensure bucket is public
-- =====================================================

UPDATE storage.buckets
SET public = true
WHERE id = 'store-images';

-- =====================================================
-- 4. Verify setup
-- =====================================================

-- Check bucket configuration
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'store-images';

-- Check policies
SELECT 
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%store-images%';

