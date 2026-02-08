-- Quick script to add approvers who can review stores and images
-- Run in Supabase SQL editor after the users have signed up/logged in

-- 1) Fetch user IDs for the approver emails
SELECT id, email
FROM auth.users
WHERE email IN ('approver1@example.com', 'approver2@example.com');

-- 2) Upsert into approvers table (idempotent)
INSERT INTO approvers (user_id, email, is_active)
SELECT id, email, true
FROM auth.users
WHERE email IN ('approver1@example.com', 'approver2@example.com')
ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email,
      is_active = true;

-- 3) Verify
SELECT * FROM approvers
WHERE email IN ('approver1@example.com', 'approver2@example.com');
