'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '@/context/AuthContext';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/auth?redirect=/checkout' + window.location.search;
    }
  }, [user, authLoading]);

  // Get cart items from URL parameters
  const items = searchParams.get('items');
  const total = searchParams.get('total');
  const cartItems = items ? JSON.parse(items) : [];

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Create a checkout session
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: cartItems }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');
      
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw error;

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-semibold mb-6 text-gray-800">Checkout</h1>
          
          {/* Order Summary */}
          <div className="border-b pb-6 mb-6">
            <h2 className="text-lg font-medium mb-4 text-gray-700">Order Summary</h2>
            <div className="space-y-4">
              {cartItems.map((item: CartItem) => (
                <div key={item.id} className="flex justify-between">
                  <div>
                    <span className="font-medium text-gray-700">{item.name}</span>
                    <span className="text-gray-500 ml-2">x{item.quantity}</span>
                  </div>
                  <div className="text-gray-700">${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between font-semibold">
              <div className="text-gray-800">Total</div>
              <div className="text-gray-800">${total}</div>
            </div>
          </div>

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mt-4 text-red-600 text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
