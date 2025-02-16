'use client';

import { Utensils, ShoppingCart, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from './theme-toggle';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CartItem } from '@/app/types';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';

interface MainNavProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  cart: CartItem[];
  onRemoveFromCart: (itemId: string | number) => void;
  cartTotal: number;
  showCheckout?: boolean;
  onCheckout?: () => void;
}

export function MainNav({
  searchQuery = '',
  onSearchChange,
  cart,
  onRemoveFromCart,
  cartTotal,
  showCheckout = true,
  onCheckout
}: MainNavProps) {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Utensils className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">FoodHub</span>
        </Link>

        {onSearchChange && (
          <div className="flex-1 max-w-xl mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search for food, restaurants, cuisines..."
                className="w-full pl-10"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="flex items-center space-x-6">
          <Link
            href="/restaurants"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            Restaurants
          </Link>
        </div>

        <div className="flex items-center gap-8">
          <ThemeToggle />
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
                        src={item.picture || '/placeholder-food.jpg'}
                        alt={item.name}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-500">Rs. {item.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">×{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveFromCart(item.id)}
                      >
                        -
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {cart.length > 0 && showCheckout && (
                <div className="mt-4 space-y-4">
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>Rs. {cartTotal}</span>
                  </div>
                  <Button className="w-full" onClick={onCheckout}>
                    Checkout
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link
                  href={
                    user?.role === 'admin'
                      ? '/dashboard/admin'
                      : user?.role === 'restaurant'
                        ? '/dashboard/restaurant'
                        : '/profile'
                  }
                >
                  <div className="flex flex-col items-center">
                    <User className="h-5 w-5" />
                    <span className="font-bold text-sm">
                      {user?.role === 'admin'
                        ? 'Admin'
                        : user?.role === 'restaurant'
                          ? 'Restaurant'
                          : 'Customer'}
                    </span>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Sign Up</Link>
              </Button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
