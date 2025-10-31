import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Simple auth check for dashboard routes
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    try {
      // Get user from session
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        const redirectUrl = new URL("/auth", req.url);
        redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
    } catch (e) {
      // On any auth error, redirect to sign in
      const redirectUrl = new URL("/auth", req.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
