-- ============================================
-- EASY ADMIN SETUP - Follow These Steps
-- ============================================

-- ⭐ STEP 1: Run this query to get your user ID
-- Replace 'hello@watzy.app' with your actual email
SELECT id, email 
FROM auth.users 
WHERE email = 'hello@watzy.app';

-- ⏸️ STOP HERE! Copy the 'id' value from the result above
-- It will look like: a1b2c3d4-e5f6-7890-abcd-ef1234567890


-- ⭐ STEP 2: Now run this query
-- Replace the UUID below with the 'id' you copied from Step 1
INSERT INTO admins (user_id, email, is_active)
VALUES (
  'fabf9636-6a7c-4fe0-957a-e6295bae9fb8',
  'hello@watzy.app',
  true
);

-- Example (DO NOT USE THIS UUID, it's just an example):
-- INSERT INTO admins (user_id, email, is_active)
-- VALUES (
--   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
--   'hello@watzy.app',
--   true
-- );


-- ⭐ STEP 3: Verify it worked
SELECT * FROM admins;

-- You should see your email in the results!
-- Now you can access http://localhost:3000/admin


-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If you see "duplicate key value" error:
-- You're already an admin! Just go to /admin

-- If you see "no rows returned" in Step 1:
-- Make sure you're logged in and the email is correct

-- If Step 2 fails with "uuid" error:
-- Make sure you pasted the UUID (long string with dashes)
-- NOT the email address!
