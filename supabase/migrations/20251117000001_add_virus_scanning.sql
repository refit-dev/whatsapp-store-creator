-- Virus Scanning System
-- Tracks all virus/malware scans performed on uploaded files
-- Provides audit trail and threat detection analytics

-- Create virus_scans table
CREATE TABLE IF NOT EXISTS virus_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- File information
  filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- Scan results
  scanner TEXT NOT NULL CHECK (scanner IN ('clamav', 'virustotal', 'pattern', 'none')),
  infected BOOLEAN NOT NULL DEFAULT false,
  threats TEXT[], -- Array of detected threats
  scan_time_ms INTEGER NOT NULL, -- Scan duration in milliseconds
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ip_address TEXT, -- Optional: track IP for suspicious activity
  user_agent TEXT  -- Optional: track user agent
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_virus_scans_user_id ON virus_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_virus_scans_infected ON virus_scans(infected);
CREATE INDEX IF NOT EXISTS idx_virus_scans_created_at ON virus_scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_virus_scans_scanner ON virus_scans(scanner);

-- RLS Policies
ALTER TABLE virus_scans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all virus scans" ON virus_scans;
DROP POLICY IF EXISTS "System can insert virus scans" ON virus_scans;

-- Admin users can view all scans
CREATE POLICY "Admins can view all virus scans"
ON virus_scans FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
  )
);

-- System can insert scan results (service role)
CREATE POLICY "System can insert virus scans"
ON virus_scans FOR INSERT
TO service_role
WITH CHECK (true);

-- Create a view for admin dashboard (threat statistics)
CREATE OR REPLACE VIEW virus_scan_stats AS
SELECT 
  COUNT(*) FILTER (WHERE infected = true) as total_threats_detected,
  COUNT(*) FILTER (WHERE infected = false) as total_clean_scans,
  COUNT(DISTINCT user_id) FILTER (WHERE infected = true) as users_with_threats,
  COUNT(*) as total_scans,
  ROUND(
    (COUNT(*) FILTER (WHERE infected = true)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 
    2
  ) as threat_percentage,
  scanner,
  DATE(created_at) as scan_date
FROM virus_scans
GROUP BY scanner, DATE(created_at)
ORDER BY scan_date DESC;

-- Grant access to admin view
GRANT SELECT ON virus_scan_stats TO authenticated;

-- Create a view for recent threats
CREATE OR REPLACE VIEW recent_threats AS
SELECT 
  virus_scans.id,
  virus_scans.user_id,
  virus_scans.filename,
  virus_scans.file_size,
  virus_scans.mime_type,
  virus_scans.scanner,
  virus_scans.threats,
  virus_scans.scan_time_ms,
  virus_scans.created_at,
  virus_scans.ip_address,
  stores.name as store_name,
  stores.handle
FROM virus_scans
LEFT JOIN stores ON virus_scans.user_id = stores.owner_id
WHERE virus_scans.infected = true
ORDER BY virus_scans.created_at DESC
LIMIT 100;

-- Grant access to recent threats view
GRANT SELECT ON recent_threats TO authenticated;

-- Add comment to table
COMMENT ON TABLE virus_scans IS 'Tracks virus/malware scans for uploaded files. Provides security audit trail and threat detection analytics.';
COMMENT ON COLUMN virus_scans.scanner IS 'Scanning method used: clamav (ClamAV API), virustotal (VirusTotal), pattern (pattern matching), none (scan failed)';
COMMENT ON COLUMN virus_scans.threats IS 'Array of detected threat names/signatures';
COMMENT ON COLUMN virus_scans.scan_time_ms IS 'Time taken to scan file in milliseconds';

-- Create function to clean up old scan logs (keep only last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_virus_scans()
RETURNS void AS $$
BEGIN
  DELETE FROM virus_scans
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND infected = false; -- Keep infected scan records indefinitely for security
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_old_virus_scans() TO service_role;

COMMENT ON FUNCTION cleanup_old_virus_scans() IS 'Removes clean scan records older than 90 days. Infected scans are kept indefinitely for security audit.';
