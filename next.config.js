/** @type {import('next').NextConfig} */

// Webpack Bundle Analyzer configuration
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig = {
  poweredByHeader: false,
  compress: true,

  // Optimize for modern browsers - reduces JavaScript bundle size
  swcMinify: true,
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Modern JavaScript target - reduces polyfills
  experimental: {
    modern: true,
    legacyBrowsers: false,
  },

  images: {
    formats: ["image/webp", "image/avif"],
    domains: ["dwxbvqvogdrmjnumjwzk.supabase.co"], // Add your Supabase storage domain
    // Enable image optimization
    minimumCacheTTL: 60,
  },

  webpack: (config, { isServer }) => {
    // Supabase client libs use some dynamic requires that trigger Webpack's
    // exprContextCritical warnings. They are safe here; silence them.
    config.module.exprContextCritical = false;

    // Optimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.razorpay.com https://www.googletagmanager.com https://vercel.live",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://vitals.vercel-insights.com https://ipapi.co https://www.google-analytics.com",
              "frame-src 'self' https://js.stripe.com https://checkout.razorpay.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/demo",
        destination: "/demo-bakery",
        permanent: false,
      },
    ];
  },
};

// Wrap with bundle analyzer
module.exports = withBundleAnalyzer(nextConfig);
