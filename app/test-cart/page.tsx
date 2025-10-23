'use client';

import { CartProvider, useCart } from '@/components/CartProvider';

function CartTester() {
  const { items, addItem, clearCart, subtotalCents } = useCart();

  const testAddItem = () => {
    console.log('Testing cart - adding item');
    addItem({
      id: 'test-1',
      title: 'Test Product',
      priceCents: 1000,
    });
    alert('Item added! Check console and page for count');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Cart Test Page</h1>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <p>Cart Items: {items.length}</p>
        <p>Total Items: {items.reduce((sum, i) => sum + i.qty, 0)}</p>
        <p>Subtotal: ${(subtotalCents / 100).toFixed(2)}</p>
      </div>

      <div className="space-x-4">
        <button
          onClick={testAddItem}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Add Item
        </button>
        
        <button
          onClick={clearCart}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Clear Cart
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Cart Contents:</h2>
        {items.length === 0 ? (
          <p className="text-gray-500">Cart is empty</p>
        ) : (
          <ul className="space-y-2">
            {items.map(item => (
              <li key={item.id} className="p-2 bg-white border rounded">
                {item.title} - Qty: {item.qty} - ${(item.priceCents * item.qty / 100).toFixed(2)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function TestCartPage() {
  return (
    <CartProvider>
      <CartTester />
    </CartProvider>
  );
}