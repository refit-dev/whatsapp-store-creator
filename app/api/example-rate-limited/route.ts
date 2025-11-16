/**
 * Example API Route with Rate Limiting
 *
 * This demonstrates how to add rate limiting to any API endpoint
 * Copy this pattern to protect your API routes from spam/abuse
 */

import { NextRequest, NextResponse } from "next/server";
import { rateLimitedHandler } from "@/lib/rate-limiter";

// Method 1: Using rateLimitedHandler wrapper (recommended)
export const POST = rateLimitedHandler(async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Your API logic here
    // This code only runs if rate limit is not exceeded

    return NextResponse.json({
      success: true,
      message: "Request processed successfully",
      data: body,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
});

export const GET = rateLimitedHandler(async (request: NextRequest) => {
  // Example GET endpoint with rate limiting
  return NextResponse.json({
    success: true,
    message: "This endpoint is rate limited",
    info: "Maximum 100 requests per 15 minutes",
  });
});

/*
 * Alternative Method 2: Manual rate limit check
 * Use this if you need more control over the rate limiting logic
 *
 * import { withRateLimit } from "@/lib/rate-limiter";
 *
 * export async function POST(request: NextRequest) {
 *   return withRateLimit(request, async () => {
 *     // Your API logic here
 *     return NextResponse.json({ success: true });
 *   });
 * }
 */

/*
 * Alternative Method 3: Conditional rate limiting
 * Apply rate limiting only to specific conditions
 *
 * import { checkRateLimit, recordApiRequest, getClientIp } from "@/lib/rate-limiter";
 *
 * export async function POST(request: NextRequest) {
 *   // Only rate limit non-authenticated users
 *   const { data: { user } } = await supabase.auth.getUser();
 *
 *   if (!user) {
 *     const ipAddress = getClientIp(request);
 *     const rateLimit = await checkRateLimit(null, ipAddress);
 *
 *     if (!rateLimit.allowed) {
 *       return NextResponse.json(
 *         { error: "Rate limit exceeded" },
 *         { status: 429 }
 *       );
 *     }
 *   }
 *
 *   // Process request
 *   const response = NextResponse.json({ success: true });
 *
 *   // Record the request
 *   await recordApiRequest(
 *     user?.id || null,
 *     getClientIp(request),
 *     request.nextUrl.pathname,
 *     request.method,
 *     request.headers.get("user-agent"),
 *     200
 *   );
 *
 *   return response;
 * }
 */
