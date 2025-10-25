/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/webp", "image/avif"],
    domains: ["dwxbvqvogdrmjnumjwzk.supabase.co"], // Add your Supabase storage domain
  },
  webpack: (config) => {
    // Supabase client libs use some dynamic requires that trigger Webpack's
    // exprContextCritical warnings. They are safe here; silence them.
    config.module.exprContextCritical = false;
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
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
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

module.exports = nextConfig;
