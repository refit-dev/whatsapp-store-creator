import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import type { Database } from "@/types/supabase";
import { ProductFormWithUpload } from "@/components/ProductFormWithUpload";
import Link from "next/link";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUser();
  if (!user) {
    redirect("/auth");
  }

  const supabase = createServerComponentClient<Database>({ cookies });

  // Get user's store
  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!store) {
    redirect("/dashboard");
  }

  // Get the product to edit
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .eq("store_id", store.id)
    .single();

  if (error || !product) {
    // Product not found or doesn't belong to this store
    redirect("/dashboard/products");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto p-6">
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Products
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Edit Product
            </h1>
            <p className="text-gray-600">Update your product details</p>
          </div>

          <ProductFormWithUpload
            storeId={store.id}
            currency={store.currency || "USD"}
            product={{
              id: product.id,
              title: product.title,
              description: product.description,
              price_cents: product.price_cents,
              image_urls: product.image_urls,
              is_active: product.is_active,
              stock_qty: product.stock_qty,
            }}
          />
        </div>
      </div>
    </main>
  );
}
