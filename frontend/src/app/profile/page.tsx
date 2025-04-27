'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

type UserProfile = {
  completedOrders: number;
  rating: number;
  totalEarnings: number;
};

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({
    completedOrders: 0,
    rating: 0,
    totalEarnings: 0
  });

  useEffect(() => {
    if (!user) {
      router.push('/signin');
    }
    // TODO: Fetch user profile data from backend
  }, [user, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/signin');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          {/* Profile Header */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Profile</h3>
                <p className="mt-1 text-sm text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Profile Stats */}
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Completed Orders</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{profile.completedOrders}</dd>
              </div>
              <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Rating</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{profile.rating.toFixed(1)}/5.0</dd>
              </div>
              <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Earnings</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">${profile.totalEarnings.toFixed(2)}</dd>
              </div>
            </dl>
          </div>

          {/* Recent Activity */}
          <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h4>
            <div className="space-y-4">
              {/* TODO: Add recent activity list */}
              <p className="text-gray-500 text-sm">No recent activity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
