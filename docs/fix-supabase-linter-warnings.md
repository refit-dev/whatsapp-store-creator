# Fix Supabase Linter Warnings

This guide explains how to resolve all Supabase database linter warnings.

## 1. Function Search Path Warnings (19 warnings)

### Problem

Functions without explicit `search_path` settings can be vulnerable to search path injection attacks.

### Solution

Run the migration file: `20251119000002_fix_function_search_path.sql`

This migration adds `SET search_path = public` (or appropriate schemas) to all 19 functions:

- `is_admin`
- `cleanup_old_login_attempts`
- `give_free_trial`
- `cleanup_old_api_requests`
- `get_request_count`
- `cleanup_old_virus_scans`
- `generate_referral_code`
- `create_user_referral_code`
- `cleanup_expired_verification_codes`
- `is_verification_rate_limited`
- `record_verification_attempt`
- `set_secure_storage_headers`
- `check_storage_security`
- `extend_subscription`
- `delete_user_account`
- `auto_assign_trial`
- `process_referral_reward`
- `get_account_deletion_preview`
- `create_image_reviews`

### Steps

1. Open Supabase SQL Editor
2. Copy and paste the contents of `supabase/migrations/20251119000002_fix_function_search_path.sql`
3. Run the migration
4. Verify all functions are updated

## 2. Leaked Password Protection Warning

### Problem

Supabase Auth's leaked password protection is disabled. This feature prevents users from using passwords that have been compromised in data breaches.

### Solution

Enable the feature in Supabase Dashboard:

1. **Navigate to Auth Settings:**

   - Go to your Supabase Dashboard
   - Click on **Authentication** in the left sidebar
   - Click on **Policies** or **Settings**

2. **Enable Leaked Password Protection:**

   - Look for "Password Security" or "Password Policies" section
   - Find the toggle for "Leaked Password Protection" or "Have I Been Pwned (HIBP) Integration"
   - **Enable** this setting

3. **Alternative: Via Supabase CLI or API:**
   If the option is not visible in the dashboard, you can enable it using the Management API:

   ```bash
   # Using curl (replace with your project ref and service role key)
   curl -X PATCH 'https://api.supabase.com/v1/projects/{PROJECT_REF}/config/auth' \
     -H "Authorization: Bearer {SERVICE_ROLE_KEY}" \
     -H "Content-Type: application/json" \
     -d '{
       "password_strength": {
         "hibp_enabled": true
       }
     }'
   ```

4. **Verify:**
   - Try creating a test user with a common leaked password (e.g., "password123")
   - The system should reject it with an error about compromised passwords
   - Check the linter again - the warning should be gone

### What This Does

- Checks passwords against the Have I Been Pwned database
- Prevents users from using passwords that appear in known data breaches
- Improves overall account security
- No performance impact on user signup (async check)

### Important Notes

- This setting affects **new** password creations and changes
- Existing passwords are not automatically checked
- Consider sending an email to existing users encouraging password updates
- The check happens server-side and doesn't expose user passwords

## 3. Verification Steps

After applying all fixes:

1. **Check SQL Editor:**

   ```sql
   -- Verify all functions have search_path set
   SELECT
     proname as function_name,
     prosecdef as security_definer,
     proconfig as config
   FROM pg_proc p
   JOIN pg_namespace n ON p.pronamespace = n.oid
   WHERE n.nspname = 'public'
     AND proname IN (
       'is_admin', 'give_free_trial', 'extend_subscription',
       'delete_user_account', 'cleanup_old_login_attempts'
       -- ... add other function names
     );
   ```

2. **Run Supabase Linter:**

   - Go to Database → Database Linter in Supabase Dashboard
   - Click "Run Linter"
   - Verify all warnings are resolved

3. **Expected Result:**
   - 0 errors
   - 0 warnings
   - All functions should show `search_path` in their config

## Security Benefits

✅ **Search Path Protection:** Prevents injection attacks where malicious schemas override functions

✅ **Password Security:** Blocks use of compromised passwords from data breaches

✅ **Best Practices:** Follows Supabase and PostgreSQL security recommendations

✅ **Compliance:** Helps meet security audit requirements

## References

- [Supabase Database Linter - Function Search Path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- [Supabase Auth Password Security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
- [PostgreSQL SET Configuration](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [Have I Been Pwned API](https://haveibeenpwned.com/API/v3)
