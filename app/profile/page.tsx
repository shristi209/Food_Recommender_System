'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import RatingStars from '../components/RatingStars';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  restaurantId?: string;
}

interface MenuItem {
  id: number;
  name: string;
  picture?: string;
  description: string;
  price: number;
  categoryName?: string;
  cuisineName?: string;
  isVeg?: boolean;
  spicyLevel?: number;
}

interface UserPreference {
  userId: number;
  preferredCuisineId: number;
  preferredCategoryId: number;
  spicyPreference: number;
  vegPreference: boolean;
  cuisineName?: string;
  categoryName?: string;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [menuItems, setMenuItems] = useState<Record<string, MenuItem>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [recentRecommendations, setRecentRecommendations] = useState<number>(0);
  const [recommendationType, setRecommendationType] = useState<string>('');

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch user data
        const userResponse = await fetch('/api/auth/me');
        const userData = await userResponse.json();

        if (!userData.authenticated) {
          setIsLoading(false);
          return;
        }

        setUser(userData.user);
        console.log('User data:', userData.user);

        // 2. Fetch user ratings
        const ratingsResponse = await fetch('/api/ratings/user');
        const ratingsData = await ratingsResponse.json();

        if (ratingsData && ratingsData.ratings) {
          setUserRatings(ratingsData.ratings);
          console.log('User ratings:', ratingsData.ratings);

          // 3. If we have ratings, fetch the menu items
          if (Object.keys(ratingsData.ratings).length > 0) {
            const menuItemIds = Object.keys(ratingsData.ratings).map(id => parseInt(id));
            console.log('Menu item IDs to fetch:', menuItemIds);

            try {
              const menuItemsResponse = await fetch('/api/menu-items/byIds', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ids: menuItemIds }),
              });

              if (!menuItemsResponse.ok) {
                throw new Error(`HTTP error! Status: ${menuItemsResponse.status}`);
              }

              const menuItemsData = await menuItemsResponse.json();
              console.log('Menu items response:', menuItemsData);

              if (menuItemsData.menuItems && Array.isArray(menuItemsData.menuItems)) {
                // Create a map of menu items by ID for easy lookup
                const menuItemsMap: Record<string, MenuItem> = {};
                menuItemsData.menuItems.forEach((item: MenuItem) => {
                  // Ensure we're using string keys for the map
                  menuItemsMap[String(item.id)] = item;
                });

                setMenuItems(menuItemsMap);
                console.log('Menu items map:', menuItemsMap);
              } else {
                console.error('Invalid menu items response:', menuItemsData);
              }
            } catch (error) {
              console.error('Error fetching menu items:', error);
            }
          }
        }

        // 4. Determine recommendation type based on ratings count
        const numRatings = ratingsData?.ratings ? Object.keys(ratingsData.ratings).length : 0;
        if (numRatings >= 10) {
          setRecommendationType('hybrid');
          setRecentRecommendations(Math.floor(Math.random() * 10) + 10); // Random number between 10-20 for demo
        } else if (numRatings > 0) {
          setRecommendationType('content-based');
          setRecentRecommendations(Math.floor(Math.random() * 5) + 5); // Random number between 5-10 for demo
        } else {
          setRecommendationType('popular');
          setRecentRecommendations(Math.floor(Math.random() * 5) + 1); // Random number between 1-5 for demo
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);


  const getRecommendationTypeText = (type: string) => {
    switch (type) {
      case 'hybrid':
        return {
          title: 'Hybrid Recommendations',
          description: 'You receive a blend of content-based (60%) and collaborative filtering (40%) recommendations, using both your food preferences and rating patterns from similar users.'
        };
      case 'content-based':
        return {
          title: 'Content-Based Recommendations',
          description: 'Recommendations are based on the food characteristics you prefer, such as cuisine type, category, and spice level.'
        };
      case 'popular':
        return {
          title: 'Popular Items',
          description: 'You see generally popular items since we don\'t have enough rating data to personalize recommendations yet.'
        };
      default:
        return {
          title: 'Recommendations',
          description: 'Food items curated for you.'
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">My Profile</h1>
          <div className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">My Profile</h1>
          <Card>
            <CardContent className="p-6">
              <p>Please log in to view your profile.</p>
              <Button className="mt-4" onClick={() => window.location.href = '/login'}>
                Log In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const recommendationInfo = getRecommendationTypeText(recommendationType);
  const ratedMenuItems = Object.entries(userRatings)
    .map(([menuId, rating]) => {
      // Only include items that have data from the menu items fetch
      if (menuItems[menuId]) {
        return {
          ...menuItems[menuId],
          rating: rating
        };
      }
      return null;
    })
    .filter(Boolean); // Remove null entries

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <Avatar className="h-16 w-16">
            <AvatarImage src={`https://avatar.vercel.sh/${user.name}`} />
            <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="profile">Profile Details</TabsTrigger>
            <TabsTrigger value="preferences">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">Name</h3>
                      <p>{user.name}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium">Email</h3>
                      <p>{user.email}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium">Role</h3>
                      <p className="capitalize">{user.role}</p>
                    </div>
                    {user.restaurantId && (
                      <div className="space-y-2">
                        <h3 className="font-medium">Restaurant ID</h3>
                        <p>{user.restaurantId}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Recommendation System</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <h3 className="font-medium text-lg">{recommendationInfo.title}</h3>
                    <p className="text-muted-foreground mt-1">{recommendationInfo.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Items Rated</p>
                      <p className="text-2xl font-bold">{Object.keys(userRatings).length}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Recent Recommendations</p>
                      <p className="text-2xl font-bold">{recentRecommendations}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Needed for Hybrid</p>
                      <p className="text-2xl font-bold">{Math.max(0, 10 - Object.keys(userRatings).length)} more</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Recommendation Engine Progress</h4>
                    <div className="w-full h-2 bg-muted rounded-full mt-2">
                      <div 
                        className="h-2 bg-primary rounded-full" 
                        style={{ width: `${Math.min(100, (Object.keys(userRatings).length / 10) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">Popular</span>
                      <span className="text-xs text-muted-foreground">Content-Based</span>
                      <span className="text-xs text-muted-foreground">Hybrid</span>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-lg border">
                    <h4 className="font-medium text-md mb-2">How Our Recommendations Work</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start">
                        <span className="font-semibold mr-2">• Popular Items:</span>
                        <span>When you have no ratings, we show generally popular items.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold mr-2">• Content-Based:</span>
                        <span>With 1-9 ratings, we analyze food characteristics you prefer (cuisine, category, spice level).</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold mr-2">• Hybrid System:</span>
                        <span>With 10+ ratings, we combine content-based (60%) with collaborative filtering (40%) for better recommendations.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => window.location.href = '/'}>
                      Explore More Recommendations
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}