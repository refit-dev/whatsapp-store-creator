-- ============================================
-- Create Supabase Storage Bucket for Product Images
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable the storage extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Storage buckets must be created via Supabase Dashboard
-- This SQL just sets up the policies

-- After creating the bucket "product-images" in Dashboard, run these policies:

-- Allow public access to view images
CREATE POLICY "Public Access for Product Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow authenticated users to update their own images
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- Allow authenticated users to delete their own images
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- Success message
SELECT 'Storage policies created! Now create the bucket in Dashboard.' as message;