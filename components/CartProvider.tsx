"use client";

import { createContext, useContext, useState, useEffect } from "react";

type CartItem = {
  id: string;
  title: string;
  priceCents: number;
  qty: number;
  storeHandle: string; // Add store handle to cart item
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  subtotalCents: number;
  storeHandle: string;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({
  children,
  storeHandle,
}: {
  children: React.ReactNode;
  storeHandle: string;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Use store-specific localStorage key
  const cartKey = `cart_${storeHandle}`;

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(cartKey);
    if (saved) {
      try {
        const parsedItems = JSON.parse(saved);
        // Filter out items that don't belong to this store
        const storeItems = parsedItems.filter(
          (item: CartItem) => item.storeHandle === storeHandle
        );
        setItems(storeItems);
      } catch (e) {
        console.error("Failed to load cart:", e);
      }
    }
  }, [cartKey, storeHandle]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(cartKey, JSON.stringify(items));
    }
  }, [items, mounted, cartKey]);

  const addItem = (item: Omit<CartItem, "qty">) => {
    console.log("Adding to cart:", item.title, "for store:", storeHandle);

    // Ensure item has storeHandle
    const itemWithStore = { ...item, storeHandle };

    setItems((currentItems) => {
      const existing = currentItems.find((i) => i.id === item.id);
      if (existing) {
        return currentItems.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...currentItems, { ...itemWithStore, qty: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setItems((currentItems) => currentItems.filter((i) => i.id !== id));
  };

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) {
      removeItem(id);
      return;
    }
    setItems((currentItems) =>
      currentItems.map((i) => (i.id === id ? { ...i, qty } : i))
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
        storeHandle,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
