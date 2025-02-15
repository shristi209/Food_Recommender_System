export type UserRole = 'customer' | 'restaurant' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  restaurantId?: string; // Only for restaurant users
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  restaurantId: string;
  image?: string;
}

export interface Order {
  id: string;
  customerId: string;
  restaurantId: string;
  items: {
    menuItemId: string;
    quantity: number;
    price: number;
  }[];
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: Date;
}

export interface Restaurant {
  id: string;
  name: string;
  email: string;
  address: string;
  status: 'pending' | 'approved' | 'rejected';
  userId: string;
}
