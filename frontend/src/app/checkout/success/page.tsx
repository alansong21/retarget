'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts';
import toast from 'react-hot-toast';

export default function SuccessPage() {
  const router = useRouter();
  const { clearCart } = useCart();

  useEffect(() => {
    // Clear the cart immediately
    clearCart();
    // Clear session storage
    sessionStorage.removeItem('cartCleared');
    // Show success message
    toast.success('Payment successful! Your cart has been cleared.');
  }, []); // Empty dependency array since we only want this to run once

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto px-4 py-8 bg-white rounded-lg shadow text-center">
        <div className="mb-4 text-green-500">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-gray-900 font-bold mb-4">Payment Successful! You will receive details about your order.</h1>
        <p className="text-gray-600 mb-8">
          Thank you for your purchase. Your order has been processed successfully.
        </p>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}
