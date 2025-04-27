export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  store?: 'Target' | 'Trader Joes' | '';
  url?: string;
}

export interface OrderItem {
  name: string;
  url?: string;
  quantity: number;
}

export interface Order {
  id: string;
  store: string;
  items: OrderItem[];
  status: 'pending' | 'accepted' | 'completed' | 'rejected';
  total?: number;
  createdAt?: string;
}

export interface CartItem extends Product {
  quantity: number;
}
