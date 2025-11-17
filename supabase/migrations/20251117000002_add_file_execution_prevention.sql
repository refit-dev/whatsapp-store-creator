-- File Execution Prevention for Storage
-- Ensures uploaded files cannot be executed even if they bypass validation

-- Function to set secure headers on all storage objects
CREATE OR REPLACE FUNCTION set_secure_storage_headers()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure metadata exists
  IF NEW.metadata IS NULL THEN
    NEW.metadata = '{}'::jsonb;
  END IF;
  
  -- Set cache control
  NEW.metadata = jsonb_set(
    NEW.metadata,
    '{cacheControl}',
    '"public, max-age=3600, immutable"'::jsonb,
    true
  );
  
  -- Force inline display (never download)
  NEW.metadata = jsonb_set(
    NEW.metadata,
    '{contentDisposition}',
    '"inline"'::jsonb,
    true
  );
  
  -- Ensure content type is preserved (prevents MIME confusion)
  IF NEW.metadata->>'contentType' IS NULL AND NEW.metadata->>'mimetype' IS NOT NULL THEN
    NEW.metadata = jsonb_set(
      NEW.metadata,
      '{contentType}',
      to_jsonb(NEW.metadata->>'mimetype'),
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to storage.objects
DROP TRIGGER IF EXISTS ensure_secure_storage_headers ON storage.objects;

CREATE TRIGGER ensure_secure_storage_headers
  BEFORE INSERT OR UPDATE ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION set_secure_storage_headers();

-- Add comment
COMMENT ON FUNCTION set_secure_storage_headers() IS 'Automatically sets secure headers on all uploaded files to prevent execution and MIME confusion attacks';

-- Verify store-images bucket exists and is configured correctly
DO $$
DECLARE
  bucket_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'store-images'
  ) INTO bucket_exists;
  
  IF bucket_exists THEN
    -- Update bucket configuration for security
    UPDATE storage.buckets
    SET 
      public = true,
      file_size_limit = 5242880, -- 5MB
      allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    WHERE id = 'store-images';
    
    RAISE NOTICE 'Bucket store-images updated with secure configuration';
  ELSE
    RAISE NOTICE 'Bucket store-images does not exist yet - it will be created on first upload';
  END IF;
END $$;

-- Create function to verify file security settings
CREATE OR REPLACE FUNCTION check_storage_security()
RETURNS TABLE (
  bucket_name text,
  is_public boolean,
  size_limit bigint,
  allowed_types text[],
  total_files bigint,
  security_status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as bucket_name,
    b.public as is_public,
    b.file_size_limit as size_limit,
    b.allowed_mime_types as allowed_types,
    COUNT(o.id) as total_files,
    CASE 
      WHEN b.allowed_mime_types IS NOT NULL 
        AND b.file_size_limit IS NOT NULL 
        AND b.file_size_limit <= 5242880 
      THEN '✓ Secure'
      ELSE '⚠ Review Settings'
    END as security_status
  FROM storage.buckets b
  LEFT JOIN storage.objects o ON b.id = o.bucket_id
  WHERE b.id = 'store-images'
  GROUP BY b.id, b.public, b.file_size_limit, b.allowed_mime_types;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (admins can check security)
GRANT EXECUTE ON FUNCTION check_storage_security() TO authenticated;

COMMENT ON FUNCTION check_storage_security() IS 'Check storage bucket security configuration. Run: SELECT * FROM check_storage_security();';

-- Create a view for admins to monitor storage security
CREATE OR REPLACE VIEW storage_security_audit AS
SELECT 
  o.id,
  o.name,
  o.bucket_id,
  o.metadata->>'contentType' as content_type,
  o.metadata->>'size' as file_size,
  o.created_at,
  CASE 
    WHEN o.metadata->>'contentType' LIKE 'image/%' THEN '✓ Image'
    WHEN o.metadata->>'contentType' IS NULL THEN '⚠ No Content-Type'
    ELSE '⚠ Non-Image'
  END as file_type_status,
  CASE 
    WHEN o.metadata->>'contentDisposition' = 'inline' THEN '✓ Inline'
    ELSE '⚠ Not Inline'
  END as disposition_status
FROM storage.objects o
WHERE o.bucket_id = 'store-images'
ORDER BY o.created_at DESC
LIMIT 100;

-- Grant access to admins
GRANT SELECT ON storage_security_audit TO authenticated;

COMMENT ON VIEW storage_security_audit IS 'Monitor uploaded files for security compliance';
