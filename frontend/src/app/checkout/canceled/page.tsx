'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export default function CheckoutCanceled() {
  const router = useRouter();

  useEffect(() => {
    toast.error('Checkout was canceled');
    // Redirect back to home page after a short delay
    const timer = setTimeout(() => {
      router.push('/');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          Checkout Canceled
        </h1>
        <p className="text-gray-600 mb-8">
          Your order has been canceled. Redirecting you back to the store...
        </p>
      </div>
    </div>
  );
}
