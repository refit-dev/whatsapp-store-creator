import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  try {
    // Refresh the session if it exists
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // If there's a JWT error (user doesn't exist), clear the session
    if (error && error.message.includes('User from sub claim in JWT does not exist')) {
      await supabase.auth.signOut();
      const redirectUrl = new URL('/auth', req.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Require auth for dashboard routes
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      if (!session) {
        const redirectUrl = new URL('/auth', req.url);
        redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }
  } catch (e) {
    // On any auth error, redirect to sign in for dashboard routes
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      const redirectUrl = new URL('/auth', req.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/callback',
  ],
};