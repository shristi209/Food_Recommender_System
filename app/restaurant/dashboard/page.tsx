'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { MenuItem } from '@/app/types';
import { useState } from 'react';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

const allergens = [
  'Milk',
  'Eggs',
  'Fish',
  'Shellfish',
  'Tree nuts',
  'Peanuts',
  'Wheat',
  'Soy',
];

const categories = [
  'Appetizers',
  'Main Course',
  'Desserts',
  'Beverages',
  'Sides',
  'Specials',
];

export default function RestaurantDashboard() {
  const [menuItems] = useState<MenuItem[]>([
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
  ]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Restaurant Dashboard</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Menu Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Menu Item</DialogTitle>
              </DialogHeader>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name</Label>
                    <Input id="name" placeholder="Enter item name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input id="price" type="number" step="0.01" placeholder="0.00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter item description"
                    className="h-20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Image URL</Label>
                  <Input id="image" placeholder="Enter image URL" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Allergens</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {allergens.map((allergen) => (
                      <div key={allergen} className="flex items-center space-x-2">
                        <Checkbox id={`allergen-${allergen}`} />
                        <Label htmlFor={`allergen-${allergen}`}>{allergen}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="vegetarian" />
                  <Label htmlFor="vegetarian">Vegetarian</Label>
                </div>
                <Button type="submit" className="w-full">
                  Add Item
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
                <div className="space-y-2">
                  <p className="text-lg font-semibold">${item.price}</p>
                  <p className="text-sm text-muted-foreground">Category: {item.category}</p>
                  {item.isVegetarian && (
                    <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                      Vegetarian
                    </span>
                  )}
                  {item.containsAllergens.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Contains:</span>{' '}
                      {item.containsAllergens.join(', ')}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}