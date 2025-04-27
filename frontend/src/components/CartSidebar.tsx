'use client';

import { useState } from 'react';
import { FaShoppingCart, FaTimes, FaPlus, FaMinus } from 'react-icons/fa';
import { useCart } from '@/contexts/CartContext';
import toast from 'react-hot-toast';

export default function CartSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { items, updateQuantity, removeItem, getTotalItems, getSubtotal, getDeliveryFee, getTotalPrice, clearCart } = useCart();

  const handleCheckout = async () => {
    try {
      // Create line items for products
      const productLineItems = Object.values(items)
        .filter(item => item.price > 0)
        .map(item => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.name,
              description: `From ${item.store || 'Unknown'}`,
              images: item.image ? [item.image] : undefined
            },
            unit_amount: Math.round(item.price * 100) // Convert to cents
          },
          quantity: item.quantity
        }));

      if (productLineItems.length === 0) {
        toast.error('No valid items in cart. Please check item prices.');
        return;
      }

      // Add delivery fee as a separate line item
      const subtotal = getSubtotal();
      const deliveryFee = getDeliveryFee();
      const deliveryLineItem = {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Delivery Fee',
            description: '15% delivery fee'
          },
          unit_amount: Math.round(deliveryFee * 100)
        },
        quantity: 1
      };

      // Create Stripe checkout session
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: [...productLineItems, deliveryLineItem] }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error('Failed to start checkout. Please try again.');
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
                <div className="mt-6 pt-4 border-t space-y-2">
                  <div className="flex justify-between text-gray-800">
                    <span>Total Items:</span>
                    <span>{getTotalItems()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>${getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee (15%):</span>
                    <span>${getDeliveryFee().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
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
