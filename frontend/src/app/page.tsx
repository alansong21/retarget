'use client';

import Image from "next/image";
import { useState, useRef, useEffect } from 'react';
import { FaSearch, FaShoppingCart, FaChevronLeft, FaChevronRight, FaUser } from 'react-icons/fa';
import { useCart, useAuth } from '../contexts';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import OrderCard from '../components/OrderCard';
import AddItemModal from '../components/AddItemModal';
import CartSidebar from '../components/CartSidebar';
import type { Product as ProductType, Order, CartItem } from '../types';

type Product = Omit<ProductType, 'store'> & {
  store: 'Target' | 'Trader Joes' | undefined;
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'buy' | 'fulfill'>('buy');
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'accepted'>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  const { user, signOut } = useAuth();
  const { items: cartItems, addItem, getTotalItems, getTotalPrice, clearCart } = useCart();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
  };

  const fetchOrders = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const response = await fetch(`${apiUrl}/orders/available`);
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `HTTP ${response.status}`);
      }
      const data = await response.json();
      console.log('Fetched orders from backend:', data);
      
      // Map backend order format to frontend Order interface
      const mappedOrders = data.map((order: any) => {
        console.log('Processing order:', order);
        return {
          id: String(order.order_id), // Convert to string as our interface expects string
          store: order.store_name,
          items: Array.isArray(order.items) ? order.items.map((item: any) => ({
            name: item.name || item.item, // Handle both formats
            quantity: item.quantity || item.qty, // Handle both formats
            price: typeof item.price === 'string' ? parseFloat(item.price.replace('$', '')) : (item.price || 0)
          })) : [],
          status: 'pending', // Backend uses 'open', frontend uses 'pending'
          total: order.total || 0,
          createdAt: order.expiry_time // Using expiry_time as a proxy for createdAt
        };
      });
      
      console.log('Mapped orders for frontend:', mappedOrders);
      setOrders(mappedOrders);
    } catch (err) {
      console.error('fetchOrders error:', err);
      setOrders([]);
    }
  };

  useEffect(() => {
    // Fetch products and orders once on mount
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        // Remove duplicates by ID, keeping the latest version
        const uniqueProducts = data.reduce((acc: Product[], product: Product) => {
          const existingIndex = acc.findIndex(p => p.id === product.id);
          if (existingIndex >= 0) {
            acc[existingIndex] = product; // Replace with newer version
          } else {
            acc.push(product);
          }
          return acc;
        }, []);
        setProducts(uniqueProducts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
      } finally {
        setIsLoading(false);
      }
    };

  const handleAcceptOrder = (orderId: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: 'accepted' } : order
    ));
    toast.success('Order accepted!');
  };

  const handleRejectOrder = (orderId: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: 'rejected' } : order
    ));
    toast.error('Order rejected');
  };

  const handleCompleteOrder = (orderId: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: 'completed' } : order
    ));
    toast.success('Order completed!');
  };

  const createSampleOrder = async () => {
    try {
      const response = await fetch('/api/orders/create-sample', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create sample order');
      }

      const sampleOrder = await response.json();
      setOrders(prev => [...prev, sampleOrder]);
      toast.success('Sample order created!');
    } catch (error) {
      console.error('Error creating sample order:', error);
      toast.error('Failed to create sample order');
    }
  };

  const filteredOrders = orders.filter((order: Order) => {
    // First apply status filter
    if (orderFilter !== 'all' && order.status !== orderFilter) {
      return false;
    }

    // Then apply search filter
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return order.items.some(item => 
      item.name.toLowerCase().includes(searchLower)
    );
  });

  const filteredProducts = products.filter((product: Product) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower)
    );
  });

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

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
    toast.success(`Added ${product.name} to cart`);
  };

  const handleCheckout = async () => {
    console.log('Checkout clicked, cart items:', cartItems);
    
    if (!user) {
      toast.error('Please log in to checkout');
      return;
    }

    if (Object.keys(cartItems).length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      // Create line items for products
      const getSubtotal = () => {
        return Object.values(cartItems).reduce((total, item) => {
          return total + (item.price * item.quantity);
        }, 0);
      };

      const getDeliveryFee = (subtotal: number) => {
        return subtotal * 0.15; // 15% delivery fee
      };

      const subtotal = getSubtotal();
      const deliveryFee = getDeliveryFee(subtotal);
      const total = subtotal + deliveryFee;

      // Create line items for products
      const productLineItems = Object.values(cartItems).map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: `From ${item.store || 'Unknown'}`,
            images: item.image && item.image.trim() !== '' ? [item.image] : undefined
          },
          unit_amount: Math.round(item.price * 100) // Convert to cents
        },
        quantity: item.quantity
      }));

      // Add delivery fee as a line item
      productLineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Delivery Fee',
            description: '15% delivery fee',
            images: []
          },
          unit_amount: Math.round(deliveryFee * 100) // Convert to cents
        },
        quantity: 1
      });

      // Create checkout session with order data
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: productLineItems,
          cartItems: Object.values(cartItems).map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image,
            store: item.store || 'Unknown'
          })),
          total,
          userId: user.uid
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const session = await response.json();
      window.location.href = session.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout process');
      // Clear cart if there are invalid items
      if (error instanceof Error && error.message.includes('No valid items')) {
        clearCart();
      }
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBEE' }}>
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Grabbit</h1>
            <div className="flex items-center space-x-4">
              <CartSidebar />
              {user ? (
                <button
                  onClick={() => router.push('/profile')}
                  className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 rounded-lg border border-gray-200 transition-all duration-200 shadow-sm hover:shadow"
                >
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || 'Profile'}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span>{user.displayName?.[0] || user.email?.[0]}</span>
                    </div>
                  )}
                  <span>
                    {user.displayName 
                      ? user.displayName.split(' ')[0] 
                      : user.email?.split('@')[0]}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => router.push('/auth')}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
   
        

        {/* Cart Summary */}
        <div className="flex justify-between items-center mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <FaShoppingCart className="text-2xl text-gray-600" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div>
                <div className="text-sm text-gray-900">Cart Total:</div>
                <div className="font-semibold text-gray-900">${getTotalPrice().toFixed(2)}</div>
              </div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              if (getTotalItems() > 0) {
                handleCheckout();
              } else {
                toast.error('Your cart is empty');
              }
            }}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Checkout ({getTotalItems()} items)
          </button>
        </div>

        {/* Tab Navigation and Add Item Button */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-4">
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
            {activeTab === 'fulfill' && (
              <button
                onClick={createSampleOrder}
                className="px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600"
              >
                Create Sample Order
              </button>
            )}
          </div>
          {activeTab === 'buy' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
            >
              <span className="mr-2">+</span>
              Add Custom Item
            </button>
          )}
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
            <div className="relative">
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 p-2 rounded-full shadow hover:bg-white"
              >
                <FaChevronLeft className="text-gray-600" />
              </button>
                <div className="flex overflow-x-auto space-x-4" ref={sliderRef}>
                  {isLoading ? (
                    <div key="loading" className="flex justify-center w-full py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
                    </div>
                  ) : error ? (
                    <div key="error" className="text-red-900 text-center w-full py-8">{error}</div>
                  ) : filteredProducts.length === 0 ? (
                    <div key="no-products" className="text-center text-gray-900">
                      {searchQuery ? 'No products found matching your search' : 'No products available'}
                    </div>
                  ) : (
                    filteredProducts.map(product => (
                      <div
                        key={product.id}
                        className="flex-none w-64 border rounded-lg p-4 hover:shadow-lg transition-shadow"
                      >
                        <div className="w-full h-40 bg-gray-100 rounded-lg mb-4 relative overflow-hidden">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              style={{ objectFit: 'contain' }}
                              className="p-2"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="font-medium text-gray-800 mb-2">{product.name}</div>
                        <div className="text-sm text-gray-700 mb-2">{product.description}</div>
                        <div className="text-lg font-semibold text-gray-900 mb-4">${product.price.toFixed(2)}</div>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="flex items-center justify-center w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                          <FaShoppingCart className="mr-2" />
                          {cartItems[product.id]?.quantity ? `Add More (${cartItems[product.id].quantity})` : 'Add to Cart'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => scroll('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 p-2 rounded-full shadow hover:bg-white"
                >
                  <FaChevronRight className="text-gray-600" />
                </button>
              </div>
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900">Available Orders</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setOrderFilter('all')}
                    className={`px-4 py-2 rounded-lg ${orderFilter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setOrderFilter('pending')}
                    className={`px-4 py-2 rounded-lg ${orderFilter === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setOrderFilter('accepted')}
                    className={`px-4 py-2 rounded-lg ${orderFilter === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                  >
                    Accepted
                  </button>
                </div>
              </div>
              {filteredOrders.length > 0 ? (
                <div className="space-y-6">
                  {filteredOrders.map(order => (
                    <OrderCard 
                      key={order.id} 
                      order={order}
                      onAccept={handleAcceptOrder}
                      onReject={handleRejectOrder}
                      onComplete={handleCompleteOrder}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-700 py-12 bg-gray-50 rounded-lg">
                  No orders found
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={async (url: string, quantity: number) => {
          try {
            // TODO: Call backend API to get product info
            const response = await fetch('/api/scrape-product', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url })
            });

            if (!response.ok) {
              throw new Error('Failed to fetch product info');
            }

            const productInfo = await response.json();
            console.log('Scraped product info:', productInfo);
            // Create product object to send to backend
            const newProduct = {
              name: productInfo.name,
              description: productInfo.description || '',
              price: productInfo.price,
              image: productInfo.image_url || '',
              url: url,
              store: url.includes('target.com') ? 'Target' : 'Trader Joes'
            };

            // Add product to backend
            const addResponse = await fetch('/api/products/add', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newProduct)
            });

            if (!addResponse.ok) {
              throw new Error('Failed to add product');
            }

            const addedProduct = await addResponse.json();
            console.log('Added product:', addedProduct);
            setProducts(prev => {
              // Remove any existing product with the same ID
              const filtered = prev.filter(p => p.id !== addedProduct.id);
              // Add the new/updated product
              return [...filtered, addedProduct];
            });
            console.log('Adding to cart:', addedProduct, 'quantity:', quantity);
            addItem(addedProduct, quantity);
          } catch (error) {
            console.error('Error adding custom item:', error);
            // TODO: Show error toast/notification
          }
        }}
      />
    </div>
  );
}
