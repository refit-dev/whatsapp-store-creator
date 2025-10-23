'use client';

import { CartProvider } from "@/components/CartProvider";
import { ProductGrid } from "@/components/ProductGrid";
import { FloatingCartButton } from "@/components/FloatingCartButton";

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

export function StorefrontClient({ store, products, handle }: StorefrontClientProps) {
  return (
    <CartProvider>
      <main className="min-h-screen bg-gray-50">
        {/* Store Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-6">
            {store.banner_url && (
              <img
                src={store.banner_url}
                alt={store.name}
                className="w-full h-48 md:h-64 object-cover rounded-2xl mb-6 shadow-lg"
              />
            )}
            <div className="flex items-center gap-4">
              {store.logo_url && (
                <img
                  src={store.logo_url}
                  alt={`${store.name} logo`}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-lg object-cover"
                />
              )}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{store.name}</h1>
                <p className="text-gray-600 mt-1">Browse our products and order via WhatsApp</p>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🛍️</div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Coming Soon</h2>
              <p className="text-gray-600">This store is being set up. Check back soon for amazing products!</p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Our Products</h2>
                <p className="text-gray-600">Add items to your cart and checkout via WhatsApp</p>
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