-- ============================================
-- EASY ADMIN SETUP - Follow These Steps
-- ============================================

-- ⭐ STEP 1: Run this query to get your user ID
-- Replace 'your-email@example.com' with your actual email
SELECT id, email 
FROM auth.users 
WHERE email = 'your-email@example.com';

-- ⏸️ STOP HERE! Copy the 'id' value from the result above
-- It will look like: a1b2c3d4-e5f6-7890-abcd-ef1234567890


-- ⭐ STEP 2: Now run this query
-- Replace the UUID below with the 'id' you copied from Step 1
INSERT INTO admins (user_id, email, is_active)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'your-email@example.com',
  true
);

-- Example (DO NOT USE THIS UUID, it's just an example):
-- INSERT INTO admins (user_id, email, is_active)
-- VALUES (
--   'f4e5d6c7-b8a9-0123-4567-890abcdef123',
--   'your-email@example.com',
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
