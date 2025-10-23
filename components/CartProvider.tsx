'use client';

import { createContext, useContext, useState, useEffect } from 'react';

type CartItem = {
  id: string;
  title: string;
  priceCents: number;
  qty: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'qty'>) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  subtotalCents: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load cart:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, mounted]);

  const addItem = (item: Omit<CartItem, 'qty'>) => {
    console.log('Adding to cart:', item.title);
    setItems(currentItems => {
      const existing = currentItems.find(i => i.id === item.id);
      if (existing) {
        return currentItems.map(i =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...currentItems, { ...item, qty: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setItems(currentItems => currentItems.filter(i => i.id !== id));
  };

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) {
      removeItem(id);
      return;
    }
    setItems(currentItems =>
      currentItems.map(i => (i.id === id ? { ...i, qty } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotalCents = items.reduce(
    (sum, item) => sum + item.priceCents * item.qty,
    0
  );

  return (
    <CartContext.Provider 
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        subtotalCents,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}