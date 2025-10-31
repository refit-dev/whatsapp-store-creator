-- ABSOLUTE MINIMAL TEST
-- Remove everything and test basic auth

-- Remove ALL our customizations
DROP TABLE IF EXISTS verification_codes CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP FUNCTION IF EXISTS is_verification_rate_limited(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS record_verification_attempt(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Success message
SELECT 'COMPLETELY CLEAN - Try basic signup with just email/password (no mobile)' AS status;