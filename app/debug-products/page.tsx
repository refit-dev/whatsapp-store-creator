import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProductDebugPage() {
  const supabase = supabaseServer();

  // Get the demo-bakery store
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("*")
    .eq("handle", "demo-bakery")
    .single();

  if (storeError || !store) {
    return <div>Store not found: {storeError?.message}</div>;
  }

  // Get products for this store
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .eq("is_active", true);

  if (productsError) {
    return <div>Error loading products: {productsError.message}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Debug: Demo Bakery Products</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Store Information</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(store, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Products ({products?.length || 0})
          </h2>
          {products && products.length > 0 ? (
            <div className="space-y-6">
              {products.map((product, index) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">
                    {product.title}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p>
                        <strong>Description:</strong> {product.description}
                      </p>
                      <p>
                        <strong>Price:</strong> ₹
                        {(product.price_cents / 100).toFixed(2)}
                      </p>
                      <p>
                        <strong>Stock:</strong> {product.stock_qty}
                      </p>
                      <p>
                        <strong>Active:</strong>{" "}
                        {product.is_active ? "Yes" : "No"}
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>Image URLs:</strong>
                      </p>
                      <div className="mt-2">
                        {product.image_urls && product.image_urls.length > 0 ? (
                          <>
                            <div className="text-sm bg-gray-100 p-2 rounded mb-2">
                              {JSON.stringify(product.image_urls)}
                            </div>
                            {product.image_urls[0] && (
                              <div className="w-32 h-32 bg-gray-200 rounded overflow-hidden">
                                <img
                                  src={product.image_urls[0]}
                                  alt={product.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-gray-500 italic">No images</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 italic">No products found</div>
          )}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Fix Instructions
          </h3>
          <p className="text-blue-700 text-sm">
            If images are not loading, you can update them by going to the
            dashboard and editing each product, or by running the SQL script in
            the Supabase SQL editor.
          </p>
        </div>
      </div>
    </div>
  );
}
