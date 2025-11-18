/**
 * Simple Cloudflare Worker example that proxies to the origin and adds caching + security headers.
 *
 * Deploy with Wrangler (fill in `wrangler.toml` account/zone/route and set `ORIGIN` var).
 * This is an optional edge proxy you can use to put Cloudflare in front of your Vercel origin.
 */

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  // Replace origin with configured var
  const ORIGIN = ORIGIN || "https://your-origin.example"; // replaced by wrangler var
  const originUrl = new URL(ORIGIN);
  originUrl.pathname = url.pathname;
  originUrl.search = url.search;

  // Build a new request to the origin
  const originRequest = new Request(originUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: "manual",
  });

  // Edge caching options: use Cache API
  const cache = caches.default;
  const cacheKey = new Request(originUrl.toString(), { method: "GET" });

  if (request.method === "GET") {
    // try cache first
    const cached = await cache.match(cacheKey);
    if (cached) {
      const resp = new Response(cached.body, cached);
      addSecurityHeaders(resp);
      return resp;
    }
  }

  // Forward request to origin
  const originResponse = await fetch(originRequest);

  // Clone response for caching
  const response = new Response(originResponse.body, {
    status: originResponse.status,
    statusText: originResponse.statusText,
    headers: originResponse.headers,
  });

  // Apply caching policy for successful GET responses
  if (request.method === "GET" && response.status === 200) {
    // You can customize cache TTL via Cache-Control header on origin or set here
    // Example: cache for 60 seconds at edge
    response.headers.set("Cache-Control", "public, max-age=60");
    eventualCachePut(cache, cacheKey, response.clone());
  }

  addSecurityHeaders(response);

  return response;
}

// async helper to put in cache without blocking the response
async function eventualCachePut(cache, key, response) {
  try {
    await cache.put(key, response);
  } catch (e) {
    // ignore cache errors
    console.warn("Cache put failed", e);
  }
}

function addSecurityHeaders(resp) {
  // Common security headers
  resp.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  resp.headers.set("X-Content-Type-Options", "nosniff");
  resp.headers.set("X-Frame-Options", "DENY");
  resp.headers.set("Referrer-Policy", "no-referrer-when-downgrade");
  resp.headers.set("Permissions-Policy", "geolocation=(), microphone=()");
  // CSP should be tailored to the app; keep minimal here
  resp.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );
}
