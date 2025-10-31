import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import type { Database } from "@/types/supabase";
import Link from "next/link";
import { ProductsList } from "@/components/ProductsList";
import { LogoutButton } from "@/components/LogoutButton";

export default async function ProductsPage() {
  const user = await getUser();
  if (!user) {
    redirect("/auth");
  }

  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  // Get user's store
  const { data: stores } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .limit(1);

  const store = stores?.[0];

  if (!store) {
    redirect("/dashboard");
  }

  // Get store's products
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Products</h1>
              <p className="text-gray-600 mt-1">Manage your store inventory</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Back to Dashboard
              </Link>
              <Link
                href="/dashboard/products/new"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                + Add Product
              </Link>
              <div className="border-l border-gray-200 pl-3">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>

        {/* Products List */}
        <ProductsList
          products={products || []}
          storeId={store.id}
          currency={store.currency || "USD"}
        />
      </div>
    </main>
  );
}
