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
    image_urls: string[];
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
            {/* Product Image Gallery */}
            <div className="relative">
              <ProductImageGallery
                images={product.image_urls || []}
                productName={product.title}
              />

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
