# Login Attempt Limiter - Anti-Brute Force Protection

## Overview

Prevents brute force attacks by limiting login attempts. After 5 failed login attempts within a 15-minute window, the account is temporarily locked for 15 minutes.

## Features

### Security Features

- ✅ **Rate Limiting**: Maximum 5 failed attempts per email within 15 minutes
- ✅ **Automatic Lockout**: Account locked for 15 minutes after reaching the limit
- ✅ **Progressive Warnings**: Users warned after 3 failed attempts
- ✅ **Automatic Cleanup**: Old attempt records cleaned after 24 hours
- ✅ **Success Reset**: Failed attempts cleared after successful login
- ✅ **Fail-Open Design**: If tracking system fails, users can still login (security vs availability trade-off)

### User Experience

- ✅ **Clear Feedback**: Shows remaining attempts and lockout duration
- ✅ **Time Display**: Shows minutes remaining until unlock
- ✅ **Early Warning**: Warns users at 2 attempts remaining
- ✅ **Graceful Degradation**: System works even if tracking fails

## Configuration

### Settings (in `lib/login-attempt-limiter.ts`)

```typescript
const MAX_ATTEMPTS = 5; // Maximum failed attempts allowed
const LOCKOUT_DURATION_MINUTES = 15; // Lockout duration in minutes
```

### Customization

To adjust the limits, edit these constants:

```typescript
// Example: Stricter limits (3 attempts, 30 minute lockout)
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MINUTES = 30;

// Example: More lenient (10 attempts, 5 minute lockout)
const MAX_ATTEMPTS = 10;
const LOCKOUT_DURATION_MINUTES = 5;
```

## Database Schema

### `login_attempts` Table

| Column       | Type        | Description                                      |
| ------------ | ----------- | ------------------------------------------------ |
| id           | UUID        | Primary key                                      |
| email        | TEXT        | Email address (lowercase)                        |
| ip_address   | TEXT        | Client IP (currently null, requires server-side) |
| user_agent   | TEXT        | Browser user agent                               |
| attempt_time | TIMESTAMPTZ | When attempt occurred                            |
| success      | BOOLEAN     | Whether attempt succeeded                        |
| created_at   | TIMESTAMPTZ | Record creation time                             |

### Indexes

- `idx_login_attempts_email` - Fast lookups by email
- `idx_login_attempts_attempt_time` - Fast time-based queries
- `idx_login_attempts_email_time` - Composite for optimal performance

## Implementation Details

### How It Works

1. **Pre-Login Check**

   ```typescript
   const lockStatus = await checkLoginLock(email);
   if (lockStatus.isLocked) {
     // Show lockout message
     return;
   }
   ```

2. **Failed Login**

   ```typescript
   await recordLoginAttempt(email, false);
   const newLockStatus = await checkLoginLock(email);
   // Show warning if close to limit
   ```

3. **Successful Login**
   ```typescript
   await recordLoginAttempt(email, true);
   // All failed attempts for this email are cleared
   ```

### Functions

#### `checkLoginLock(email: string)`

Returns lock status for an email:

```typescript
{
  isLocked: boolean,        // Whether currently locked
  remainingMinutes: number, // Minutes until unlock
  attemptCount: number      // Failed attempts in window
}
```

#### `recordLoginAttempt(email: string, success: boolean)`

Records a login attempt (success or failure)

#### `getRemainingAttempts(email: string)`

Returns number of attempts remaining before lockout

#### `formatLockoutMessage(remainingMinutes: number)`

Returns user-friendly lockout message

## Files

### New Files

- `supabase/migrations/20251116000003_add_login_attempts.sql` - Database migration
- `lib/login-attempt-limiter.ts` - Rate limiting logic

### Modified Files

- `app/auth/AuthClient.tsx` - Integrated rate limiting into login flow
- `types/supabase.ts` - Added login_attempts table types

## User Messages

### During Login

- **Normal login**: No messages
- **After 3 failures**: "⚠️ Warning: 2 attempts remaining before temporary lockout."
- **After 4 failures**: "⚠️ Warning: 1 attempt remaining before temporary lockout."
- **Locked (1 min)**: "Account temporarily locked. Please try again in 1 minute."
- **Locked (5+ min)**: "Account temporarily locked due to multiple failed login attempts. Please try again in X minutes."

### Progressive Feedback

The system provides early warnings to help users realize they may be entering wrong credentials before getting locked out.

## Security Considerations

### Current Implementation

- ✅ Email-based tracking (case-insensitive)
- ✅ 15-minute sliding window
- ✅ Automatic cleanup of old records
- ✅ Fail-open design (no lockout if tracking fails)
- ⚠️ IP tracking not implemented (requires server-side)

### Potential Enhancements

1. **IP-based Tracking**

   - Requires server-side implementation (Edge Functions or API Routes)
   - Would prevent attacks from different emails on same IP

2. **CAPTCHA Integration**

   - Add after 2-3 failed attempts
   - Further reduces brute force risk

3. **Email Notifications**

   - Notify users of failed login attempts
   - Alert of account lockouts

4. **Admin Dashboard**

   - View login attempt patterns
   - Identify suspicious activity
   - Manual unlock capability

5. **Distributed Rate Limiting**
   - Use Redis or similar for better scalability
   - Current implementation uses PostgreSQL

### Known Limitations

- **Client-side only**: No IP tracking (can be bypassed by using different emails)
- **No account-level security**: Attackers can target different accounts
- **Database-dependent**: If database is down, tracking is disabled
- **No global rate limit**: Each email tracked separately

## Testing

### Manual Testing Checklist

- [ ] Test successful login (no lockout)
- [ ] Test 5 failed attempts (should lock)
- [ ] Test waiting for unlock (should unlock after 15 min)
- [ ] Test successful login after failures (should clear failed attempts)
- [ ] Test warning messages at 3+ failures
- [ ] Test with invalid email addresses
- [ ] Test concurrent logins from same email
- [ ] Verify old attempts cleaned up after 24 hours

### Test Scenarios

#### Scenario 1: Normal Failed Login

```
1. Attempt login with wrong password - Shows error
2. Attempt login with wrong password - Shows error
3. Check remaining attempts - Should show 3 remaining
```

#### Scenario 2: Lockout

```
1. Fail login 5 times
2. Should show "Account temporarily locked..." message
3. Wait 15 minutes
4. Should be able to login again
```

#### Scenario 3: Recovery After Success

```
1. Fail login 3 times
2. Login successfully
3. Failed attempts should be cleared
4. Can login again immediately
```

## Monitoring

### Database Queries

#### Check active lockouts

```sql
SELECT email, COUNT(*) as failed_attempts,
       MAX(attempt_time) as last_attempt
FROM login_attempts
WHERE success = false
  AND attempt_time > NOW() - INTERVAL '15 minutes'
GROUP BY email
HAVING COUNT(*) >= 5
ORDER BY last_attempt DESC;
```

#### View attempt history

```sql
SELECT email, success, attempt_time, user_agent
FROM login_attempts
WHERE attempt_time > NOW() - INTERVAL '1 day'
ORDER BY attempt_time DESC
LIMIT 100;
```

#### Failed attempt statistics

```sql
SELECT DATE(attempt_time) as date,
       COUNT(*) as total_attempts,
       SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
       SUM(CASE WHEN success THEN 0 ELSE 1 END) as failed
FROM login_attempts
WHERE attempt_time > NOW() - INTERVAL '7 days'
GROUP BY DATE(attempt_time)
ORDER BY date DESC;
```

## Maintenance

### Cleanup Function

Run periodically to remove old records:

```sql
SELECT cleanup_old_login_attempts();
```

### Manual Unlock

To manually unlock an account:

```sql
DELETE FROM login_attempts
WHERE email = 'user@example.com'
  AND success = false;
```

## Migration Steps

1. **Apply Migration**

   ```bash
   # Run in Supabase SQL Editor
   # File: supabase/migrations/20251116000003_add_login_attempts.sql
   ```

2. **Verify Table Created**

   ```sql
   SELECT * FROM login_attempts LIMIT 1;
   ```

3. **Test Login Flow**

   - Try logging in with wrong password
   - Verify attempt recorded in database

4. **Monitor Initial Usage**
   - Check for any errors in console
   - Verify lockouts working as expected

## Troubleshooting

### Users Can't Login After Failed Attempts

**Check**: Are they actually locked?

```sql
SELECT COUNT(*) FROM login_attempts
WHERE email = 'user@example.com'
  AND success = false
  AND attempt_time > NOW() - INTERVAL '15 minutes';
```

**Solution**: If count >= 5, wait 15 minutes or manually clear:

```sql
DELETE FROM login_attempts
WHERE email = 'user@example.com';
```

### Attempts Not Being Recorded

**Check**: Browser console for errors
**Check**: RLS policies are correct
**Check**: User has permission to insert

### False Positives (Legitimate Users Locked Out)

**Options**:

1. Increase MAX_ATTEMPTS (current: 5)
2. Decrease LOCKOUT_DURATION_MINUTES (current: 15)
3. Implement "Forgot Password" flow
4. Add admin unlock capability

## FAQ

**Q: What happens if someone uses wrong email?**
A: Attempts are tracked per email address, so wrong emails won't affect the actual account.

**Q: Can attackers bypass by using different emails?**
A: Yes, current implementation tracks per-email only. IP tracking would help prevent this.

**Q: What if the database is down?**
A: System fails open - users can still login (availability over strict security).

**Q: How long are records kept?**
A: 24 hours, after which they're automatically cleaned up.

**Q: Can users reset their lockout?**
A: Not directly. They can use "Forgot Password" or wait 15 minutes.

**Q: Does successful login reset the counter?**
A: Yes, all failed attempts are cleared after successful login.

## Best Practices

1. **Monitor regularly** - Check for unusual patterns
2. **Adjust limits** - Based on your user behavior
3. **Add CAPTCHA** - For additional protection
4. **Implement IP tracking** - For better security
5. **User communication** - Clear messages about lockouts
6. **Admin tools** - Build unlock capability
7. **Logging** - Keep audit trail of security events

## Related Features

- [Forgot Password](./forgot-password-feature.md) - Password reset flow
- Email Verification - Prevents automated signups
- Admin Panel - Monitor security events (future)
