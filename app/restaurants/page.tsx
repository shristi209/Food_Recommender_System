'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MainNav } from '@/app/components/main-nav';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Star, Search } from 'lucide-react';

interface Restaurant {
  id: number;
  restaurantName: string;
  address: string;
  phone: string;
  email:string;
  image: string;
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await fetch('/api/restaurants');
      if (!response.ok) {
        throw new Error('Failed to fetch restaurants');
      }
      const data = await response.json();
      
      setRestaurants(data.restaurants);
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
      toast({
        title: 'Error',
        description: 'Failed to load restaurants',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant => 
    restaurant.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <MainNav 
        cart={cart}
        onRemoveFromCart={() => {}}
        cartTotal={0}
      />

      <main className="container mx-auto px-4 pt-24">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Restaurants</h1>
            <p className="text-muted-foreground mt-2">
              Discover and explore our partner restaurants
            </p>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search restaurants..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            Loading...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredRestaurants.map((restaurant) => (
              <div key={restaurant.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center p-3">
                  <div className="w-24 h-24 relative rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={`https://images.unsplash.com/photo-${
                        [
                          '1552566626-52f8b828add9', // restaurant interior
                          '1517248135467-4c7edcad34c4', // restaurant with people
                          '1559339352-11d035aa65de', // modern restaurant
                          '1514933651571-24eec5b963ce', // cozy restaurant
                          '1537047902294-62a40c20a6ae', // elegant dining
                          '1466978913421-dad2ebd01d17', // casual dining
                          '1521017432531-c26408e4629f', // bistro style
                          '1554118811-1e0d58224f24', // modern interior
                        ][restaurant.id % 8]
                      }`}
                      alt={restaurant.restaurantName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-base font-medium truncate pr-2">{restaurant.restaurantName}</h3>
                      {/* <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm">{restaurant.rating}</span>
                      </div> */}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{restaurant.address}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span className="truncate">{restaurant.phone}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {restaurant?.email}
                    </div>
                    <div className="flex items-center justify-between">
                      {/* <Badge variant="outline" className="text-xs">
                        {restaurant.cuisineType}
                      </Badge> */}
                      <Link href={`/restaurant/${restaurant.id}`}>
                        <Button size="sm" variant="secondary">View</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
