"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { toLocaleString } from "@/lib/currency";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price_cents: number;
  image_urls: string[] | null;
  is_active: boolean;
  stock_qty: number | null;
  created_at: string;
}

interface ProductsListProps {
  products: Product[];
  storeId: string;
  currency: string;
}

export function ProductsList({
  products: initialProducts,
  storeId,
  currency,
}: ProductsListProps) {
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const sb = supabaseBrowser();

  const handleToggleActive = async (
    productId: string,
    currentStatus: boolean
  ) => {
    setLoading(true);
    const { error } = await sb
      .from("products")
      .update({ is_active: !currentStatus })
      .eq("id", productId);

    if (!error) {
      setProducts(
        products.map((p) =>
          p.id === productId ? { ...p, is_active: !currentStatus } : p
        )
      );
    }
    setLoading(false);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setLoading(true);
    const { error } = await sb.from("products").delete().eq("id", productId);

    if (!error) {
      setProducts(products.filter((p) => p.id !== productId));
    }
    setLoading(false);
  };

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <div className="text-6xl mb-4">📦</div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          No Products Yet
        </h2>
        <p className="text-gray-600 mb-6">
          Add your first product to start selling
        </p>
        <a
          href="/dashboard/products/new"
          className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all"
        >
          + Add Your First Product
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Product
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Price
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Stock
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    {product.image_urls?.[0] ? (
                      <img
                        src={product.image_urls[0]}
                        alt={product.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">
                        {product.title}
                      </p>
                      {product.description && (
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">
                    {toLocaleString(product.price_cents, currency)}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-gray-900">
                    {product.stock_qty !== null
                      ? product.stock_qty
                      : "Unlimited"}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() =>
                      handleToggleActive(product.id, product.is_active)
                    }
                    disabled={loading}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      product.is_active
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    } transition-colors disabled:opacity-50`}
                  >
                    {product.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <a
                      href={`/dashboard/products/${product.id}/edit`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit
                    </a>
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
