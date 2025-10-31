// Middleware completely disabled for Vercel Edge Runtime compatibility
// Authentication is handled server-side in dashboard pages via getUser() calls

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Minimal middleware that does nothing - just passes through all requests
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// Empty matcher array means this middleware won't run on any routes
export const config = {
  matcher: [],
};
