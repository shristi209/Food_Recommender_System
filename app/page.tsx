'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { ShoppingCart, Eye, MapPin, Star, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from "next/navigation";
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MainNav } from './components/main-nav';
import { useInteractions } from '@/hooks/use-interactions';
import { PreferenceDialog } from './components/preference-dialog';
import { RecommendationInfo } from './components/recommendation-info';
import { RecommendationDetails } from './components/recommendation-details';
import { RatingModal } from './components/rating-modal';
import RatingStars from './components/RatingStars';
import type { RowDataPacket } from 'mysql2';
import { CartItem as CartItemType } from '@/app/types';

// Define types that were previously imported
export type RecommendationType = 'hybrid' | 'content-based' | 'collaborative' | 'popular';

export interface MatchingFactors {
  cuisine: boolean;
  category: boolean;
  spicyLevel: boolean;
  dietaryMatch: boolean;
}

interface MenuItem extends RowDataPacket {
  id: number;
  restaurantId: number;
  name: string;
  cuisineId: number;
  categoryId: number;
  spicyLevel: number;
  isVeg: number;  // TINYINT(1) in MySQL
  ingredients: string;
  vector: string;
  picture: string;
  price: number;
  createdAt: Date;
  // Joined fields
  restaurantName: string;
  cuisineName: string;
  categoryName: string;
}

interface Restaurant {
  restaurantName: string;
  address: string;
  phone: string;
  rating: number;
  description: string;
  menuItems: MenuItem[];
}

export interface RecommendationItem extends MenuItem {
  similarityScore?: number;
  predictedRating?: number;
  hybridScore?: number;
  explanation?: string;
  recommendationType?: RecommendationType;
  matchingFactors?: MatchingFactors;
}

interface RecommendationsData {
  type: RecommendationType;
  message: string;
  recommendations: RecommendationItem[];
  userPreferences?: {
    preferredCuisines: string[];
    spicyPreference: number;
    vegPreference: boolean;
    preferredCategories?: string[];
  };
  contentWeight?: number;
  collaborativeWeight?: number;
}

export default function Home() {
  const { isAuthenticated, user, logout } = useAuth();
  const { trackView, trackCartAdd, trackSearch, trackInteraction } = useInteractions();

  //core data
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationsData | null>(null);
  const [cuisines, setCuisines] = useState<Array<{
    id: number;
    name: string;
    categoryId: number;
    categoryName: string;
  }>>([]);

  //ui states
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  //search management
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  //Used to prevent duplicate tracking of the same search query
  const [lastTrackedQuery, setLastTrackedQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [restaurantMenuItems, setRestaurantMenuItems] = useState<MenuItem[]>([]);
  const [loadingRestaurant, setLoadingRestaurant] = useState(false);

  //Indicates if the user has any previous interactions with menu items
  const [hasInteractions, setHasInteractions] = useState(false);
  const [hasCheckedInteractions, setHasCheckedInteractions] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Rating related states
  const [userRatings, setUserRatings] = useState<Record<string | number, number>>({});
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [menuItemToRate, setMenuItemToRate] = useState<MenuItem | null>(null);
  const [loadingRatings, setLoadingRatings] = useState(false);

  useEffect(() => {
    fetchMenuItems();
    fetchCuisines(); 
    if (isAuthenticated) {
      fetchUserRatings();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && !hasInteractions && (cuisines || []).length > 0) {
      setShowPreferences(true);
    }
  }, [isAuthenticated, hasInteractions, cuisines]);

  useEffect(() => {
    if (isAuthenticated && !hasInteractions && !hasCheckedInteractions) {
      checkUserInteractions();
    }
  }, [isAuthenticated, hasInteractions, hasCheckedInteractions]);

  const checkUserInteractions = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/user-interactions?userId=${user.id}`);
      const data = await response.json();
      
      setHasInteractions(data.hasInteractions);
      setHasCheckedInteractions(true);
      
      if (!data.hasInteractions && cuisines.length > 0) {
        setShowPreferences(true);
      }
    } catch (error) {
      console.error('Failed to check user interactions:', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await fetch("/api/menu");
      if (!response.ok) {
        throw new Error("Failed to fetch menu items");
      }
      const data = await response.json();
      setMenuItems(data.menuItems || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch menu items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCuisines = async () => {
    try {
      const response = await fetch("/api/cuisines");
      if (!response.ok) {
        throw new Error("Failed to fetch cuisines");
      }
      const data = await response.json();
      setCuisines(data.cuisines || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch cuisines",
        variant: "destructive",
      });
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

  const [cart, setCart] = useState<CartItemType[]>([]);

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleAddToCart = (item: MenuItem) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to add items to cart",
        variant: "destructive",
      });
      return;
    }

    const cartItem: CartItemType = {
      id: item.id.toString(),
      name: item.name,
      description: item.ingredients || '',
      picture: item.picture,
      price: item.price,
      image: item.picture,
      restaurantId: item.restaurantId.toString(),
      category: item.categoryName,
      isVegetarian: item.isVeg === 1,
      containsAllergens: [], // Add allergen info if available
      quantity: 1
    };

    setCart(prevCart => {
      const existingItem = prevCart.find(i => i.id === cartItem.id);
      if (existingItem) {
        return prevCart.map(i =>
          i.id === cartItem.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prevCart, cartItem];
    });

    toast({
      title: "Added to Cart",
      description: `${item.name} has been added to your cart.`
    });
  };

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
      toast({
        title: 'Error',
        description: 'Failed to fetch restaurant details',
        variant: 'destructive',
      });
    } finally {
      setLoadingRestaurant(false);
    }
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (searchQuery) {
        setDebouncedQuery(searchQuery);
      }
    }, 500);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery);
    }
  }, [debouncedQuery]);

  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
  };

  const performSearch = async (query: string) => {
    try {
      const response = await fetch(`/api/menu-items/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setMenuItems(data);
      const timeout = setTimeout(() => {
        if (query && query !== lastTrackedQuery) {
          data.forEach((item: MenuItem) => {
            trackSearch(item.id);
          });
          setLastTrackedQuery(query);
        }
      }, 30000);
      setSearchTimeout(timeout);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch search results",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleViewDetails = (item: MenuItem, source: 'recommendation' | 'menu' = 'menu') => {
    setSelectedItem(item);
    trackInteraction({ 
      type: 'view', 
      itemId: item.id,
      metadata: { source }
    });
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/recommendations/hybrid');
      const data = await response.json();
      if (response.ok) {
        if (data.type === 'no_preferences') {
          // If no preferences, set recommendations to null and show preference dialog for authenticated users
          setRecommendations(null);
          if (isAuthenticated && cuisines.length > 0) {
            setShowPreferences(true);
            setHasInteractions(false); // Ensure hasInteractions is false to show the dialog
          } else if (isAuthenticated && cuisines.length === 0) {
            // If cuisines aren't loaded yet, fetch them and then check again
            await fetchCuisines();
            setShowPreferences(true);
            setHasInteractions(false);
          }
        } else {
          setRecommendations(data);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch recommendations",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch recommendations",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handlePreferenceClose = () => {
    setShowPreferences(false);
  };

  const handlePreferenceSave = async (preferences: {
    cuisineId: string;
    categoryId: string;
    spicyLevel: number;
    isVeg: boolean;
  }) => {
    if (!user?.id) return;

    try {
      await fetch('/api/user-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          ...preferences,
        }),
      });

      setShowPreferences(false);
      setHasInteractions(true);
      toast({
        title: "Preferences saved!",
        description: "We'll use these to show you better recommendations.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchUserRatings = async () => {
    if (!isAuthenticated) return;

    try {
      setLoadingRatings(true);
      const response = await fetch('/api/ratings/user');
      if (response.ok) {
        const data = await response.json();
        setUserRatings(data.ratings || {});
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch user ratings",
        variant: "destructive",
      });
    } finally {
      setLoadingRatings(false);
    }
  };

  const handleRateItem = (item: MenuItem, rating?: number) => {
    if (rating !== undefined) {
      // Direct rating update through RatingStars
      setUserRatings(prev => ({ ...prev, [item.id]: rating }));
      // Also update in backend
      fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menuId: item.id,
          rating: rating
        }),
      });
    } else {
      // Open rating modal
      setMenuItemToRate(item);
      setIsRatingModalOpen(true);
    }
  };

  const handleRatingSubmit = () => {
    fetchUserRatings();
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
        onRemoveFromCart={(itemId) => {
          setCart((currentCart) => {
            const existingItem = currentCart.find((item) => item.id === itemId);
            if (existingItem && existingItem.quantity > 1) {
              return currentCart.map((item) =>
                item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item
              );
            }
            return currentCart.filter((item) => item.id !== itemId);
          });
        }}
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
      <main className="container mx-auto px-4 py-8">
        <PreferenceDialog
          open={showPreferences}
          onClose={handlePreferenceClose}
          onSave={handlePreferenceSave}
          cuisines={cuisines}
          userId={user?.id}
        />
        {recommendations ? (
          <>
            <div className="mb-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Recommended For You</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {recommendations.type === 'hybrid' && (
                      <Badge className="bg-gradient-to-r from-blue-500 to-purple-500">
                        Hybrid Recommendations
                      </Badge>
                    )}
                    {recommendations.type === 'content-based' && (
                      <Badge className="bg-blue-500">
                        Content-Based Recommendations
                      </Badge>
                    )}
                    {recommendations.type === 'collaborative' && (
                      <Badge className="bg-purple-500">
                        Collaborative Recommendations
                      </Badge>
                    )}
                    {recommendations.type === 'popular' && (
                      <Badge className="bg-green-500">
                        Popular Items
                      </Badge>
                    )}
                    <RecommendationInfo />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {recommendations.message}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {recommendations.recommendations.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative bg-card rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <div className="absolute top-2 left-2 z-10 bg-black bg-opacity-70 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                      #{index + 1}
                    </div>

                    {item.hybridScore !== undefined && (
                      <div className="absolute top-0 right-0 z-10 bg-gradient-to-l from-blue-500 to-purple-500 text-white px-3 py-2 rounded-bl-lg flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                        <div>
                          <div className="text-xs opacity-90">Match Score</div>
                          <div className="font-bold">{Math.round(item.hybridScore * 100)}%</div>
                        </div>
                      </div>
                    )}

                    <div className="relative h-48">
                      <Image
                        src={item.picture || '/placeholder.jpg'}
                        alt={item.name}
                        fill
                        className="object-cover" />
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                      <p className="text-muted-foreground text-sm mb-2">{item.description}</p>

                      <div className="flex items-center justify-between mb-2">
                        <span className="text-primary font-bold">
                          Rs. {typeof item.price === 'string'
                            ? parseFloat(item.price).toFixed(2)
                            : item.price.toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground">{item.restaurantName}</span>
                      </div>

                      {item.matchingFactors && (
                        <div className="mt-2 space-y-1">
                          <div className="text-xs text-muted-foreground">Why this matches you:</div>
                          <div className="flex flex-wrap gap-1">
                            {item.matchingFactors.cuisine && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                Cuisine
                              </span>
                            )}
                            {item.matchingFactors.category && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                Category
                              </span>
                            )}
                            {item.matchingFactors.spicyLevel && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                Spice Level
                              </span>
                            )}
                            {item.matchingFactors.dietaryMatch && (
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                Dietary
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-2">
                        <RecommendationDetails
                          type={item.recommendationType || recommendations.type}
                          similarityScore={item.similarityScore}
                          predictedRating={item.predictedRating}
                          hybridScore={item.hybridScore}
                          matchingFactors={item.matchingFactors}
                          explanation={item.explanation}
                          itemName={item.name}
                          cuisineName={item.cuisineName}
                          categoryName={item.categoryName}
                          spicyLevel={item.spicyLevel}
                          isVeg={item.isVeg} />
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleViewDetails(item, 'recommendation')}
                            variant="outline"
                            className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200 hover:border-orange-300"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          <Button
                            onClick={() => handleAddToCart(item)}
                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Add to Cart
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200 hover:border-orange-300"
                            onClick={() => router.push(`/restaurant/${item.restaurantId}`)}
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            Restaurant
                          </Button>
                          {isAuthenticated && (
                            <Button
                              variant="secondary"
                              className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200 hover:border-orange-300"
                              onClick={() => handleRateItem(item)}
                            >
                              <Star className="h-4 w-4 mr-2" />
                              {userRatings[item.id] ? 'Update Rating' : 'Rate'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {isAuthenticated && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6">All Menu Items</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {menuItems
                    .filter((item) => searchQuery === '' ||
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
                            className="object-cover" />
                          <div className="absolute top-2 right-2 flex gap-2">
                            <Badge variant={item.isVeg === 1 ? "secondary" : "destructive"}>
                              {item.isVeg === 1 ? "Veg" : "Non-Veg"}
                            </Badge>
                            <Badge variant="secondary">
                              {getSpicyLevelText(item.spicyLevel)}
                            </Badge>
                          </div>

                          {isAuthenticated && userRatings[item.id] && (
                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-md flex items-center">
                              <Star className="h-3 w-3 text-yellow-400 mr-1 fill-current" />
                              <span className="text-sm font-medium">{userRatings[item.id]}</span>
                            </div>
                          )}
                        </div>

                        <CardHeader>
                          <CardTitle className="flex justify-between items-center">
                            <span>{item.name}</span>
                            <span className="text-lg font-semibold">Rs. {typeof item.price === 'string'
                              ? parseFloat(item.price).toFixed(2)
                              : item.price.toFixed(2)}</span>
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

                          {isAuthenticated && userRatings[item.id] && (
                            <div className="mt-2 flex items-center">
                              <div className="text-sm font-medium mr-2">Your rating:</div>
                              <RatingStars
                                value={userRatings[item.id] || 0}
                                onChange={rating => handleRateItem(item, rating)}
                              />
                            </div>
                          )}
                        </CardContent>

                        <CardFooter className="flex flex-col gap-2">
                          <div className="flex gap-2 w-full">
                            <Button
                              variant="outline"
                              className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200 hover:border-orange-300"
                              onClick={() => handleViewDetails(item, 'menu')}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button
                              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                              onClick={() => handleAddToCart(item)}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Add to Cart
                            </Button>
                          </div>
                          <div className="flex gap-2 w-full">
                            <Button
                              variant="secondary"
                              className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200 hover:border-orange-300"
                              onClick={() => router.push(`/restaurant/${item.restaurantId}`)}
                            >
                              <MapPin className="h-4 w-4 mr-2" />
                              Restaurant
                            </Button>
                            {isAuthenticated && (
                              <Button
                                variant="secondary"
                                className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200 hover:border-orange-300"
                                onClick={() => handleRateItem(item)}
                              >
                                <Star className="h-4 w-4 mr-2" />
                                {userRatings[item.id] ? 'Update Rating' : 'Rate'}
                              </Button>
                            )}
                          </div>
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
              </div>
            )}
          </>
        ) : (
          <div className="mb-12">
            {!isAuthenticated && (
              <div className="bg-muted p-4 rounded-lg mb-6">
                <h3 className="font-medium mb-2">Welcome to Food Recommendation System</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Log in to get personalized food recommendations based on your preferences and ratings.
                </p>
              </div>
            )}
            
            <h2 className="text-2xl font-bold mb-6">All Menu Items</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {menuItems
                .filter((item) => searchQuery === '' ||
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
                        <Badge variant={item.isVeg === 1 ? "secondary" : "destructive"}>
                          {item.isVeg === 1 ? "Veg" : "Non-Veg"}
                        </Badge>
                        <Badge variant="secondary">
                          {getSpicyLevelText(item.spicyLevel)}
                        </Badge>
                      </div>

                      {isAuthenticated && userRatings[item.id] && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-md flex items-center">
                          <Star className="h-3 w-3 text-yellow-400 mr-1 fill-current" />
                          <span className="text-sm font-medium">{userRatings[item.id]}</span>
                        </div>
                      )}
                    </div>

                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>{item.name}</span>
                        <span className="text-lg font-semibold">Rs. {typeof item.price === 'string'
                          ? parseFloat(item.price).toFixed(2)
                          : item.price.toFixed(2)}</span>
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

                      {isAuthenticated && userRatings[item.id] && (
                        <div className="mt-2 flex items-center">
                          <div className="text-sm font-medium mr-2">Your rating:</div>
                          <RatingStars
                            value={userRatings[item.id] || 0}
                            onChange={rating => handleRateItem(item, rating)}
                          />
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="flex flex-col gap-2">
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="outline"
                          className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200 hover:border-orange-300"
                          onClick={() => handleViewDetails(item, 'menu')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                          onClick={() => handleAddToCart(item)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                      </div>
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="secondary"
                          className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200 hover:border-orange-300"
                          onClick={() => router.push(`/restaurant/${item.restaurantId}`)}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Restaurant
                        </Button>
                        {isAuthenticated && (
                          <Button
                            variant="secondary"
                            className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200 hover:border-orange-300"
                            onClick={() => handleRateItem(item)}
                          >
                            <Star className="h-4 w-4 mr-2" />
                            {userRatings[item.id] ? 'Update Rating' : 'Rate'}
                          </Button>
                        )}
                      </div>
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
          </div>
        )}
      </main>
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
                  className="object-cover rounded-lg" />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Badge variant={selectedItem.isVeg === 1 ? 'secondary' : 'destructive'}>
                    {selectedItem.isVeg === 1 ? 'Veg' : 'Non-Veg'}
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
                  <span className="text-xl font-semibold">Rs. {typeof selectedItem.price === 'string'
                    ? parseFloat(selectedItem.price).toFixed(2)
                    : selectedItem.price.toFixed(2)}</span>
                </div>

                {isAuthenticated && userRatings[selectedItem.id] && (
                  <div className="flex items-center">
                    <div className="text-sm font-medium mr-2">Your rating:</div>
                    <RatingStars
                      value={userRatings[selectedItem.id] || 0}
                      onChange={rating => handleRateItem(selectedItem, rating)}
                    />
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Ingredients</h3>
                  <p className="text-muted-foreground">{selectedItem.ingredients}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Restaurant</h3>
                  <p className="font-medium">{selectedItem.restaurantName}</p>
                </div>
                <div className="flex justify-between">
                  <Button
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => handleAddToCart(selectedItem)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                  {isAuthenticated && (
                    <Button
                      variant="secondary"
                      className="bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200 hover:border-orange-300"
                      onClick={() => {
                        setMenuItemToRate(selectedItem);
                        setIsRatingModalOpen(true);
                      }}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      {userRatings[selectedItem.id] ? 'Update Rating' : 'Rate This Item'}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
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
          ) : selectedRestaurant ? (
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
                {restaurantMenuItems.length === 0 ? (
                  <div>No menu items available.</div>
                ) : (
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
                            <Badge variant={menuItem.isVeg === 1 ? 'secondary' : 'destructive'}>
                              {menuItem.isVeg === 1 ? 'Veg' : 'Non-Veg'}
                            </Badge>
                            <Badge variant="secondary">
                              {getSpicyLevelText(menuItem.spicyLevel)}
                            </Badge>
                          </div>
                        </div>

                        <CardHeader>
                          <CardTitle className="flex justify-between items-center">
                            <span>{menuItem.name}</span>
                            <span className="text-lg font-semibold">
                              Rs. {typeof menuItem.price === 'string'
                                ? parseFloat(menuItem.price).toFixed(2)
                                : menuItem.price.toFixed(2)}
                            </span>
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
                              className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200 hover:border-orange-300"
                              onClick={() => handleViewDetails(menuItem, 'menu')}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button
                              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
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
                )}
              </div>
            </>
          ) : (
            <div>No restaurant selected</div>
          )}
        </DialogContent>
      </Dialog>

      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        menuItem={menuItemToRate}
        onRatingSubmit={handleRatingSubmit} />
    </div>
  );
}