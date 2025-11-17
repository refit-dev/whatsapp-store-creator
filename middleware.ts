// Middleware for CORS and security headers
// Authentication is handled server-side in dashboard pages via getUser() calls

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Allowed origins for CORS
const getAllowedOrigins = (): string[] => {
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  const productionDomain = "https://watzy.app";
  const productionWww = "https://www.watzy.app";

  // Base allowed origins
  const allowedOrigins = [productionDomain, productionWww];

  // Add APP_URL if it's set and not localhost in production
  if (appUrl && !appUrl.includes("localhost")) {
    allowedOrigins.push(appUrl);
  }

  // In development, allow localhost
  if (process.env.NODE_ENV === "development") {
    allowedOrigins.push("http://localhost:3000", "http://localhost:3001");
  }

  return allowedOrigins;
};

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowedOrigins = getAllowedOrigins();

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 200 });

    // Check if origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
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

  // Handle actual requests
  const response = NextResponse.next();

  // Set CORS headers if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
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

  // Add security headers (defense in depth)
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );

  return response;
}

// Apply middleware to API routes and upload endpoints
export const config = {
  matcher: ["/api/:path*", "/auth/:path*"],
};
