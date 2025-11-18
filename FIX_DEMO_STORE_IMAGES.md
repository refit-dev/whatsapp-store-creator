# Fix Demo Store Images Not Visible

## Problem

Demo store (demo-bakery) images are not visible to anonymous users, but images work fine in your own store when logged in.

## Root Cause

Storage bucket RLS policies may be blocking anonymous access to images.

## Solution

### Step 1: Apply Storage Policy Fix

Go to **Supabase Dashboard** → **SQL Editor** and run this:

```sql
-- Drop ALL existing storage.objects policies
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

-- Create fresh policies
CREATE POLICY "Authenticated users can upload to store-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'store-images');

-- CRITICAL: Allow anonymous users to view images
CREATE POLICY "Anyone can view store-images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'store-images');

CREATE POLICY "Users can update own store-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'store-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own store-images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'store-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Ensure bucket is public
UPDATE storage.buckets
SET public = true
WHERE id = 'store-images';
```

### Step 2: Verify Bucket is Public

Check your bucket settings:

1. Go to **Supabase Dashboard** → **Storage** → `store-images`
2. Click the **Settings** (gear icon)
3. Ensure **Public bucket** is toggled **ON**

### Step 3: Check Demo Store Configuration

Make sure the demo store is approved and active:

```sql
-- Check demo store status
SELECT
  handle,
  name,
  approval_status,
  is_active,
  is_blocked
FROM stores
WHERE handle = 'demo-bakery';

-- If needed, approve it
UPDATE stores
SET
  approval_status = 'approved',
  is_active = true,
  is_blocked = false,
  approved_at = NOW()
WHERE handle = 'demo-bakery';
```

### Step 4: Verify Images Exist

```sql
-- Check if demo store has products with images
SELECT
  p.id,
  p.title,
  p.image_urls,
  p.is_active
FROM products p
JOIN stores s ON s.id = p.store_id
WHERE s.handle = 'demo-bakery'
AND p.is_active = true;
```

### Step 5: Test Image URLs

If images still don't load, check if the URLs are correct:

1. Open browser console (F12)
2. Go to Network tab
3. Visit demo store: `/demo-bakery`
4. Look for failed image requests (red status)
5. Check the error message

Common issues:

- **404**: Image file doesn't exist in storage
- **403**: RLS policy blocking access (apply Step 1 fix)
- **CORS**: Check Supabase storage CORS settings

### Step 6: Alternative - Use Public URLs

If images are stored externally (not in Supabase), make sure the URLs are publicly accessible.

## Quick Test

After applying the fix, test with:

```bash
# Test if images are accessible (replace with actual image URL)
curl -I https://YOUR_PROJECT.supabase.co/storage/v1/object/public/store-images/YOUR_IMAGE.jpg
```

Should return `200 OK` status.

## Files Updated

- `supabase/migrations/20251118000005_fix_storage_public_access.sql`

## Why This Works

The key policy is:

```sql
CREATE POLICY "Anyone can view store-images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'store-images');
```

This allows **both anonymous (anon) and authenticated users** to SELECT (view/download) images from the bucket.
