'use client';

import { useCart } from './CartProvider';
import { toLocaleString } from '@/lib/currency';

export function CartSummary({ currency }: { currency: string }) {
  const { items, updateQty, removeItem, subtotalCents } = useCart();

  if (!items.length) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <p className="text-gray-600 text-lg">Your cart is empty</p>
        <p className="text-gray-500 text-sm mt-2">Add some products to get started</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Order Summary</h2>
      
      <div className="space-y-4 mb-6">
        {items.map(item => (
          <div
            key={item.id}
            className="flex items-start justify-between py-4 border-b border-gray-100 last:border-0"
          >
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
              <p className="text-sm text-gray-600">
                {toLocaleString(item.priceCents, currency)} each
              </p>
            </div>

            <div className="flex items-center gap-3 ml-4">
              <div className="flex items-center bg-gray-100 rounded-lg">
                <button
                  onClick={() => updateQty(item.id, item.qty - 1)}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900 font-bold"
                >
                  −
                </button>
                <span className="w-10 text-center font-semibold text-gray-900">{item.qty}</span>
                <button
                  onClick={() => updateQty(item.id, item.qty + 1)}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900 font-bold"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-500 hover:text-red-700 font-bold text-xl"
                title="Remove item"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-semibold text-gray-900">
            {toLocaleString(subtotalCents, currency)}
          </span>
        </div>
        <div className="flex justify-between items-center text-xl font-bold text-gray-900 mt-4">
          <span>Total</span>
          <span>{toLocaleString(subtotalCents, currency)}</span>
        </div>
      </div>
    </div>
  );
}
