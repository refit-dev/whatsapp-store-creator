# Cloudflare Setup and Worker CDN (Optional)

This document explains how to add Cloudflare as an extra layer of security, DDoS protection and CDN in front of your existing deployment. The repository includes an example Cloudflare Worker and a sample `wrangler.toml` to get you started.

Important: You can't "install" Cloudflare like a library. Cloudflare is a network/service. The files included here are a convenience to deploy an optional Worker on Cloudflare's edge that proxies and caches responses from your origin (for example your Vercel deployment).

## What is included

- `cloudflare/wrangler.toml` — example Wrangler configuration; replace placeholders with your Cloudflare values.
- `cloudflare/worker/index.js` — an example Worker that proxies requests to `ORIGIN` and adds caching + security headers.

## Quick steps

1. Create or login to a Cloudflare account: https://dash.cloudflare.com/
2. Add your site (if you want Cloudflare DNS and proxying). Change your domain NS to Cloudflare's nameservers.
3. In the Cloudflare dashboard enable the proxy (orange cloud) for the DNS records you want Cloudflare to handle.
4. Configure TLS to Full (strict) and enable TLS 1.3 in the dashboard (Cloudflare supports TLS 1.3 by default).
5. Enable the Web Application Firewall (WAF) and recommended security rules for DDoS protections.
6. Optional: Create a Worker from the UI or deploy via Wrangler.

## Deploying the example Worker via Wrangler

1. Install Wrangler (if you don't have it):

```bash
npm install -g wrangler
# or
pnpm add -g wrangler
```

2. Copy and update `cloudflare/wrangler.toml` with your `account_id`, `zone_id`, `route` (if you want to attach to a route), and set `vars.ORIGIN` to your origin URL (e.g., `https://my-app.vercel.app`).

3. From the repository root run:

```bash
cd cloudflare/worker
wrangler publish --env production
```

4. Verify the Worker is serving traffic and respecting caching headers.

## Recommendations

- Use Cloudflare's orange-cloud (proxy) only for the hostnames you want Cloudflare to protect and cache.
- Configure page rules and Cache TTLs to suit your content. For dynamic API responses, prefer short TTLs or bypass cache.
- Keep origin TLS strict (Full strict) and ensure your origin supports HTTPS.
- Use Cloudflare's WAF, Rate Limiting and Bot Management features for additional DDoS protection.

## Notes and Limitations

- This Worker is a lightweight proxy and not a full-featured CDN configuration. It demonstrates caching and security headers.
- If you're deploying to Vercel and using Vercel's CDN, you may prefer to enable Cloudflare only for DNS and WAF, not as a reverse proxy in front of Vercel.
- Do not forget to whitelist Cloudflare IPs at any origin firewalls if you restrict inbound traffic.

If you'd like, I can:

- Add a deployment script for Wrangler to `package.json` (example),
- Add an Environment-specific Worker that only caches static assets,
- Or create a minimal Cloudflare Pages configuration if you'd rather deploy the entire app to Cloudflare.
