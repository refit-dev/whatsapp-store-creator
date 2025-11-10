import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/"],
      disallow: [
        "/dashboard/*",
        "/api/*",
        "/auth/callback",
        "/debug*",
        "/test-*",
        "/simple-orders",
      ],
    },
    sitemap: `${
      process.env.APP_URL || "https://yourapp.vercel.app"
    }/sitemap.xml`,
  };
}
