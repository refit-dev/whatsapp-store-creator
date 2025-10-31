import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simplified middleware for Vercel Edge Runtime compatibility
// Authentication is handled server-side in dashboard pages
export function middleware(request: NextRequest) {
  // Just pass through all requests
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
