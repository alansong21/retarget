'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaCreditCard, FaHistory } from 'react-icons/fa';

export default function Profile() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };
  const [paymentAccount, setPaymentAccount] = useState<any>(null);
  const [earnings, setEarnings] = useState(0);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }

    // Fetch payment account details
    fetchPaymentAccount();
    fetchEarnings();
  }, [user]);

  const fetchPaymentAccount = async () => {
    try {
      const response = await fetch('/api/stripe/account');
      if (response.ok) {
        const data = await response.json();
        setPaymentAccount(data);
      }
    } catch (error) {
      console.error('Error fetching payment account:', error);
    }
  };

  const fetchEarnings = async () => {
    try {
      const response = await fetch('/api/earnings');
      if (response.ok) {
        const data = await response.json();
        setEarnings(data.total);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const setupStripeAccount = async () => {
    try {
      const response = await fetch('/api/stripe/account/create', {
        method: 'POST',
      });
      
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url; // Redirect to Stripe Connect onboarding
      }
    } catch (error) {
      console.error('Error setting up payment account:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName || 'Profile'}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-2xl">{user?.displayName?.[0] || user?.email?.[0]}</span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {user?.displayName 
                    ? user.displayName.split(' ')[0] 
                    : user?.email?.split('@')[0]}
                </h1>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Payment Account Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
            <FaCreditCard className="mr-2" />
            Payment Account
          </h2>
          
          {paymentAccount ? (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800">
                  ✓ Your payment account is set up and ready to receive earnings
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Account Status</p>
                  <p className="font-semibold">{paymentAccount.status}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Payout Method</p>
                  <p className="font-semibold">{paymentAccount.payoutMethod || 'Bank Account'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                Set up your payment account to start receiving earnings from fulfilled orders.
              </p>
              <button
                onClick={setupStripeAccount}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
              >
                Set Up Payment Account
              </button>
            </div>
          )}
        </div>

        {/* Earnings Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
            <FaHistory className="mr-2" />
            Earnings
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-800">${earnings.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
