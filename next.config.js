/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Supabase client libs use some dynamic requires that trigger Webpack's
    // exprContextCritical warnings. They are safe here; silence them.
    config.module.exprContextCritical = false;
    return config;
  },
};

module.exports = nextConfig;
