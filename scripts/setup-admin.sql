-- Quick Admin Setup Script
-- Copy and run this in your Supabase SQL Editor

-- Step 1: Check if migration was applied
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'stores' 
  AND column_name IN ('approval_status', 'rejection_reason', 'approved_at', 'approved_by');

-- Step 2: Check if admins table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'admins'
);

-- Step 3: Get your user ID (replace YOUR_EMAIL with your actual email)
-- RUN THIS FIRST and copy the 'id' (UUID) from the result
SELECT id, email 
FROM auth.users 
WHERE email = 'hello@watzy.app';

-- You should see something like:
-- id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
-- email: your-email@example.com

-- Step 4: Add yourself as admin
-- IMPORTANT: Replace 'PASTE-USER-ID-HERE' with the UUID from Step 3
-- The first value is the USER ID (UUID), not the email!
INSERT INTO admins (user_id, email, is_active)
VALUES (
  'fabf9636-6a7c-4fe0-957a-e6295bae9fb8',  -- ⚠️ PASTE THE UUID FROM STEP 3 HERE (like: a1b2c3d4-e5f6-7890-abcd-ef1234567890)
  'hello@watzy.app',  -- Your email address
  true
)
ON CONFLICT (user_id) DO NOTHING;  -- Prevents duplicate if already exists

-- Step 5: Verify admin was added
SELECT * FROM admins;

-- Step 6: Check pending stores count
SELECT approval_status, COUNT(*) 
FROM stores 
GROUP BY approval_status;

-- Step 7: List all pending stores (if any)
SELECT id, name, handle, approval_status, created_at
FROM stores 
WHERE approval_status = 'pending'
ORDER BY created_at DESC;

-- Optional: Set existing stores to approved (for backward compatibility)
-- Uncomment and run if needed:
-- UPDATE stores 
-- SET approval_status = 'approved', 
--     approved_at = created_at 
-- WHERE approval_status = 'pending';

-- Optional: Make a test store pending (for testing approval flow)
-- Uncomment and replace STORE_ID:
-- UPDATE stores 
-- SET approval_status = 'pending',
--     rejection_reason = NULL,
--     approved_at = NULL,
--     approved_by = NULL
-- WHERE id = 'PASTE-STORE-ID-HERE';
