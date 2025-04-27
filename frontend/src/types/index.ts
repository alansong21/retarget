export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  store?: 'Target' | 'Trader Joes' | '';
  url?: string;
}

export interface Order {
  id: string;
  store: string;
  items: string[];
  status: 'pending' | 'completed' | 'cancelled';
}

export interface CartItem extends Product {
  quantity: number;
}
