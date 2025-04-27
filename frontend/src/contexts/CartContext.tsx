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
  getSubtotal: () => number;
  getDeliveryFee: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<{ [key: string]: CartItem }>({});
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart));
        } catch (e) {
          console.error('Error parsing cart from localStorage:', e);
          localStorage.removeItem('cart');
        }
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    // Only save if items have actually changed
    const currentCart = localStorage.getItem('cart');
    const newCart = JSON.stringify(items);
    if (currentCart !== newCart) {
      localStorage.setItem('cart', newCart);
    }
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
    localStorage.removeItem('cart');
  };

  const getTotalItems = () => {
    return Object.values(items).reduce((sum, item) => sum + item.quantity, 0);
  };

  const getSubtotal = () => {
    return Object.values(items).reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  };

  const getDeliveryFee = () => {
    return getSubtotal() * 0.15; // 15% delivery fee
  };

  const getTotalPrice = () => {
    return getSubtotal() + getDeliveryFee();
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
        getSubtotal,
        getDeliveryFee,
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
