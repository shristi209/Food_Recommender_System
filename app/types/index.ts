export type UserRole = 'CUSTOMER' | 'RESTAURANT' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  allergies?: string[];
  address?: string;
  phone?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  isApproved: boolean;
  registrationCertificate: string;
  panNumber: string;
  panImage: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  restaurantId: string;
  category: string;
  isVegetarian: boolean;
  containsAllergens: string[];
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivered';
  createdAt: string;
  deliveryAddress: string;
}