import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import type { Database } from "@/types/supabase";
import { ProductForm } from "@/components/ProductForm";

export default async function NewProductPage() {
  const user = await getUser();
  if (!user) {
    redirect("/auth");
  }

  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
  
  const { data: stores } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .limit(1);

  const store = stores?.[0];
  
  if (!store) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Product</h1>
            <p className="text-gray-600">Add a new product to your store</p>
          </div>

          <ProductForm storeId={store.id} currency={store.currency || 'USD'} />
        </div>
      </div>
    </main>
  );
}