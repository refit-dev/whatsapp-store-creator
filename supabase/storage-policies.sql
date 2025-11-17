-- File Type Restrictions for Supabase Storage
-- Configure storage bucket to only allow safe image formats

-- This file documents the storage bucket configuration
-- Apply these settings in Supabase Dashboard > Storage > store-images bucket

-- Bucket Configuration:
-- 1. Public: Yes (for public access to images)
-- 2. File size limit: 5242880 bytes (5MB)
-- 3. Allowed MIME types:
--    - image/jpeg
--    - image/jpg
--    - image/png
--    - image/webp

-- To create or update the bucket with these settings, run this in your application:
/*
  const { data, error } = await supabase.storage.createBucket('store-images', {
    public: true,
    fileSizeLimit: 5242880,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  });
*/

-- Or update existing bucket:
/*
  const { data, error } = await supabase.storage.updateBucket('store-images', {
    public: true,
    fileSizeLimit: 5242880,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  });
*/

-- Storage Policies (RLS)
-- These policies should already be in place, but verify them in Supabase Dashboard

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- Policy 1: Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'store-images');

-- Policy 2: Allow public read access
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'store-images');

-- Policy 3: Users can update their own images
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'store-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy 4: Users can delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'store-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Notes:
-- 1. The bucket is automatically created by the upload API if it doesn't exist
-- 2. File validation happens at multiple levels:
--    - Client-side: File input accept attribute + JavaScript validation
--    - Server-side: Extension, MIME type, and magic byte validation
--    - Storage: Bucket-level MIME type restrictions
-- 3. Only JPG, PNG, and WebP formats are allowed
-- 4. Maximum file size is 5MB
-- 5. Executable files and scripts are explicitly blocked
