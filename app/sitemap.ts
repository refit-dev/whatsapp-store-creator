import { createServerClient } from "@/lib/db";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServerClient();

  const { data: stores } = await supabase.from("store_public").select("handle");

  const baseUrl = process.env.APP_URL || "https://yourapp.vercel.app";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    ...(stores || []).map((store) => ({
      url: `${baseUrl}/${store.handle}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
