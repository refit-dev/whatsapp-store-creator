-- API Rate Limiting
-- Tracks API requests to prevent spam and abuse

-- Create api_requests table
CREATE TABLE IF NOT EXISTS api_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  user_agent TEXT,
  request_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  response_status INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_api_requests_user_id ON api_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_api_requests_ip_address ON api_requests(ip_address);
CREATE INDEX IF NOT EXISTS idx_api_requests_request_time ON api_requests(request_time);
CREATE INDEX IF NOT EXISTS idx_api_requests_user_time ON api_requests(user_id, request_time);
CREATE INDEX IF NOT EXISTS idx_api_requests_ip_time ON api_requests(ip_address, request_time);

-- Enable RLS
ALTER TABLE api_requests ENABLE ROW LEVEL SECURITY;

-- System can insert request records
CREATE POLICY "System can insert api requests"
  ON api_requests FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Users can view their own request history
CREATE POLICY "Users can view their own api requests"
  ON api_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all api requests for monitoring
CREATE POLICY "Admins can view all api requests"
  ON api_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- Function to clean up old api requests (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_api_requests()
RETURNS void AS $$
BEGIN
  DELETE FROM api_requests
  WHERE request_time < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get request count for rate limiting
CREATE OR REPLACE FUNCTION get_request_count(
  p_user_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_minutes INTEGER DEFAULT 15
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM api_requests
  WHERE request_time > NOW() - (p_minutes || ' minutes')::INTERVAL
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id)
      OR (p_ip_address IS NOT NULL AND ip_address = p_ip_address)
    );
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE api_requests IS 'Tracks API requests for rate limiting and monitoring. Records kept for 24 hours.';
COMMENT ON COLUMN api_requests.user_id IS 'Authenticated user making the request (if logged in)';
COMMENT ON COLUMN api_requests.ip_address IS 'IP address of the client';
COMMENT ON COLUMN api_requests.endpoint IS 'API endpoint path';
COMMENT ON COLUMN api_requests.method IS 'HTTP method (GET, POST, etc.)';
COMMENT ON COLUMN api_requests.response_status IS 'HTTP response status code';
COMMENT ON FUNCTION get_request_count IS 'Returns request count for rate limiting checks';
