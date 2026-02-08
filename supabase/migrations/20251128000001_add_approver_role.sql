-- Approver role for store approvals and image moderation
-- Adds approvers table, helper function, policies, and seeds default approvers

-- 1) Approvers table
CREATE TABLE IF NOT EXISTS approvers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE approvers ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_approvers_user_id ON approvers(user_id);

-- Allow users to verify their own approver status
CREATE POLICY "Users can check their own approver status"
  ON approvers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Only admins can manage approver records
CREATE POLICY "Admins can manage approvers"
  ON approvers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- Helper to check approver status
CREATE OR REPLACE FUNCTION is_approver(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM approvers
    WHERE approvers.user_id = $1
    AND approvers.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2) Expand store policies to approvers
DROP POLICY IF EXISTS "Admins can view all stores" ON stores;
CREATE POLICY "Admins and approvers can view all stores"
  ON stores FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()) OR is_approver(auth.uid()));

DROP POLICY IF EXISTS "Admins can update any store" ON stores;
CREATE POLICY "Admins and approvers can update any store"
  ON stores FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()) OR is_approver(auth.uid()));

-- 3) Expand image review policies to approvers
DROP POLICY IF EXISTS "Admins can view all image reviews" ON image_reviews;
CREATE POLICY "Admins and approvers can view all image reviews"
  ON image_reviews FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()) OR is_approver(auth.uid()));

DROP POLICY IF EXISTS "Admins can update image reviews" ON image_reviews;
CREATE POLICY "Admins and approvers can update image reviews"
  ON image_reviews FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()) OR is_approver(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert image reviews" ON image_reviews;
CREATE POLICY "Admins and approvers can insert image reviews"
  ON image_reviews FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()) OR is_approver(auth.uid()));

-- 4) Seed default approvers by email (idempotent)
DO $$
DECLARE
  approver_record RECORD;
BEGIN
  FOR approver_record IN
    SELECT id, email
    FROM auth.users
    WHERE email IN ('approver1@example.com', 'approver2@example.com')
  LOOP
    INSERT INTO approvers (user_id, email, is_active)
    VALUES (approver_record.id, approver_record.email, true)
    ON CONFLICT (user_id) DO UPDATE
      SET email = EXCLUDED.email,
          is_active = true;
  END LOOP;
END $$;

COMMENT ON TABLE approvers IS 'Backoffice approvers who can review stores and images';
COMMENT ON FUNCTION is_approver IS 'Returns true when the given user_id is an active approver';
