'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Phone, Star, Eye, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/contexts/cart-context';
import { MainNav } from '@/app/components/main-nav';
import { CartItem } from '@/app/types';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  picture: string;
  spicyLevel: number;
  isVeg: boolean;
  ingredients: string;
  cuisineName: string;
  categoryName: string;
}

interface Restaurant {
  id: number;
  restaurantName: string;
  address: string;
  phone: string;

  menuItems: MenuItem[];
}

export default function RestaurantPage() {
  const params = useParams();
  const { toast } = useToast();
  const { addItem } = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    fetchRestaurant();
  }, [params.id]);

  const fetchRestaurant = async () => {
    try {
      const response = await fetch(`/api/restaurant/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch restaurant');
      }
      const data = await response.json();
      setRestaurant(data.restaurant);
    } catch (error) {
      console.error('Failed to fetch restaurant:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch restaurant details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getSpicyLevelText = (level: number) => {
    switch (level) {
      case 0: return "Not Spicy";
      case 1: return "Mild";
      case 2: return "Medium";
      case 3: return "Hot";
      case 4: return "Very Hot";
      default: return "Unknown";
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    const cartItem: CartItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      picture: item.picture,
      restaurantName: restaurant?.restaurantName || ''
    };
    addItem(cartItem);
    toast({
      title: "Added to Cart",
      description: `${item.name} has been added to your cart.`
    });
  };

  const removeFromCart = (itemId: string | number) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return currentCart.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return currentCart.filter((item) => item.id !== itemId);
    });
  };

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  if (loading) {
    return (
      <>
        <MainNav 
          cart={cart}
          onRemoveFromCart={removeFromCart}
          cartTotal={cartTotal}
        />
        <div className="flex justify-center items-center min-h-screen">Loading...</div>
      </>
    );
  }

  if (!restaurant) {
    return (
      <>
        <MainNav 
          cart={cart}
          onRemoveFromCart={removeFromCart}
          cartTotal={cartTotal}
        />
        <div className="container mx-auto px-4 py-8 mt-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Restaurant Not Found</h1>
            <Link href="/" className="text-primary hover:underline">
              Return to Home
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav 
        cart={cart}
        onRemoveFromCart={removeFromCart}
        cartTotal={cartTotal}
      />

      {/* Restaurant Name in Header */}
      <div className="fixed top-16 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">{restaurant.restaurantName}</h1>
            <div className="text-muted-foreground">
              {restaurant.menuItems.length} {restaurant.menuItems.length === 1 ? 'Item' : 'Items'} Available
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Padding for Fixed Headers */}
      <div className="container mx-auto px-4 pt-36">
        <div className="grid grid-cols-12 gap-6">
          {/* Restaurant Details Card - 5 columns */}
          <div className="col-span-5">
            <Card className="sticky top-36">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  Restaurant Details
                  <Badge variant="secondary">
                    {restaurant.menuItems.length} {restaurant.menuItems.length === 1 ? 'Item' : 'Items'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <span>{restaurant.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <span>{restaurant.phone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Menu Items Section - 7 columns */}
          <div className="col-span-7">
            <h2 className="text-2xl font-bold mb-6">Menu Items</h2>
            <div className="space-y-4">
              {restaurant.menuItems.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="grid grid-cols-12 gap-4">
                    {/* Image Section */}
                    <div className="col-span-4 relative">
                      <div className="aspect-square relative">
                        <Image
                          src={item.picture || '/placeholder-food.jpg'}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <Badge variant={item.isVeg ? 'success' : 'destructive'}>
                          {item.isVeg ? 'Veg' : 'Non-Veg'}
                        </Badge>
                        <Badge variant="secondary">
                          {getSpicyLevelText(item.spicyLevel)}
                        </Badge>
                      </div>
                    </div>

                    {/* Details Section */}
                    <div className="col-span-8 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold">{item.name}</h3>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">{item.cuisineName}</Badge>
                            <Badge variant="outline">{item.categoryName}</Badge>
                          </div>
                        </div>
                        <span className="text-lg font-semibold">Rs. {item.price}</span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4">{item.ingredients}</p>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          className="flex-1"
                          onClick={() => setSelectedItem(item)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button 
                          className="flex-1"
                          onClick={() => handleAddToCart(item)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Item Details Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => {
        if (!open) setSelectedItem(null);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="relative aspect-video">
                <Image
                  src={selectedItem.picture || '/placeholder-food.jpg'}
                  alt={selectedItem.name}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Badge variant={selectedItem.isVeg ? 'success' : 'destructive'}>
                    {selectedItem.isVeg ? 'Veg' : 'Non-Veg'}
                  </Badge>
                  <Badge variant="secondary">
                    {getSpicyLevelText(selectedItem.spicyLevel)}
                  </Badge>
                </div>
                <span className="text-lg font-semibold">Rs. {selectedItem.price}</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{selectedItem.cuisineName}</Badge>
                <Badge variant="outline">{selectedItem.categoryName}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{selectedItem.ingredients}</p>
              <Button className="w-full" onClick={() => handleAddToCart(selectedItem)}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
