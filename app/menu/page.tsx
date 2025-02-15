"use client";

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { MenuItem } from '../components/menu/MenuItem';
import { Loader2 } from "lucide-react";

interface MenuItemType {
  id: number;
  name: string;
  cuisineId: number;
  categoryId: number;
  spicyLevel: number;
  isVeg: boolean;
  ingredients: string;
  image?: string;
  price: number;
}

// Define cuisine categories
const CUISINE_CATEGORIES = [
  { id: "all", name: "All Cuisines" },
  { id: "1", name: "Nepali" },
  { id: "2", name: "Italian" },
  { id: "3", name: "Chinese" },
  { id: "4", name: "Indian" }
] as const;

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCuisine, setSelectedCuisine] = useState<string>("all");
  const [spicyPreference, setSpicyPreference] = useState<number>(0);
  const [vegPreference, setVegPreference] = useState<boolean>(false);
  const [userInteractions, setUserInteractions] = useState<{
    viewDurations: { [key: number]: number };
    cartItems: number[];
  }>({
    viewDurations: {},
    cartItems: [],
  });

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/menu');
        if (!response.ok) {
          throw new Error('Failed to fetch menu items');
        }
        const data = await response.json();
        setMenuItems(data.menuItems || []); // Ensure we always set an array
      } catch (error) {
        console.error('Failed to fetch menu items:', error);
        setMenuItems([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  // Track view duration
  const handleViewDuration = async (itemId: number, duration: number) => {
    setUserInteractions(prev => ({
      ...prev,
      viewDurations: {
        ...prev.viewDurations,
        [itemId]: (prev.viewDurations[itemId] || 0) + duration,
      },
    }));

    // Send interaction data to the server
    try {
      await fetch('/api/recommendations/similar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: "user123", // Replace with actual user ID
          viewDuration: duration,
          menuItemId: itemId,
          spicyPreference,
          vegPreference,
          cuisinePreference: selectedCuisine !== "all" ? [parseInt(selectedCuisine)] : undefined,
        }),
      });
    } catch (error) {
      console.error('Failed to record interaction:', error);
    }
  };

  // Track add to cart
  const handleAddToCart = async (itemId: number) => {
    setUserInteractions(prev => ({
      ...prev,
      cartItems: [...prev.cartItems, itemId],
    }));

    // Send interaction data to the server
    try {
      await fetch('/api/recommendations/similar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: "user123", // Replace with actual user ID
          addToCart: true,
          menuItemId: itemId,
          spicyPreference,
          vegPreference,
          cuisinePreference: selectedCuisine !== "all" ? [parseInt(selectedCuisine)] : undefined,
        }),
      });
    } catch (error) {
      console.error('Failed to record interaction:', error);
    }
  };

  const filteredMenuItems = menuItems.filter(item => 
    (selectedCuisine === "all" || item.categoryId === parseInt(selectedCuisine)) &&
    (!vegPreference || item.isVeg) &&
    (spicyPreference === 0 || item.spicyLevel <= spicyPreference)
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 space-y-6">
        <h1 className="text-3xl font-bold">Menu</h1>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cuisine Filter */}
          <div className="space-y-2">
            <Label>Cuisine</Label>
            <Select
              value={selectedCuisine}
              onValueChange={setSelectedCuisine}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cuisine" />
              </SelectTrigger>
              <SelectContent>
                {CUISINE_CATEGORIES.map(cuisine => (
                  <SelectItem key={cuisine.id} value={cuisine.id}>
                    {cuisine.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Spicy Level Preference */}
          <div className="space-y-2">
            <Label>Spicy Preference</Label>
            <div className="flex items-center space-x-4">
              <Slider
                min={0}
                max={5}
                step={1}
                value={[spicyPreference]}
                onValueChange={([value]) => setSpicyPreference(value)}
              />
              <span className="w-12 text-sm">{spicyPreference}</span>
            </div>
          </div>

          {/* Vegetarian Preference */}
          <div className="flex items-center space-x-2">
            <Switch
              checked={vegPreference}
              onCheckedChange={setVegPreference}
            />
            <Label>Vegetarian Only</Label>
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredMenuItems.length > 0 ? (
          filteredMenuItems.map(item => (
            <MenuItem
              key={item.id}
              {...item}
              onAddToCart={() => handleAddToCart(item.id)}
              onView={(duration) => handleViewDuration(item.id, duration)}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            No menu items found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
}
