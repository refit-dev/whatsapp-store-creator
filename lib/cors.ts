/**
 * CORS (Cross-Origin Resource Sharing) Configuration
 *
 * This module provides utilities for handling CORS in API routes.
 * Only requests from allowed origins are permitted to access the API.
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Get the list of allowed origins for CORS
 */
export function getAllowedOrigins(): string[] {
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  const productionDomain = "https://watzy.app";
  const productionWww = "https://www.watzy.app";

  // Base allowed origins (production)
  const allowedOrigins = [productionDomain, productionWww];

  // Add APP_URL if it's set and not localhost in production
  if (appUrl && !appUrl.includes("localhost")) {
    allowedOrigins.push(appUrl);
  }

  // In development, allow localhost
  if (process.env.NODE_ENV === "development") {
    allowedOrigins.push(
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001"
    );
  }

  return allowedOrigins;
}

/**
 * Check if the origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) {
    // Same-origin requests don't have an Origin header
    return true;
  }

  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
}

/**
 * Set CORS headers on a response
 */
export function setCorsHeaders(
  response: NextResponse,
  origin: string | null
): NextResponse {
  if (origin && isOriginAllowed(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
  }

  return response;
}

/**
 * Handle CORS preflight request (OPTIONS)
 */
export function handleCorsPreflightRequest(
  request: NextRequest
): NextResponse | null {
  if (request.method !== "OPTIONS") {
    return null;
  }

  const origin = request.headers.get("origin");

  if (!isOriginAllowed(origin)) {
    return new NextResponse(null, {
      status: 403,
      statusText: "Forbidden - Origin not allowed",
    });
  }

  const response = new NextResponse(null, { status: 200 });

  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
    response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours
  }

  return response;
}

/**
 * Validate CORS for an API request
 * Returns an error response if the origin is not allowed
 */
export function validateCorsOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");

  // Same-origin requests are always allowed
  if (!origin) {
    return null;
  }

  // Check if origin is allowed
  if (!isOriginAllowed(origin)) {
    console.warn(`CORS blocked request from origin: ${origin}`);
    return NextResponse.json(
      {
        error:
          "CORS policy: This origin is not allowed to access this resource",
        code: "ORIGIN_NOT_ALLOWED",
      },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Wrapper for API routes with automatic CORS handling
 *
 * Usage:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   return withCors(request, async (req) => {
 *     // Your API logic here
 *     return NextResponse.json({ success: true });
 *   });
 * }
 * ```
 */
export async function withCors(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Handle preflight
  const preflightResponse = handleCorsPreflightRequest(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  // Validate origin
  const corsError = validateCorsOrigin(request);
  if (corsError) {
    return corsError;
  }

  // Execute handler
  const response = await handler(request);

  // Add CORS headers to response
  const origin = request.headers.get("origin");
  return setCorsHeaders(response, origin);
}

/**
 * CORS configuration for specific API routes
 */
export const CorsConfig = {
  /**
   * Public API routes that allow cross-origin requests
   * These are typically read-only endpoints or webhooks
   */
  publicRoutes: [
    "/api/webhook/stripe",
    "/api/webhook/razorpay",
    "/api/webhook/whatsapp",
  ],

  /**
   * Protected API routes that require authentication and CORS validation
   * These handle sensitive operations
   */
  protectedRoutes: [
    "/api/upload",
    "/api/store/*",
    "/api/subscription/*",
    "/api/payment-link",
    "/api/contact",
  ],
};

/**
 * Check if a route is public (allows all origins for webhooks)
 */
export function isPublicRoute(pathname: string): boolean {
  return CorsConfig.publicRoutes.some((route) => {
    if (route.includes("*")) {
      const pattern = route.replace("*", ".*");
      return new RegExp(`^${pattern}$`).test(pathname);
    }
    return pathname === route;
  });
}
