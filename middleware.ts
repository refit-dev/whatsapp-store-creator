// Middleware disabled for Vercel Edge Runtime compatibility
// Authentication is handled client-side in React components

export function middleware() {
  // No-op middleware - just pass through all requests
  return;
}

export const config = {
  matcher: [],
};
