'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Utensils, ShoppingCart, User, Plus, Minus, Eye, Search, MapPin, Phone, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CartItem } from './types';
import { useAuth } from '@/contexts/auth-context';
import { ThemeToggle } from './components/theme-toggle';
import { useRouter } from "next/navigation";
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MainNav } from './components/main-nav';
import { useInteractions } from '@/hooks/use-interactions';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  picture: string;
  spicyLevel: number;
  isVeg: boolean;
  ingredients: string;
  restaurantName: string;
  address: string;
  phone: string;
  cuisineName: string;
  categoryName: string;
  restaurantId: number;
}

interface Restaurant {
  restaurantName: string;
  address: string;
  phone: string;
  rating: number;
  description: string;
  menuItems: MenuItem[];
}

export default function Home() {
  const { isAuthenticated, user, logout } = useAuth();
  const { trackView, trackCartAdd, trackSearch } = useInteractions();
  console.log("user...", user);
  console.log("isAuthenticated...", isAuthenticated);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [lastTrackedQuery, setLastTrackedQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [restaurantMenuItems, setRestaurantMenuItems] = useState<MenuItem[]>([]);
  const [loadingRestaurant, setLoadingRestaurant] = useState(false);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch("/api/menu");
      if (!response.ok) {
        throw new Error("Failed to fetch menu items");
      }
      const data = await response.json();
      setMenuItems(data.menuItems || []);
    } catch (error) {
      console.error("Failed to fetch menu items:", error);
      toast({
        title: "Error",
        description: "Failed to fetch menu items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSpicyLevelText = (level: number) => {
    switch (level) {
      case 0:
        return "Not Spicy";
      case 1:
        return "Mild";
      case 2:
        return "Medium";
      case 3:
        return "Hot";
      case 4:
        return "Very Hot";
      default:
        return "Unknown";
    }
  };

  const [cart, setCart] = useState<CartItem[]>([]);

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  function addToCart(item: CartItem) {
    setCart((currentCart) => {
      const existingItem = currentCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return currentCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...currentCart, { ...item, quantity: 1 }];
    });
  }

  function removeFromCart(itemId: string | number) {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return currentCart.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return currentCart.filter((item) => item.id !== itemId);
    });
  }

  const fetchRestaurantDetails = async (restaurantId: number) => {
    setLoadingRestaurant(true);
    try {
      const response = await fetch(`/api/restaurant/${restaurantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch restaurant');
      }
      const data = await response.json();
      setSelectedRestaurant(data.restaurant);
      setRestaurantMenuItems(data.restaurant.menuItems || []);
    } catch (error) {
      console.error('Failed to fetch restaurant:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch restaurant details',
        variant: 'destructive',
      });
    } finally {
      setLoadingRestaurant(false);
    }
  };

  // Debounce search query (wait for user to stop typing)
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (searchQuery) {
        setDebouncedQuery(searchQuery);
      }
    }, 500); // Wait 500ms after last keystroke

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [searchQuery]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery);
    }
  }, [debouncedQuery]);

  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
    // Clear any existing tracking timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
  };

  const performSearch = async (query: string) => {
    try {
      const response = await fetch(`/api/menu-items/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setMenuItems(data);
      console.log("Search results:", data);

      // Set timeout to track interaction after 30 seconds
      const timeout = setTimeout(() => {
        if (query && query !== lastTrackedQuery) {
          console.log("Tracking search interaction after 30s:", query);
          data.forEach((item: MenuItem) => {
            trackSearch(item.id);
          });
          setLastTrackedQuery(query);
        }
      }, 30000); // 30 seconds after finished typing

      setSearchTimeout(timeout);
    } catch (error) {
      console.error('Error searching menu items:', error);
    }
  };

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleViewDetails = (item: MenuItem) => {
    setSelectedItem(item);
    // Track view interaction
    trackView(item.id);
    console.log("Viewing details of:", item);
  };

  const handleAddToCart = (item: MenuItem) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      restaurantId: item.restaurantId,
      restaurantName: item.restaurantName
    });
    // Track cart addition
    trackCartAdd(item.id);
    console.log("Added item to cart:", item);
    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart.`
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav 
        searchQuery={searchQuery}
        onSearchChange={(query) => handleSearchInput(query)}
        cart={cart}
        onRemoveFromCart={removeFromCart}
        cartTotal={cartTotal}
        onCheckout={() => {
          if (!isAuthenticated) {
            toast({
              title: "Login Required",
              description: "Please login to checkout",
              variant: "destructive",
            });
            return;
          }
          router.push("/checkout");
        }}
      />

      <main className="container mx-auto px-4 pt-24">
        <h1 className="text-3xl font-bold mb-8 text-center">Featured Menu Items</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems
            .filter((item) => 
              searchQuery === '' || 
              item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.cuisineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48 w-full">
                <Image
                  src={item.picture || "/placeholder-food.jpg"}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Badge variant={item.isVeg ? "success" : "destructive"}>
                    {item.isVeg ? "Veg" : "Non-Veg"}
                  </Badge>
                  <Badge variant="secondary">
                    {getSpicyLevelText(item.spicyLevel)}
                  </Badge>
                </div>
              </div>
              
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{item.name}</span>
                  <span className="text-lg font-semibold">Rs. {item.price}</span>
                </CardTitle>
                <CardDescription>
                  <div className="flex gap-2 mb-1">
                    <Badge variant="outline">{item.cuisineName}</Badge>
                    <Badge variant="outline">{item.categoryName}</Badge>
                  </div>
                  {item.ingredients}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="text-sm space-y-1">
                  <p className="font-semibold">{item.restaurantName}</p>
                  <p className="text-muted-foreground">{item.address}</p>
                  <p className="text-muted-foreground">{item.phone}</p>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-2">
                <div className="flex gap-2 w-full">
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleViewDetails(item)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => handleAddToCart(item)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
                <Link 
                  href={`/restaurant/${item.restaurantId}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors text-center w-full"
                >
                  View Restaurant Details
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {menuItems.filter((item) => {
          if (!searchQuery) return true;
          
          const query = searchQuery.toLowerCase();
          const fields = {
            name: item.name?.toLowerCase() || '',
            restaurant: item.restaurantName?.toLowerCase() || '',
            cuisine: item.cuisineName?.toLowerCase() || '',
            category: item.categoryName?.toLowerCase() || '',
            ingredients: item.ingredients?.toLowerCase() || '',
            address: item.address?.toLowerCase() || '',
            phone: item.phone?.toLowerCase() || '',
            isVeg: item.isVeg?.toString().toLowerCase() || '',
            spicyLevel: item.spicyLevel?.toString().toLowerCase() || ''
          };

          return Object.values(fields).some(field => field.includes(query));
        }).length === 0 && (
          <div className="text-center py-8">
            <p className="text-lg text-muted-foreground">No menu items found matching your search.</p>
          </div>
        )}
      </main>

      {/* Menu Item Details Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-3xl">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedItem.name}</DialogTitle>
              </DialogHeader>
              <div className="relative h-64 w-full mb-4">
                <Image
                  src={selectedItem.picture || '/placeholder-food.jpg'}
                  alt={selectedItem.name}
                  fill
                  className="object-cover rounded-lg"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Badge variant={selectedItem.isVeg ? 'success' : 'destructive'}>
                    {selectedItem.isVeg ? 'Veg' : 'Non-Veg'}
                  </Badge>
                  <Badge variant="secondary">
                    {getSpicyLevelText(selectedItem.spicyLevel)}
                  </Badge>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Badge variant="outline">{selectedItem.cuisineName}</Badge>
                    <Badge variant="outline">{selectedItem.categoryName}</Badge>
                  </div>
                  <span className="text-xl font-semibold">Rs. {selectedItem.price}</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Ingredients</h3>
                  <p className="text-muted-foreground">{selectedItem.ingredients}</p>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => {
                    handleAddToCart(selectedItem);
                    setSelectedItem(null);
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Restaurant Details Dialog */}
      <Dialog 
        open={!!selectedRestaurant} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRestaurant(null);
            setRestaurantMenuItems([]);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {loadingRestaurant ? (
            <div className="flex justify-center items-center py-8">Loading...</div>
          ) : selectedRestaurant && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedRestaurant.restaurantName}</DialogTitle>
                <div className="flex flex-wrap gap-4 text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedRestaurant.address}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {selectedRestaurant.phone}
                  </span>
                  {selectedRestaurant.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {selectedRestaurant.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                {selectedRestaurant.description && (
                  <p className="mt-4 text-muted-foreground">{selectedRestaurant.description}</p>
                )}
              </DialogHeader>

              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Menu Items</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {restaurantMenuItems.map((menuItem) => (
                    <Card key={menuItem.id} className="overflow-hidden">
                      <div className="relative h-40 w-full">
                        <Image
                          src={menuItem.picture || '/placeholder-food.jpg'}
                          alt={menuItem.name}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Badge variant={menuItem.isVeg ? 'success' : 'destructive'}>
                            {menuItem.isVeg ? 'Veg' : 'Non-Veg'}
                          </Badge>
                          <Badge variant="secondary">
                            {getSpicyLevelText(menuItem.spicyLevel)}
                          </Badge>
                        </div>
                      </div>

                      <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                          <span>{menuItem.name}</span>
                          <span className="text-lg font-semibold">Rs. {menuItem.price}</span>
                        </CardTitle>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{menuItem.cuisineName}</Badge>
                          <Badge variant="outline">{menuItem.categoryName}</Badge>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{menuItem.ingredients}</p>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleViewDetails(menuItem)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button 
                            className="flex-1"
                            onClick={() => handleAddToCart(menuItem)}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Cart
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}