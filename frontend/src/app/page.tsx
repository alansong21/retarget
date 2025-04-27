'use client';

import Image from "next/image";
import { useState, useRef, useEffect } from 'react';
import { FaSearch, FaShoppingCart, FaChevronLeft, FaChevronRight, FaUser } from 'react-icons/fa';
import OrderCard from '@/components/OrderCard';
import AddItemModal from '@/components/AddItemModal';
import CartSidebar from '@/components/CartSidebar';
import { useCart } from '@/contexts/CartContext';

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
  url?: string;
  store?: 'Target' | 'Trader Joes';
  quantity?: number;
}



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
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    fetchProducts();
  }, []);
  const { items: cartItems, addItem, getTotalItems, getTotalPrice } = useCart();
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
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

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
  };



  const { clearCart } = useCart();

  const handleCheckout = () => {
    // You can implement the checkout logic here
    console.log('Checking out with items:', cartItems);
    // Reset cart after checkout
    clearCart();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBEE' }}>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Grabbit</h1>
            <div className="flex items-center space-x-4">
              <CartSidebar />
              <button className="p-2 rounded-full hover:bg-gray-100">
                <FaUser className="w-6 h-6 text-gray-600" />
              </button>
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
            onClick={handleCheckout}
            disabled={getTotalItems() === 0}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Checkout
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
          </div>
          {activeTab === 'buy' && (
            <button
              onClick={() => setIsAddItemModalOpen(true)}
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
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
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
              
              <div
                ref={sliderRef}
                className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <div className="flex flex-wrap gap-4 justify-start">
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
                          {cartItems[product.id] ? `Add More (${cartItems[product.id]})` : 'Add to Cart'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 p-2 rounded-full shadow hover:bg-white"
              >
                <FaChevronRight className="text-gray-600" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))
              ) : (
                <div key="no-orders" className="text-center text-gray-700">
                  No orders found
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
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
