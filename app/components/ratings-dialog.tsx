'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Star } from 'lucide-react';
import Image from 'next/image';
import RatingStars from './RatingStars';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

interface MenuItem {
  id: number;
  name: string;
  price: number | string;
  picture: string;
  restaurantName: string;
  cuisineName: string;
  categoryName: string;
  isVeg: number;
  spicyLevel: number;
}

interface RatingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onViewDetails: (item: MenuItem) => void;
  onRateItem: (item: MenuItem) => void;
}

export function RatingsDialog({ isOpen, onClose, onViewDetails, onRateItem }: RatingsDialogProps) {
  const [ratedItems, setRatedItems] = useState<(MenuItem & { rating: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (isOpen) {
      fetchRatedItems();
    }
  }, [isOpen]);

  const fetchRatedItems = async () => {
    try {
      setLoading(true);
      
      // Fetch user ratings
      const ratingsResponse = await fetch('/api/ratings/user');
      if (!ratingsResponse.ok) throw new Error('Failed to fetch ratings');
      const ratingsData = await ratingsResponse.json();
      
      // If no ratings, return early
      if (!ratingsData.ratings || Object.keys(ratingsData.ratings).length === 0) {
        setRatedItems([]);
        setLoading(false);
        return;
      }
      
      // Fetch menu items for the rated items
      const menuItemIds = Object.keys(ratingsData.ratings);
      const menuItemsResponse = await fetch('/api/menu-items/byIds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: menuItemIds }),
      });
      
      if (!menuItemsResponse.ok) throw new Error('Failed to fetch menu items');
      const menuItemsData = await menuItemsResponse.json();
      
      // Combine menu items with ratings
      const ratedMenuItems = menuItemsData.menuItems.map((item: MenuItem) => ({
        ...item,
        rating: ratingsData.ratings[item.id]
      }));
      
      // Sort by rating (highest first)
      ratedMenuItems.sort((a: any, b: any) => b.rating - a.rating);
      
      setRatedItems(ratedMenuItems);
    } catch (error) {
      console.error('Error fetching rated items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSpicyLevelText = (level: number) => {
    switch (level) {
      case 1: return 'Mild';
      case 2: return 'Medium';
      case 3: return 'Hot';
      case 4: return 'Very Hot';
      case 5: return 'Extreme';
      default: return 'Unknown';
    }
  };

  const filterItems = (items: (MenuItem & { rating: number })[]) => {
    if (activeTab === 'all') return items;
    
    const ratingFilter = parseInt(activeTab);
    return items.filter(item => Math.floor(item.rating) === ratingFilter);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">My Rated Items</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="5">★★★★★</TabsTrigger>
            <TabsTrigger value="4">★★★★☆</TabsTrigger>
            <TabsTrigger value="3">★★★☆☆</TabsTrigger>
            <TabsTrigger value="2">★★☆☆☆</TabsTrigger>
            <TabsTrigger value="1">★☆☆☆☆</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-32 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : ratedItems.length === 0 ? (
              <div className="text-center py-8">
                <Star className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">You haven't rated any items yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Rate menu items to see them appear here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filterItems(ratedItems).map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="flex h-full">
                      <div className="relative h-auto w-1/3">
                        <Image
                          src={item.picture || "/placeholder-food.jpg"}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-col justify-between w-2/3 p-3">
                        <CardContent className="p-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-base">{item.name}</h3>
                              <p className="text-sm text-muted-foreground">{item.restaurantName}</p>
                            </div>
                            <div className="flex gap-1">
                              <Badge variant={item.isVeg === 1 ? "default" : "destructive"} className="text-xs">
                                {item.isVeg === 1 ? "Veg" : "Non-Veg"}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {getSpicyLevelText(item.spicyLevel)}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="flex items-center">
                              <span className="text-sm font-medium mr-2">Your rating:</span>
                              <RatingStars initialRating={item.rating} readOnly={true} />
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="p-0 pt-3 flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => onViewDetails(item)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => onRateItem(item)}
                          >
                            <Star className="h-3 w-3 mr-1" />
                            Update
                          </Button>
                        </CardFooter>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
