-- Create storage bucket for store images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-images',
  'store-images', 
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload their own images
CREATE POLICY "Users can upload their own images" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'store-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy to allow public read access
CREATE POLICY "Public read access" ON storage.objects FOR SELECT
USING (bucket_id = 'store-images');

-- Create policy to allow users to update their own images
CREATE POLICY "Users can update their own images" ON storage.objects FOR UPDATE
USING (
  bucket_id = 'store-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy to allow users to delete their own images
CREATE POLICY "Users can delete their own images" ON storage.objects FOR DELETE
USING (
  bucket_id = 'store-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);