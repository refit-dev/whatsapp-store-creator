-- Add approval system columns to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- Add admin role column to users table (using profiles if you have one, or direct to auth)
-- We'll use a separate admins table for better control
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Add RLS policies for admins table
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Admins can view all admin records
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

-- Only existing admins can insert new admins
CREATE POLICY "Admins can create new admins"
  ON admins FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- Update stores RLS policies to allow admins to view all stores
CREATE POLICY "Admins can view all stores"
  ON stores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- Admins can update any store (for approval/rejection)
CREATE POLICY "Admins can update any store"
  ON stores FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- Update existing stores to be approved by default (backward compatibility)
UPDATE stores
SET approval_status = 'approved',
    approved_at = created_at
WHERE approval_status IS NULL;

-- Create index for faster approval status queries
CREATE INDEX IF NOT EXISTS idx_stores_approval_status ON stores(approval_status);
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = $1
    AND admins.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON TABLE admins IS 'Stores admin users who can approve/reject seller stores';
COMMENT ON COLUMN stores.approval_status IS 'Store approval status: pending, approved, or rejected';
COMMENT ON COLUMN stores.rejection_reason IS 'Reason provided when store is rejected';
COMMENT ON COLUMN stores.approved_at IS 'Timestamp when store was approved';
COMMENT ON COLUMN stores.approved_by IS 'Admin user who approved/rejected the store';
