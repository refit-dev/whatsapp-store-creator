# SUPABASE PROJECT DIAGNOSTICS

## Check These in Your Supabase Dashboard:

### 1. Project Status
- Go to Dashboard → Project Overview
- Check if project is "Active" (not paused/suspended)
- Verify billing status if on paid plan

### 2. Usage Limits (Free Tier)
- Database: 500MB limit
- Auth users: 50,000 users limit
- API requests: 2 million per month
- Storage: 1GB limit

### 3. Database Health
- Go to Database → Logs
- Look for any error messages
- Check connection count

### 4. Auth Logs
- Go to Authentication → Logs
- Look for failed signup attempts
- Check for any error patterns

### 5. API Health
- Go to Settings → API
- Test the "Test connection" button
- Verify all endpoints are accessible

### 6. Common Issues:
- Project paused due to inactivity
- Database connection limits reached
- Invalid SSL certificates
- Regional access restrictions
- Rate limiting triggered

### 7. Reset Options:
If project is corrupted:
- Authentication → Settings → Reset Auth
- Database → Backups → Restore to earlier point
- Or create new project (recommended)

### 8. Support Options:
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/supabase/supabase/issues
- Support Email: support@supabase.io