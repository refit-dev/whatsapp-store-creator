"use client";

import { useState } from "react";
import { CartProvider } from "@/components/CartProvider";
import { ProductGrid } from "@/components/ProductGrid";
import { FloatingCartButton } from "@/components/FloatingCartButton";
import Link from "next/link";

interface Product {
  id: string;
  title: string;
  description: string;
  price_cents: number;
  image_urls: string[];
}

interface StorePublicRow {
  id: string;
  handle: string;
  name: string;
  logo_url: string | null;
  banner_url: string | null;
  currency: string;
  whatsapp_e164: string;
}

interface StorefrontClientProps {
  store: StorePublicRow;
  products: Product[];
  handle: string;
}

export function StorefrontClient({
  store,
  products,
  handle,
}: StorefrontClientProps) {
  const [search, setSearch] = useState("");

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(search.trim().toLowerCase())
  );

  // Prepare WhatsApp contact link for general queries
  const whatsappMessage =
    "Hi! I have a question about your store on Watzy. Can you help me?";
  const whatsappNumber = store.whatsapp_e164?.replace(/[^\d+]/g, "") || "";
  const whatsappLink =
    whatsappNumber && encodeURIComponent
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
          whatsappMessage
        )}`
      : null;

  return (
    <CartProvider storeHandle={handle}>
      <main className="min-h-screen bg-gray-50">
        {/* Store Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
            {store.banner_url && (
              <img
                src={store.banner_url}
                alt={store.name}
                className="w-full h-40 sm:h-48 md:h-64 object-cover rounded-xl sm:rounded-2xl mb-5 sm:mb-6 shadow-lg"
              />
            )}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-center sm:text-left">
              {store.logo_url && (
                <img
                  src={store.logo_url}
                  alt={`${store.name} logo`}
                  className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-lg object-cover mx-auto sm:mx-0"
                />
              )}
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                  {store.name}
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Browse our products and order via WhatsApp
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {products.length === 0 ? (
            <div className="text-center py-16 sm:py-20">
              <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 11H6L5 9z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Coming Soon
              </h2>
              <p className="text-gray-600">
                This store is being set up. Check back soon for amazing
                products!
              </p>
            </div>
          ) : (
            <>
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Our Products
              </h2>
              <p className="text-gray-600">
                Add items to your cart and checkout via WhatsApp
              </p>
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products by name..."
                  className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <div className="text-sm text-gray-600">
                  Showing {filteredProducts.length} of {products.length} products
                </div>
              </div>
            </div>
            <ProductGrid
              products={filteredProducts}
              currency={store.currency}
            />
            </>
          )}
        </div>

        {/* General queries CTA */}
        {whatsappLink && (
          <div className="max-w-6xl mx-auto px-4 pb-24 sm:pb-28">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Need help before ordering?
                </p>
                <p className="text-sm text-gray-600">
                  Chat with the store owner directly on WhatsApp for any general
                  queries.
                </p>
              </div>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg shadow-md transition-all"
              >
                Chat on WhatsApp
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 ml-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.52 3.48A11.8 11.8 0 0012 0C5.37 0 0 5.38 0 12a11.9 11.9 0 001.6 6L0 24l6.3-1.64A11.9 11.9 0 0012 24c6.63 0 12-5.38 12-12 0-3.2-1.25-6.2-3.48-8.52zM12 21.8a9.8 9.8 0 01-5-1.36l-.36-.21-3.74.97.99-3.65-.24-.37A9.8 9.8 0 012.2 12c0-5.4 4.4-9.8 9.8-9.8 2.63 0 5.1 1.02 6.96 2.88A9.8 9.8 0 0121.8 12c0 5.4-4.4 9.8-9.8 9.8zm5.46-7.33c-.3-.15-1.77-.87-2.04-.97-.27-.1-.46-.15-.66.15-.2.3-.76.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.28-.47-2.44-1.5-.9-.8-1.52-1.8-1.7-2.1-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.9-2.2-.24-.58-.48-.5-.66-.51h-.56c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.48 0 1.46 1.08 2.87 1.23 3.07.15.2 2.12 3.23 5.14 4.53.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.12-.28-.2-.58-.35z" />
                </svg>
              </a>
            </div>
          </div>
        )}

        {/* Floating Cart Button */}
        <FloatingCartButton handle={handle} />
      </main>
    </CartProvider>
  );
}
