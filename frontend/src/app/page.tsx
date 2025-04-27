'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

type Order = {
  id: string;
  store: string;
  items: string[];
  total: number;
  status: 'open' | 'claimed' | 'completed';
  createdAt: string;
};

export default function Home() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'create'>('orders');
  const [mockOrders] = useState<Order[]>([
    {
      id: '1',
      store: 'Trader Joe\'s',
      items: ['Bananas', 'Bread', 'Milk'],
      total: 25.99,
      status: 'open',
      createdAt: '2025-04-26T20:00:00Z'
    },
    {
      id: '2',
      store: 'Ralphs',
      items: ['Rice', 'Chicken', 'Vegetables'],
      total: 45.50,
      status: 'claimed',
      createdAt: '2025-04-26T19:30:00Z'
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-blue-600">Retarget</span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link 
                    href="/profile" 
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Profile
                  </Link>
                  <button 
                    onClick={logout}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link 
                  href="/signin"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Available Orders
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Create Order
          </button>
        </div>

        {/* Orders Grid */}
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{order.store}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    order.status === 'open' 
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'claimed'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <ul className="mb-4 text-gray-600">
                  {order.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-medium">${order.total.toFixed(2)}</span>
                  {order.status === 'open' && (
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                      Claim Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Order Form */}
        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Create New Order</h2>
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Store</label>
                <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option>Trader Joe's</option>
                  <option>Ralphs</option>
                  <option>Target</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Items</label>
                <textarea 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={4}
                  placeholder="Enter your grocery items, one per line"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estimated Total</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    className="block w-full pl-7 pr-12 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Create Order
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
