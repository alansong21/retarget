'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  url?: string;
  store?: 'Target' | 'Trader Joes';
  quantity?: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: { [key: string]: CartItem };
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<{ [key: string]: CartItem }>({});

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, quantity: number = 1) => {
    setItems(prev => {
      const existingItem = prev[product.id];
      return {
        ...prev,
        [product.id]: {
          ...product,
          quantity: (existingItem?.quantity || 0) + quantity,
        },
      };
    });
  };

  const removeItem = (productId: string) => {
    setItems(prev => {
      const newItems = { ...prev };
      delete newItems[productId];
      return newItems;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        quantity,
      },
    }));
  };

  const clearCart = () => {
    setItems({});
  };

  const getTotalItems = () => {
    return Object.values(items).reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return Object.values(items).reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
