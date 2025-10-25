import { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { StorefrontClient } from "./StorefrontClient";

interface Product {
  id: string;
  title: string;
  description: string;
  price_cents: number;
  image_urls: string[];
}

type StorePublicRow = {
  id: string;
  handle: string;
  name: string;
  logo_url: string | null;
  banner_url: string | null;
  currency: string;
  whatsapp_e164: string;
};

export async function generateMetadata({
  params,
}: {
  params: { handle: string };
}): Promise<Metadata> {
  const supabase = supabaseServer();
  const { data: store } = await supabase
    .from("store_public")
    .select("name")
    .eq("handle", params.handle)
    .single();

  return {
    title: store ? `${store.name} | WhatsApp Store` : "Store Not Found",
    description: store
      ? `Shop at ${store.name} - Order directly via WhatsApp`
      : "Store not found",
  };
}

export default async function StorefrontPage({
  params,
}: {
  params: { handle: string };
}) {
  const supabase = supabaseServer();

  const { data: store, error: storeError } = await supabase
    .from("store_public")
    .select("*")
    .eq("handle", params.handle)
    .single();

  if (storeError || !store) {
    console.error("Store fetch error:", storeError);
    return notFound();
  }

  const { data, error: productsError } = await supabase
    .from("products")
    .select("id, title, description, price_cents, image_urls")
    .eq("store_id", store.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (productsError) {
    console.error("Products fetch error:", productsError);
  }

  const products: Product[] = data || [];

  // Create a clean store object with only serializable properties
  const cleanStore = {
    id: store.id,
    handle: store.handle,
    name: store.name,
    logo_url: store.logo_url,
    banner_url: store.banner_url,
    currency: store.currency,
    whatsapp_e164: store.whatsapp_e164,
  };

  // Pass data to client component
  return (
    <StorefrontClient
      store={cleanStore}
      products={products}
      handle={params.handle}
    />
  );
}
