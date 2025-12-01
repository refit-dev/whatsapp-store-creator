"use client";

import { useCart } from "./CartProvider";
import { toLocaleString } from "@/lib/currency";
import { ProductImageGallery } from "@/components/ProductImageGallery";

export function ProductGrid({
  products,
  currency,
}: {
  products: Array<{
    id: string;
    title: string;
    description: string;
    price_cents: number;
    image_urls: string[] | null;
    video_url?: string | null;
  }>;
  currency: string;
}) {
  const { addItem, items, storeHandle } = useCart();

  const handleAddToCart = (product: any) => {
    console.log("Adding to cart:", product.title);
    addItem({
      id: product.id,
      title: product.title,
      priceCents: product.price_cents,
      storeHandle: storeHandle,
    });
  };

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 italic">
          No products available yet. Please check back soon.
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
      {products.map((product) => {
        const cartItem = items.find((i) => i.id === product.id);

        return (
          <div
            key={product.id}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow group h-full flex flex-col"
          >
            {/* Product Image/Video */}
            <div className="relative">
              {product.image_urls && product.image_urls.length > 0 ? (
                <ProductImageGallery
                  images={product.image_urls}
                  productName={product.title}
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center border-b border-gray-200">
                  <div className="text-center p-6">
                    <div className="w-16 h-16 mx-auto mb-3 bg-white rounded-full flex items-center justify-center shadow-md">
                      <svg
                        className="w-8 h-8 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    </div>
                    <p className="text-base font-semibold text-gray-800 line-clamp-2">
                      {product.title}
                    </p>
                  </div>
                </div>
              )}

              {/* Cart Badge */}
              {cartItem && cartItem.qty > 0 && (
                <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg animate-bounce z-10">
                  {cartItem.qty}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-3 md:p-5">
              <h3 className="font-bold text-base md:text-lg mb-1 md:mb-2 text-gray-900 line-clamp-1">
                {product.title}
              </h3>
              <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2 min-h-[32px] md:min-h-[40px]">
                {product.description}
              </p>

              {/* Video Link */}
              {product.video_url && (
                <a
                  href={product.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs md:text-sm font-medium mb-3"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                  Watch Video
                </a>
              )}

              <div className="flex items-center justify-between gap-2 md:gap-3">
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {toLocaleString(product.price_cents, currency)}
                </p>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-2 md:px-5 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg active:scale-95 transform touch-target whitespace-nowrap"
                >
                  {cartItem && cartItem.qty > 0
                    ? `Add More (${cartItem.qty})`
                    : "Add to Cart"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
