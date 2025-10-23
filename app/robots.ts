import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/auth", "/[handle]"],
      disallow: ["/dashboard", "/api"],
    },
    sitemap: `${
      process.env.APP_URL || "https://yourapp.vercel.app"
    }/sitemap.xml`,
  };
}
