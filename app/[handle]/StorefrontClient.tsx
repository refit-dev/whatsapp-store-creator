"use client";

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
  return (
    <CartProvider storeHandle={handle}>
      <main className="min-h-screen bg-gray-50">
        {/* Store Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
            {/* Return to Home Link */}
            <div className="mb-3 sm:mb-4">
              <Link
                href="/"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium text-sm sm:text-base"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span className="leading-none">&lt; Back to Home</span>
              </Link>
            </div>

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
              </div>
              <ProductGrid products={products} currency={store.currency} />
            </>
          )}
        </div>

        {/* Floating Cart Button */}
        <FloatingCartButton handle={handle} />
      </main>
    </CartProvider>
  );
}
