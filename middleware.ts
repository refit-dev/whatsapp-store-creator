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

  // Force HTTPS in production
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") !== "https"
  ) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 301); // Permanent redirect
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

  // Add comprehensive security headers
  response.headers.set("X-DNS-Prefetch-Control", "on");

  // HSTS - Force HTTPS for 1 year, include subdomains, allow preloading
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  // Prevent clickjacking attacks
  response.headers.set("X-Frame-Options", "SAMEORIGIN");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Enable XSS protection in older browsers
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy (CSP)
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://vercel.live",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://vercel.live wss://*.supabase.co",
      "frame-src 'self' https://vercel.live",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ].join("; ")
  );

  // Permissions Policy (formerly Feature Policy)
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  return response;
}

// Apply middleware to API routes and upload endpoints
export const config = {
  matcher: ["/api/:path*", "/auth/:path*"],
};
