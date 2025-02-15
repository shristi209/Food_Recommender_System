'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Utensils, ShoppingCart, User, Plus, Minus } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CartItem } from './types';
import { useAuth } from '@/contexts/auth-context';
// import { useRouter } from 'next/navigation';

export default function Home() {
  const { isAuthenticated, user, logout } = useAuth();

  console.log("user...", user);
  console.log("isAuthenticated...", isAuthenticated);

  const [restaurants] = useState([
    {
      id: '1',
      name: 'Tasty Bites',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
      rating: 4.5,
      cuisine: 'Italian',
      menuItems: [
        {
          id: '1',
          name: 'Margherita Pizza',
          description: 'Fresh tomatoes, mozzarella, and basil',
          price: 12.99,
          image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143',
          restaurantId: '1',
          category: 'Main Course',
          isVegetarian: true,
          containsAllergens: ['Milk', 'Wheat'],
        },
      ],
    },
  ]);

  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existingItem = prev.find((i) => i.id === item.id);
      if (existingItem) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existingItem = prev.find((i) => i.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prev.map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.id !== itemId);
    });
  };

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  function handleDashboard(e: any): void {
    e.preventDefault();
    if (isAuthenticated && user?.role === 'restaurant') {
    window.location.href = '/dashboard/restaurant';
  }
  if (isAuthenticated && user?.role === 'admin') {
    window.location.href = '/dashboard/admin';
  }
}

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Utensils className="h-6 w-6" />
            <span className="text-xl font-bold">FoodHub</span>
          </div>
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground w-5 h-5 rounded-full text-xs flex items-center justify-center">
                      {cart.reduce((total, item) => total + item.quantity, 0)}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Your Cart</SheetTitle>
                </SheetHeader>
                <div className="mt-8 space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ${item.price} x {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span>{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => addToCart(item)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {cart.length > 0 ? (
                  <SheetFooter className="mt-8">
                    <div className="w-full space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total:</span>
                        <span className="font-bold text-lg">
                          ${cartTotal.toFixed(2)}
                        </span>
                      </div>
                      <Button className="w-full" asChild>
                        <Link href="/checkout">Proceed to Checkout</Link>
                      </Button>
                    </div>
                  </SheetFooter>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[50vh]">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Your cart is empty</p>
                  </div>
                )}
              </SheetContent>
            </Sheet>
            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/profile">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
                {user?.role === 'restaurant' || user?.role === 'admin'? (
                  <Button variant="outline" onClick={handleDashboard}>
                    Dashboard
                  </Button>
                ) : null}
                <Button variant="outline" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button asChild>
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/auth/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Popular Restaurants</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <Card key={restaurant.id}>
              <CardHeader>
                <CardTitle>{restaurant.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>⭐ {restaurant.rating}</span>
                  <span>{restaurant.cuisine}</span>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Menu Items</h3>
                  {restaurant.menuItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {item.isVegetarian && (
                            <span className="inline-block px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                              Vegetarian
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold mb-2">${item.price}</p>
                        <Button onClick={() => addToCart(item)} size="sm">
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}