'use client';

interface Order {
  id: string;
  store: string;
  items: string[];
  status: string;
}

export default function OrderCard({ order }: { order: Order }) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
      <div className="font-medium mb-2">Order from {order.store}</div>
      <div className="text-sm text-gray-600 mb-4">
        Items: {order.items.join(', ')}
      </div>
      <div className="text-sm text-gray-500">
        Status: <span className="font-medium">{order.status}</span>
      </div>
    </div>
  );
}
