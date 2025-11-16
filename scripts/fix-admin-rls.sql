-- Fix RLS policy for admins table
-- The issue: current policy requires you to be an admin to check if you're an admin!
-- Solution: Allow authenticated users to check if THEY are an admin

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;

-- Create a new policy that allows users to check their own admin status
CREATE POLICY "Users can check their own admin status"
  ON admins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Keep the policy for admins to view all admins
CREATE POLICY "Admins can view all admins"
  ON admins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );
