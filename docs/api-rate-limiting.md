# API Rate Limiting System

## Overview

Prevents spam and abuse by limiting API requests to 100 per 15 minutes per user or IP address.

## Features

### Core Capabilities

- ✅ **Request Tracking**: Monitors all API requests by user ID and IP address
- ✅ **Automatic Limiting**: Blocks requests after 100 in 15 minutes
- ✅ **Sliding Window**: Uses 15-minute rolling window (not fixed intervals)
- ✅ **User & IP Tracking**: Limits by authenticated user OR IP for anonymous users
- ✅ **Rate Limit Headers**: Returns X-RateLimit-\* headers with every response
- ✅ **Graceful Degradation**: Fails open if tracking system unavailable
- ✅ **Auto Cleanup**: Old requests deleted after 24 hours

### HTTP Headers Returned

All rate-limited endpoints return these headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 2025-11-16T15:30:00Z
```

### 429 Response

When limit exceeded:

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again in 15 minutes.",
  "limit": 100,
  "remaining": 0,
  "resetTime": "2025-11-16T15:30:00Z"
}
```

## Configuration

### Settings (in `lib/rate-limiter.ts`)

```typescript
const MAX_REQUESTS = 100; // Maximum requests allowed
const WINDOW_MINUTES = 15; // Time window in minutes
```

### Customization Examples

#### Stricter Limits

```typescript
const MAX_REQUESTS = 50; // 50 requests
const WINDOW_MINUTES = 10; // per 10 minutes
```

#### More Lenient

```typescript
const MAX_REQUESTS = 200; // 200 requests
const WINDOW_MINUTES = 30; // per 30 minutes
```

#### Per-Endpoint Custom Limits

```typescript
// In your route file
const ENDPOINT_LIMITS = {
  "/api/orders": { max: 50, window: 15 }, // Stricter for orders
  "/api/products": { max: 200, window: 15 }, // Lenient for browsing
};
```

## Implementation

### Method 1: Simple Wrapper (Recommended)

```typescript
import { rateLimitedHandler } from "@/lib/rate-limiter";
import { NextRequest, NextResponse } from "next/server";

export const POST = rateLimitedHandler(async (request: NextRequest) => {
  // Your API logic here
  // Automatically rate limited before reaching this code

  return NextResponse.json({ success: true });
});
```

### Method 2: Middleware Pattern

```typescript
import { withRateLimit } from "@/lib/rate-limiter";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return withRateLimit(request, async () => {
    // Your API logic
    return NextResponse.json({ success: true });
  });
}
```

### Method 3: Manual Control

```typescript
import {
  checkRateLimit,
  recordApiRequest,
  getClientIp
} from "@/lib/rate-limiter";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const userId = /* get from session */;
  const ipAddress = getClientIp(request);

  // Check rate limit
  const rateLimit = await checkRateLimit(userId, ipAddress);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetTime.toISOString(),
        }
      }
    );
  }

  // Process request
  const response = NextResponse.json({ success: true });

  // Record request
  await recordApiRequest(
    userId,
    ipAddress,
    request.nextUrl.pathname,
    request.method,
    request.headers.get("user-agent"),
    200
  );

  return response;
}
```

## Database Schema

### `api_requests` Table

| Column          | Type        | Description                   |
| --------------- | ----------- | ----------------------------- |
| id              | UUID        | Primary key                   |
| user_id         | UUID        | Authenticated user (nullable) |
| ip_address      | TEXT        | Client IP address             |
| endpoint        | TEXT        | API endpoint path             |
| method          | TEXT        | HTTP method (GET, POST, etc.) |
| user_agent      | TEXT        | Browser/client user agent     |
| request_time    | TIMESTAMPTZ | When request occurred         |
| response_status | INTEGER     | HTTP status code              |
| created_at      | TIMESTAMPTZ | Record creation time          |

### Indexes

- `idx_api_requests_user_id` - Fast user lookups
- `idx_api_requests_ip_address` - Fast IP lookups
- `idx_api_requests_request_time` - Time-based queries
- `idx_api_requests_user_time` - Composite for user + time
- `idx_api_requests_ip_time` - Composite for IP + time

## Functions

### `checkRateLimit(userId, ipAddress)`

Returns current rate limit status:

```typescript
{
  allowed: boolean,        // Can make request?
  remaining: number,       // Requests left
  resetTime: Date,         // When limit resets
  limit: number           // Max requests allowed
}
```

### `recordApiRequest(...)`

Records a request for tracking:

```typescript
await recordApiRequest(
  userId, // User ID or null
  ipAddress, // Client IP
  endpoint, // '/api/orders'
  method, // 'POST'
  userAgent, // Browser info
  responseStatus // 200, 429, etc.
);
```

### `getClientIp(request)`

Extracts client IP from request headers:

```typescript
const ip = getClientIp(request);
// Checks: x-forwarded-for, x-real-ip, x-vercel-forwarded-for
```

### `rateLimitedHandler(handler)`

Wraps a handler with rate limiting:

```typescript
export const POST = rateLimitedHandler(async (req) => {
  return NextResponse.json({ success: true });
});
```

### `withRateLimit(request, handler)`

Middleware-style rate limiting:

```typescript
export async function POST(req: NextRequest) {
  return withRateLimit(req, async () => {
    return NextResponse.json({ success: true });
  });
}
```

## Files

### New Files

- `supabase/migrations/20251116000004_add_api_rate_limiting.sql` - Database
- `lib/rate-limiter.ts` - Rate limiting logic
- `app/api/example-rate-limited/route.ts` - Example implementation

### Modified Files

- `types/supabase.ts` - Added api_requests table types

## Client-Side Handling

### JavaScript/TypeScript

```typescript
async function makeApiRequest() {
  try {
    const response = await fetch("/api/your-endpoint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    // Check rate limit headers
    const limit = response.headers.get("X-RateLimit-Limit");
    const remaining = response.headers.get("X-RateLimit-Remaining");
    const reset = response.headers.get("X-RateLimit-Reset");

    if (response.status === 429) {
      const error = await response.json();
      alert(`Rate limit exceeded. Try again at ${error.resetTime}`);
      return;
    }

    // Process successful response
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("API error:", error);
  }
}
```

### React Hook

```typescript
import { useState, useEffect } from "react";

function useRateLimit() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limit, setLimit] = useState<number | null>(null);
  const [resetTime, setResetTime] = useState<Date | null>(null);

  const checkHeaders = (response: Response) => {
    const limit = response.headers.get("X-RateLimit-Limit");
    const remaining = response.headers.get("X-RateLimit-Remaining");
    const reset = response.headers.get("X-RateLimit-Reset");

    if (limit) setLimit(parseInt(limit));
    if (remaining) setRemaining(parseInt(remaining));
    if (reset) setResetTime(new Date(reset));
  };

  return { remaining, limit, resetTime, checkHeaders };
}
```

## Monitoring

### View Current Request Counts

```sql
-- Requests per user in last 15 minutes
SELECT user_id, ip_address, COUNT(*) as request_count
FROM api_requests
WHERE request_time > NOW() - INTERVAL '15 minutes'
GROUP BY user_id, ip_address
ORDER BY request_count DESC;
```

### Find Users Near Limit

```sql
SELECT user_id, ip_address, COUNT(*) as requests
FROM api_requests
WHERE request_time > NOW() - INTERVAL '15 minutes'
GROUP BY user_id, ip_address
HAVING COUNT(*) >= 80  -- 80% of limit
ORDER BY requests DESC;
```

### Rate Limited Requests

```sql
SELECT endpoint, COUNT(*) as blocked_requests
FROM api_requests
WHERE response_status = 429
  AND request_time > NOW() - INTERVAL '24 hours'
GROUP BY endpoint
ORDER BY blocked_requests DESC;
```

### Top Endpoints by Volume

```sql
SELECT endpoint, method, COUNT(*) as total_requests
FROM api_requests
WHERE request_time > NOW() - INTERVAL '1 hour'
GROUP BY endpoint, method
ORDER BY total_requests DESC
LIMIT 20;
```

### Request Statistics

```sql
SELECT
  DATE_TRUNC('hour', request_time) as hour,
  COUNT(*) as total_requests,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT ip_address) as unique_ips,
  SUM(CASE WHEN response_status = 429 THEN 1 ELSE 0 END) as rate_limited
FROM api_requests
WHERE request_time > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

## Security Considerations

### Current Implementation

- ✅ Tracks by user ID (authenticated)
- ✅ Tracks by IP (anonymous users)
- ✅ Sliding 15-minute window
- ✅ Automatic cleanup
- ✅ Fail-open design (availability over strict limiting)
- ✅ Records endpoint, method, status

### Limitations

- **IP Spoofing**: Users behind proxies share IP
- **No Distributed Tracking**: Multiple servers = separate counters
- **Database Dependent**: Rate limiting disabled if DB unavailable
- **No Burst Protection**: Could send 100 requests in 1 second

### Potential Enhancements

#### 1. Redis-Based Rate Limiting

```typescript
// Use Redis for better performance and distribution
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

async function checkRateLimitRedis(key: string) {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 900); // 15 minutes
  }
  return count <= 100;
}
```

#### 2. Token Bucket Algorithm

```typescript
// Allow bursts but limit sustained rate
interface TokenBucket {
  tokens: number;
  lastRefill: number;
  capacity: number;
  refillRate: number;
}
```

#### 3. Tiered Rate Limits

```typescript
const RATE_LIMITS = {
  free: { max: 50, window: 15 },
  pro: { max: 200, window: 15 },
  enterprise: { max: 1000, window: 15 },
};
```

#### 4. Endpoint-Specific Limits

```typescript
const ENDPOINT_LIMITS = {
  "/api/auth/*": { max: 10, window: 5 }, // Strict for auth
  "/api/orders": { max: 50, window: 15 }, // Medium for orders
  "/api/products": { max: 200, window: 15 }, // Lenient for browse
};
```

## Testing

### Manual Testing

```bash
# Test rate limiting with curl
for i in {1..105}; do
  echo "Request $i"
  curl -X POST http://localhost:3000/api/example-rate-limited \
    -H "Content-Type: application/json" \
    -d '{"test": true}' \
    -i | grep -E "(HTTP|X-RateLimit|error)"
done
```

### Automated Testing

```typescript
describe("Rate Limiting", () => {
  it("should allow requests under limit", async () => {
    for (let i = 0; i < 50; i++) {
      const response = await fetch("/api/test");
      expect(response.status).toBe(200);
    }
  });

  it("should block after exceeding limit", async () => {
    // Make 100 requests
    for (let i = 0; i < 100; i++) {
      await fetch("/api/test");
    }

    // 101st should be blocked
    const response = await fetch("/api/test");
    expect(response.status).toBe(429);
  });

  it("should include rate limit headers", async () => {
    const response = await fetch("/api/test");
    expect(response.headers.get("X-RateLimit-Limit")).toBe("100");
    expect(response.headers.get("X-RateLimit-Remaining")).toBeDefined();
  });
});
```

## Maintenance

### Cleanup Old Records

```sql
-- Manual cleanup
SELECT cleanup_old_api_requests();

-- Or delete directly
DELETE FROM api_requests
WHERE request_time < NOW() - INTERVAL '24 hours';
```

### Reset User's Rate Limit

```sql
-- Clear all requests for a user
DELETE FROM api_requests
WHERE user_id = 'user-uuid-here';

-- Clear for specific IP
DELETE FROM api_requests
WHERE ip_address = '192.168.1.1';
```

### Disable Rate Limiting Temporarily

```typescript
// In lib/rate-limiter.ts
const RATE_LIMITING_ENABLED = process.env.RATE_LIMITING_ENABLED !== 'false';

export async function checkRateLimit(...) {
  if (!RATE_LIMITING_ENABLED) {
    return { allowed: true, ... };
  }
  // ... rest of function
}
```

## Troubleshooting

### Users Reporting False Rate Limits

**Check actual request count:**

```sql
SELECT COUNT(*) FROM api_requests
WHERE (user_id = 'xxx' OR ip_address = 'xxx')
  AND request_time > NOW() - INTERVAL '15 minutes';
```

**Solution:** If count < 100, clear their records:

```sql
DELETE FROM api_requests WHERE user_id = 'xxx';
```

### Shared IP Issues (Office/School)

Multiple users behind same IP might hit limit together.

**Solution:** Increase limit or implement authentication-based tracking only:

```typescript
// Only rate limit anonymous users
if (!userId) {
  const rateLimit = await checkRateLimit(null, ipAddress);
  // ... check limit
}
```

### Performance Issues

Too many database queries slowing down API.

**Solution:** Use Redis or in-memory cache:

```typescript
const cache = new Map<string, number>();

async function checkRateLimitCached(key: string) {
  const cached = cache.get(key);
  if (cached && cached < 100) return true;

  // Check database
  const count = await checkRateLimit(...);
  cache.set(key, count);
  return count < 100;
}
```

## Best Practices

1. **Always return rate limit headers** - Helps clients implement backoff
2. **Use appropriate limits per endpoint** - Auth stricter than browsing
3. **Monitor regularly** - Watch for abuse patterns
4. **Communicate limits** - Document in API docs
5. **Implement exponential backoff** - On client side
6. **Consider user tiers** - Premium users get higher limits
7. **Log rate limit violations** - Alert on suspicious patterns
8. **Test thoroughly** - Ensure limits work as expected

## Migration Steps

1. **Apply Database Migration**

   ```bash
   # In Supabase SQL Editor
   # Run: supabase/migrations/20251116000004_add_api_rate_limiting.sql
   ```

2. **Verify Table Created**

   ```sql
   SELECT * FROM api_requests LIMIT 1;
   ```

3. **Add to Test Endpoint**

   ```typescript
   // Try on a non-critical endpoint first
   export const GET = rateLimitedHandler(async (req) => {
     return NextResponse.json({ success: true });
   });
   ```

4. **Test Rate Limiting**

   ```bash
   # Make 105 requests, last 5 should fail
   for i in {1..105}; do curl http://localhost:3000/api/test; done
   ```

5. **Roll Out to Production Endpoints**
   - Start with public endpoints
   - Monitor for false positives
   - Gradually add to all endpoints

## Related Features

- [Login Attempt Limiter](./login-attempt-limiter.md) - Specific to login security
- [Forgot Password](./forgot-password-feature.md) - Protected by rate limiting
- Admin Dashboard - Monitor rate limits (future)

## FAQ

**Q: What happens if database is unavailable?**
A: System fails open - allows requests (availability over strict limiting).

**Q: Can users bypass by switching IPs?**
A: Yes, but most users don't have dynamic IPs. Consider device fingerprinting for critical endpoints.

**Q: Does this affect webhooks?**
A: Only if you add rate limiting to webhook endpoints. Typically don't rate limit webhooks from trusted sources.

**Q: How to exempt admin users?**
A: Check if user is admin before applying rate limit:

```typescript
if (isAdmin) return { allowed: true, ... };
```

**Q: What about mobile apps?**
A: Rate limit by user ID (after authentication) instead of IP.

**Q: Can I have different limits per user tier?**
A: Yes, query user's subscription level and apply appropriate limit.
