'use client';

interface OrderItem {
  name: string;
  url?: string;
  quantity: number;
}

interface Order {
  id: string;
  store: string;
  items: OrderItem[];
  status: 'pending' | 'accepted' | 'completed' | 'rejected';
  total?: number;
  createdAt?: string;
}

export default function OrderCard({ order, onAccept, onReject, onComplete }: { 
  order: Order;
  onAccept?: (orderId: string) => void;
  onReject?: (orderId: string) => void;
  onComplete?: (orderId: string) => void;
}) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };

  return (
    <div className="border rounded-lg p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-gray-50 to-white hover:from-white hover:to-gray-50">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">Order from {order.store}</h3>
          <p className="text-sm text-gray-500">
            ID: {order.id.slice(0, 8)}...
            {order.createdAt && ` • ${new Date(order.createdAt).toLocaleDateString()}`}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-3 mb-4">
        {order.items.map((item, index) => (
          <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
            <div className="flex-grow">
              <p className="font-medium text-gray-900">{item.name}</p>
              {item.url && (
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View product
                </a>
              )}
            </div>
            <span className="text-gray-600 font-medium">x{item.quantity}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      {order.total && (
        <div className="flex justify-between items-center mb-4 pt-2 border-t">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-semibold text-gray-900">${order.total.toFixed(2)}</span>
        </div>
      )}

      {/* Actions */}
      {order.status === 'pending' && onAccept && onReject && (
        <div className="flex space-x-3">
          <button
            onClick={() => onAccept(order.id)}
            className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            Accept Order
          </button>
          <button
            onClick={() => onReject(order.id)}
            className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Reject
          </button>
        </div>
      )}

      {order.status === 'accepted' && onComplete && (
        <button
          onClick={() => onComplete(order.id)}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Mark as Completed
        </button>
      )}
    </div>
  );
}
