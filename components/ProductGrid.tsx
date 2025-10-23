'use client';

import { useCart } from './CartProvider';
import { toLocaleString } from '@/lib/currency';

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
  const { addItem, items } = useCart();

  const handleAddToCart = (product: any) => {
    console.log('Adding to cart:', product.title);
    addItem({
      id: product.id,
      title: product.title,
      priceCents: product.price_cents,
    });
  };

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 italic">No products available yet. Please check back soon.</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map(product => {
        const cartItem = items.find(i => i.id === product.id);

        return (
          <div
            key={product.id}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow group"
          >
            {/* Product Image */}
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              {product.image_urls?.[0] ? (
                <img
                  src={product.image_urls[0]}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              
              {/* Cart Badge */}
              {cartItem && cartItem.qty > 0 && (
                <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg animate-bounce">
                  {cartItem.qty}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-5">
              <h3 className="font-bold text-lg mb-2 text-gray-900 line-clamp-1">{product.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                {product.description}
              </p>
              
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-gray-900">
                  {toLocaleString(product.price_cents, currency)}
                </p>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg active:scale-95 transform"
                >
                  {cartItem && cartItem.qty > 0 ? `Add More (${cartItem.qty})` : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}