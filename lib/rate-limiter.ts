/**
 * API Rate Limiting Utility
 * Prevents spam and abuse by limiting requests per user/IP
 */

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/supabase";

const MAX_REQUESTS = 100;
const WINDOW_MINUTES = 15;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  limit: number;
}

/**
 * Check if a request should be allowed based on rate limits
 * @param userId - Authenticated user ID (if available)
 * @param ipAddress - Client IP address
 * @returns Rate limit result with allowed status and metadata
 */
export async function checkRateLimit(
  userId: string | null,
  ipAddress: string | null
): Promise<RateLimitResult> {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  try {
    // Calculate the time threshold
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - WINDOW_MINUTES);

    // Build query to count requests in the time window
    let query = supabase
      .from("api_requests")
      .select("id", { count: "exact", head: true })
      .gte("request_time", windowStart.toISOString());

    // Filter by user ID or IP address
    if (userId) {
      query = query.eq("user_id", userId);
    } else if (ipAddress) {
      query = query.eq("ip_address", ipAddress);
    } else {
      // No identifier available, allow request (fail open)
      return {
        allowed: true,
        remaining: MAX_REQUESTS,
        resetTime: new Date(Date.now() + WINDOW_MINUTES * 60 * 1000),
        limit: MAX_REQUESTS,
      };
    }

    const { count, error } = await query;

    if (error) {
      console.error("Error checking rate limit:", error);
      // Fail open - allow request if we can't check
      return {
        allowed: true,
        remaining: MAX_REQUESTS,
        resetTime: new Date(Date.now() + WINDOW_MINUTES * 60 * 1000),
        limit: MAX_REQUESTS,
      };
    }

    const requestCount = count || 0;
    const remaining = Math.max(0, MAX_REQUESTS - requestCount);
    const allowed = requestCount < MAX_REQUESTS;

    // Calculate reset time (15 minutes from now)
    const resetTime = new Date(Date.now() + WINDOW_MINUTES * 60 * 1000);

    return {
      allowed,
      remaining,
      resetTime,
      limit: MAX_REQUESTS,
    };
  } catch (error) {
    console.error("Error in checkRateLimit:", error);
    // Fail open
    return {
      allowed: true,
      remaining: MAX_REQUESTS,
      resetTime: new Date(Date.now() + WINDOW_MINUTES * 60 * 1000),
      limit: MAX_REQUESTS,
    };
  }
}

/**
 * Record an API request for rate limiting tracking
 * @param userId - Authenticated user ID (if available)
 * @param ipAddress - Client IP address
 * @param endpoint - API endpoint path
 * @param method - HTTP method
 * @param userAgent - User agent string
 * @param responseStatus - HTTP response status code
 */
export async function recordApiRequest(
  userId: string | null,
  ipAddress: string | null,
  endpoint: string,
  method: string,
  userAgent: string | null,
  responseStatus?: number
): Promise<void> {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  try {
    const { error } = await supabase.from("api_requests").insert({
      user_id: userId,
      ip_address: ipAddress,
      endpoint,
      method,
      user_agent: userAgent,
      response_status: responseStatus || null,
      request_time: new Date().toISOString(),
    });

    if (error) {
      console.error("Error recording API request:", error);
    }
  } catch (error) {
    console.error("Error in recordApiRequest:", error);
  }
}

/**
 * Get client IP address from request
 * Checks various headers in order of preference
 */
export function getClientIp(request: NextRequest): string | null {
  // Check various headers that might contain the real IP
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list, take the first
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to connection IP (may not be available in all environments)
  return request.headers.get("x-vercel-forwarded-for") || null;
}

/**
 * Rate limiting middleware for API routes
 * Use this in your API route handlers
 */
export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get user and IP
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id || null;
    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get("user-agent");
    const endpoint = request.nextUrl.pathname;
    const method = request.method;

    // Check rate limit
    const rateLimitResult = await checkRateLimit(userId, ipAddress);

    // Add rate limit headers to response
    const addRateLimitHeaders = (response: NextResponse) => {
      response.headers.set(
        "X-RateLimit-Limit",
        rateLimitResult.limit.toString()
      );
      response.headers.set(
        "X-RateLimit-Remaining",
        rateLimitResult.remaining.toString()
      );
      response.headers.set(
        "X-RateLimit-Reset",
        rateLimitResult.resetTime.toISOString()
      );
      return response;
    };

    // If rate limit exceeded, return 429
    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `Too many requests. Please try again in ${WINDOW_MINUTES} minutes.`,
          limit: rateLimitResult.limit,
          remaining: 0,
          resetTime: rateLimitResult.resetTime.toISOString(),
        },
        { status: 429 }
      );

      // Record the rejected request
      await recordApiRequest(
        userId,
        ipAddress,
        endpoint,
        method,
        userAgent,
        429
      );

      return addRateLimitHeaders(response);
    }

    // Execute the handler
    const response = await handler();

    // Record the request
    await recordApiRequest(
      userId,
      ipAddress,
      endpoint,
      method,
      userAgent,
      response.status
    );

    // Add rate limit headers
    return addRateLimitHeaders(response);
  } catch (error) {
    console.error("Error in rate limiting middleware:", error);
    // On error, allow the request to proceed
    return handler();
  }
}

/**
 * Helper to create a rate-limited API handler
 * Usage:
 * export const POST = rateLimitedHandler(async (request) => {
 *   // Your handler code
 *   return NextResponse.json({ success: true });
 * });
 */
export function rateLimitedHandler(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    return withRateLimit(request, () => handler(request));
  };
}
