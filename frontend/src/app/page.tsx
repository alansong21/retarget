'use client';
import Image from "next/image";
import { useState, useMemo } from 'react';
import { FaUser, FaSearch, FaShoppingCart } from 'react-icons/fa';

type Order = {
  id: string;
  items: number;
  address: string;
  price: number;
};

// Mock data - replace with actual API call later
const mockOrders: Order[] = [
  { id: '12345', items: 3, address: '123 Bruin Walk', price: 15 },
  { id: '12346', items: 2, address: '456 Westwood Plaza', price: 12 },
  { id: '12347', items: 5, address: '789 Gayley Ave', price: 20 },
  { id: '12348', items: 1, address: '321 Levering Ave', price: 8 },
  { id: '12349', items: 4, address: '654 Kelton Ave', price: 18 }
];

const OrderCard = ({ order }: { order: Order }) => (
  <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
    <div className="font-medium mb-2">Order #{order.id}</div>
    <div className="text-sm text-gray-600 mb-4">
      {order.items} items • {order.address} • ${order.price} reward
    </div>
    <button className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 hover:shadow-md transition-all">
      Accept Order
    </button>
  </div>
);

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'buy' | 'fulfill'>('buy');

  const filteredOrders = useMemo(() => {
    return mockOrders
      .filter(order =>
        searchQuery === '' ||
        order.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.includes(searchQuery)
      )
      .slice(0, 10);
  }, [searchQuery]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBEE' }}>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Retarget</h1>
            <button className="p-2 rounded-full hover:bg-gray-100">
              <FaUser className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('buy')}
            className={`px-4 py-2 rounded-lg font-medium transition-all hover:shadow-md ${activeTab === 'buy' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Buy Products
          </button>
          <button
            onClick={() => setActiveTab('fulfill')}
            className={`px-4 py-2 rounded-lg font-medium transition-all hover:shadow-md ${activeTab === 'fulfill' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Fulfill Orders
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder={activeTab === 'buy' ? 'Search for products...' : 'Search available orders...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'buy' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Example Product Cards */}
              <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="font-medium mb-2">Sample Product</div>
                <div className="text-sm text-gray-600 mb-4">Description of the product goes here</div>
                <button className="flex items-center justify-center w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                  <FaShoppingCart className="mr-2" /> Add to Cart
                </button>
              </div>
              {/* Add more product cards as needed */}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No orders found matching your search.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
