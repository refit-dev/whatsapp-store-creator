import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Simple auth check for dashboard routes
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    // Check for Supabase auth token in cookies
    const token = req.cookies.get("sb-iazdsuodmyymclqltenc-auth-token");

    if (!token || !token.value) {
      const redirectUrl = new URL("/auth", req.url);
      redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
