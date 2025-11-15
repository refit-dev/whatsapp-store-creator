import { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { StorefrontClient } from "./StorefrontClient";

// Force dynamic rendering - no caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  // Force no caching for debugging
  const supabase = supabaseServer();

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select(
      "id, handle, name, logo_url, banner_url, currency, whatsapp_e164, is_active"
    )
    .eq("handle", params.handle)
    .single();

  // Debug logging - remove after debugging
  console.log("=== STORE DEBUG ===");
  console.log("Handle requested:", params.handle);
  console.log("Store data received:", store);
  console.log("Store error:", storeError);
  console.log("===================");

  if (storeError || !store) {
    console.error("Store fetch error:", storeError);
    return notFound();
  }

  // Check if store is inactive
  if (store.is_active === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Store Temporarily Closed
          </h1>
          <p className="text-gray-600 mb-6">
            <strong>{store.name}</strong> is currently taking a break. Please
            check back later!
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              💡 <strong>Tip:</strong> Contact the store owner directly if you
              need urgent assistance.
            </p>
          </div>
        </div>
      </div>
    );
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
    is_active: store.is_active,
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
