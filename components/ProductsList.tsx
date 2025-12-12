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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const sb = supabaseBrowser();

  const toggleSelect = (productId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  };

  const bulkSetActive = async (isActive: boolean) => {
    if (selectedIds.size === 0) return;
    setLoading(true);
    const ids = Array.from(selectedIds);
    const { error } = await sb
      .from("products")
      .update({ is_active: isActive })
      .in("id", ids);

    if (!error) {
      setProducts((prev) =>
        prev.map((p) =>
          selectedIds.has(p.id) ? { ...p, is_active: isActive } : p
        )
      );
      setSelectedIds(new Set());
    }
    setLoading(false);
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (
      !confirm(
        `Delete ${selectedIds.size} product${
          selectedIds.size === 1 ? "" : "s"
        }? This cannot be undone.`
      )
    )
      return;
    setLoading(true);
    const ids = Array.from(selectedIds);
    const { error } = await sb.from("products").delete().in("id", ids);
    if (!error) {
      setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
    }
    setLoading(false);
  };

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

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

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
      {products.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <input
              type="text"
              placeholder="Search by product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={toggleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {selectedIds.size === products.length
              ? "Clear selection"
              : "Select all"}
          </button>
          <div className="text-sm text-gray-600">
            {selectedIds.size} selected
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => bulkSetActive(true)}
              disabled={loading || selectedIds.size === 0}
              className="px-3 py-1.5 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200 disabled:opacity-50 disabled:hover:bg-green-100 transition-colors"
            >
              Make Active
            </button>
            <button
              onClick={() => bulkSetActive(false)}
              disabled={loading || selectedIds.size === 0}
              className="px-3 py-1.5 text-sm bg-amber-100 text-amber-800 rounded hover:bg-amber-200 disabled:opacity-50 disabled:hover:bg-amber-100 transition-colors"
            >
              Make Inactive
            </button>
            <button
              onClick={bulkDelete}
              disabled={loading || selectedIds.size === 0}
              className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 disabled:hover:bg-red-100 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-4">
                <input
                  type="checkbox"
                  aria-label="Select all products"
                  checked={
                    products.length > 0 && selectedIds.size === products.length
                  }
                  onChange={toggleSelectAll}
                />
              </th>
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
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    aria-label={`Select ${product.title}`}
                    checked={selectedIds.has(product.id)}
                    onChange={() => toggleSelect(product.id)}
                  />
                </td>
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
