'use client';

import { useState } from 'react';
import { FaShoppingCart, FaTimes, FaPlus, FaMinus } from 'react-icons/fa';
import { useCart } from '@/contexts/CartContext';

export default function CartSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { items, updateQuantity, removeItem, getTotalItems, getTotalPrice, clearCart } = useCart();

  const handleCheckout = async () => {
    try {
      // Create order objects from cart items
      const orders = Object.values(items).reduce((acc, item) => {
        const store = item.store || 'Unknown';
        if (!acc[store]) {
          acc[store] = {
            store,
            items: [],
          };
        }
        acc[store].items.push({
          name: item.name,
          url: item.url,
          quantity: item.quantity,
        });
        return acc;
      }, {} as Record<string, { store: string; items: { name: string; url?: string; quantity: number }[] }>);

      // Submit orders to backend
      const response = await fetch('/api/orders/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orders: Object.values(orders) }),
      });

      if (!response.ok) {
        throw new Error('Failed to create orders');
      }

      // Clear cart after successful checkout
      clearCart();
      setIsOpen(false);
    } catch (error) {
      console.error('Error during checkout:', error);
      // TODO: Show error toast/notification
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
      >
        <FaShoppingCart />
        <span>Cart</span>
        {getTotalItems() > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {getTotalItems()}
          </span>
        )}
      </button>

      {/* Cart Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Shopping Cart</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            {/* Cart Items */}
            {Object.values(items).length > 0 ? (
              <div className="space-y-4">
                {Object.values(items).map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 border-b pb-4">
                    <div className="flex-grow">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-700">${item.price.toFixed(2)} each</p>
                      {item.store && (
                        <p className="text-xs text-gray-600">From: {item.store}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <FaMinus className="text-xs" />
                      </button>
                      <span className="w-8 text-center text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <FaPlus className="text-xs" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between mb-2 text-gray-800">
                    <span>Total Items:</span>
                    <span>{getTotalItems()}</span>
                  </div>
                  <div className="flex justify-between mb-4 text-gray-900">
                    <span className="font-semibold text-gray-900">Total Price:</span>
                    <span className="font-semibold text-gray-900">${getTotalPrice().toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Checkout
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-700 mt-8">
                Your cart is empty
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
