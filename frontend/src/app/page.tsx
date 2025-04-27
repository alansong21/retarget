'use client';

import Image from "next/image";
import { useState, useRef, useEffect } from 'react';
import { FaSearch, FaShoppingCart, FaChevronLeft, FaChevronRight, FaUser } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/config/firebase';
import OrderCard from '@/components/OrderCard';

interface Order {
  id: string;
  store: string;
  items: string[];
  status: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Fresh Apples',
    description: 'Crisp and juicy red apples',
    price: 2.99,
    image: '/products/apple.jpg'
  },
  {
    id: '2',
    name: 'Whole Grain Bread',
    description: 'Freshly baked whole grain bread',
    price: 4.99,
    image: '/products/bread.jpg'
  },
  {
    id: '3',
    name: 'Organic Milk',
    description: '1 gallon of organic whole milk',
    price: 0,
    image: '/products/milk.jpg'
  },
  {
    id: '4',
    name: 'Fresh Eggs',
    description: 'Farm fresh eggs, dozen',
    price: 3.99,
    image: '/products/eggs.jpg'
  },
  {
    id: '5',
    name: 'Chicken Breast',
    description: 'Boneless skinless chicken breast',
    price: 8.99,
    image: '/products/chicken.jpg'
  },
];

const mockOrders: Order[] = [
  { id: '12345', store: 'Store 1', items: ['Item 1', 'Item 2'], status: 'pending' },
  { id: '12346', store: 'Store 2', items: ['Item 3', 'Item 4'], status: 'pending' },
  { id: '12347', store: 'Store 3', items: ['Item 5', 'Item 6'], status: 'pending' },
  { id: '12348', store: 'Store 4', items: ['Item 7', 'Item 8'], status: 'pending' },
  { id: '12349', store: 'Store 5', items: ['Item 9', 'Item 10'], status: 'pending' },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('buy');
  const [orders] = useState<Order[]>(mockOrders);
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [cartItems, setCartItems] = useState<{[key: string]: number}>({}); // product id -> quantity
  const sliderRef = useRef<HTMLDivElement>(null);

  const filteredOrders = orders.filter(order =>
    order.store.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.items.some(item =>
      item.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = 300; // Adjust this value to control scroll distance
      const newScrollLeft = direction === 'left'
        ? sliderRef.current.scrollLeft - scrollAmount
        : sliderRef.current.scrollLeft + scrollAmount;
      
      sliderRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const addToCart = (productId: string) => {
    setCartItems(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const getTotalItems = () => {
    return Object.values(cartItems).reduce((sum, quantity) => sum + quantity, 0);
  };

  const getTotalPrice = () => {
    return Object.entries(cartItems).reduce((sum, [productId, quantity]) => {
      const product = products.find(p => p.id === productId);
      return sum + (product ? product.price * quantity : 0);
    }, 0);
  };

  const { user } = useAuth();

  const handleCheckout = () => {
    // Prepare cart items for checkout
    const checkoutItems = Object.entries(cartItems).map(([productId, quantity]) => {
      const product = products.find(p => p.id === productId);
      return {
        id: productId,
        name: product?.name || '',
        price: product?.price || 0,
        quantity,
      };
    });

    if (!user) {
      const params = new URLSearchParams();
      params.set('items', JSON.stringify(checkoutItems));
      params.set('total', getTotalPrice().toFixed(2));
      window.location.href = `/auth?redirect=/checkout?${params.toString()}`;
      return;
    }

    // If user is authenticated, proceed to checkout
    const params = new URLSearchParams();
    params.set('items', JSON.stringify(checkoutItems));
    params.set('total', getTotalPrice().toFixed(2));
    window.location.href = `/checkout?${params.toString()}`;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBEE' }}>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Grabbit</h1>
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{user.displayName || user.email}</span>
                <button 
                  onClick={() => auth.signOut()}
                  className="overflow-hidden rounded-full hover:ring-2 hover:ring-gray-300 transition-all"
                >
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <FaUser className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => window.location.href = '/auth'}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Log in / Register
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6">
          <button
            className={`px-4 py-2 rounded-lg ${activeTab === 'buy' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab('buy')}
          >
            Buy Products
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${activeTab === 'fulfill' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab('fulfill')}
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
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-500 placeholder-gray-500"
            placeholder={activeTab === 'buy' ? 'Search for products...' : 'Search available orders...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'buy' ? (
            <>
              {/* Product Slider */}
              <div className="relative mb-8">
                <button
                  onClick={() => scroll('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 p-2 rounded-full shadow hover:bg-white"
                >
                  <FaChevronLeft className="text-gray-600" />
                </button>
                
                <div
                  ref={sliderRef}
                  className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide scroll-smooth"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      className="flex-none w-64 border rounded-lg p-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="w-full h-40 bg-gray-100 rounded-lg mb-4">
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          Product Image
                        </div>
                      </div>
                      <div className="font-medium text-gray-600 mb-2">{product.name}</div>
                      <div className="text-sm text-gray-600 mb-2">{product.description}</div>
                      <div className="text-lg font-semibold text-gray-800 mb-4">${product.price.toFixed(2)}</div>
                      <button
                        onClick={() => addToCart(product.id)}
                        className="flex items-center justify-center w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        <FaShoppingCart className="mr-2" />
                        {cartItems[product.id] ? `Add More (${cartItems[product.id]})` : 'Add to Cart'}
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => scroll('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 p-2 rounded-full shadow hover:bg-white"
                >
                  <FaChevronRight className="text-gray-600" />
                </button>
              </div>

              {/* Cart Summary */}
              <div className="flex justify-between items-center bg-white rounded-lg shadow p-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <FaShoppingCart className="text-2xl text-gray-600" />
                    {getTotalItems() > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {getTotalItems()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Cart Total:</div>
                    <div className="font-semibold">${getTotalPrice().toFixed(2)}</div>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={getTotalItems() === 0}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Checkout
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))
              ) : (
                <div className="text-center text-gray-500">
                  No orders found
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
