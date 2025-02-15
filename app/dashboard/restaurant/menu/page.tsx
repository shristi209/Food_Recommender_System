'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import axios from 'axios';

// Define the form schema
const menuItemSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  cuisineId: z.string({
    required_error: "Please select a cuisine.",
  }),
  spicyLevel: z.string({
    required_error: "Please select a spicy level.",
  }),
  isVeg: z.boolean().default(false),
  ingredients: z.string().min(2, {
    message: "Please list the ingredients.",
  }),
  price: z.coerce.number().min(0, {
    message: "Price must be a positive number.",
  }),
  picture: z.string().optional(),
});

// Spicy levels
const SPICY_LEVELS = [
  { value: "0", label: "Not Spicy" },
  { value: "1", label: "Mild" },
  { value: "2", label: "Medium" },
  { value: "3", label: "Hot" },
  { value: "4", label: "Very Hot" },
  { value: "5", label: "Extra Hot" },
];

export default function MenuPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cuisines, setCuisines] = useState<Array<{ id: number; name: string; categoryId: number }>>([]);
  const [loadingCuisines, setLoadingCuisines] = useState(true);

  useEffect(() => {
    async function fetchCuisines() {
      try {
        const response = await fetch('/api/menu');
        if (!response.ok) {
          throw new Error('Failed to fetch cuisines');
        }
        const data = await response.json();
        // Convert cuisine IDs to strings for the form
        setCuisines(data.cuisines.map((cuisine: any) => ({
          ...cuisine,
          id: cuisine.id.toString()
        })));
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load cuisines",
          variant: "destructive",
        });
      } finally {
        setLoadingCuisines(false);
      }
    }

    fetchCuisines();
  }, [toast]);

  const form = useForm<z.infer<typeof menuItemSchema>>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      cuisineId: "",
      spicyLevel: "",
      isVeg: false,
      ingredients: "",
      price: 0,
      picture: "",
    },
  });

  async function onSubmit(values: z.infer<typeof menuItemSchema>) {
    try {
      setLoading(true);
      // console.log("values...........................", values);

      const price = Number(values.price);

      const selectedCuisine = cuisines.find(c => c.id.toString() === values.cuisineId);
      // console.log("selectedCuisine...........................", selectedCuisine);
      if (!selectedCuisine) {
        toast({
          title: "Error",
          description: "Please select a valid cuisine",
          variant: "destructive",
        });
        return;
      }
      // console.log("selectedCuisine.categoryId...........................", selectedCuisine.categoryId);

      const response = await axios.post('/api/menu', {
        name: values.name,
        cuisineId: values.cuisineId,
        categoryId: selectedCuisine.categoryId,
        spicyLevel: values.spicyLevel,
        isVeg: values.isVeg,
        ingredients: values.ingredients,
        price: price,
        picture: values.picture,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': document.cookie
        },
        withCredentials: true
      });

      if (response.status !== 200) {
        throw new Error('Failed to add menu item');
      }

      toast({
        title: "Success",
        description: "Menu item added successfully",
      });

      form.reset();
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add menu item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl">
      <Card className="bg-white shadow-lg">
        <CardHeader className="space-y-1 border-b pb-4">
          <CardTitle className="text-2xl font-bold text-gray-900">Add Menu Item</CardTitle>
          <CardDescription className="text-gray-500">
            Add a new delicious item to your restaurant's menu
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">

              {/* Cuisine */}
              <FormField
                control={form.control}
                name="cuisineId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-200 font-medium">Cuisine</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loadingCuisines}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary">
                          <SelectValue placeholder={loadingCuisines ? "Loading cuisines..." : "Select a cuisine"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                        {cuisines.map((cuisine) => (
                          <SelectItem
                            key={cuisine.id}
                            value={cuisine.id.toString()}
                            className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            {cuisine.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-gray-500 dark:text-gray-400 text-sm">
                      Select the cuisine type
                    </FormDescription>
                    <FormMessage className="text-red-500 dark:text-red-400" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter dish name" className="focus:ring-2 focus:ring-primary" {...field} />
                      </FormControl>
                      <FormDescription className="text-gray-500 text-sm">
                        The name of your dish
                      </FormDescription>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                {/* Price */}
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-200 font-medium">Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === '' ? '' : Number(value));
                          }}
                          value={field.value === 0 ? '' : field.value}
                        />
                      </FormControl>
                      <FormDescription className="text-gray-500 dark:text-gray-400 text-sm">
                        Enter the price in your local currency
                      </FormDescription>
                      <FormMessage className="text-red-500 dark:text-red-400" />
                    </FormItem>
                  )}
                />


                {/* Spicy Level */}
                <FormField
                  control={form.control}
                  name="spicyLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Spicy Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="focus:ring-2 focus:ring-primary">
                            <SelectValue placeholder="Select spicy level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SPICY_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-gray-500 text-sm">
                        How spicy is your dish?
                      </FormDescription>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Ingredients */}
              <FormField
                control={form.control}
                name="ingredients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Ingredients</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Tomatoes, Onions, Garlic"
                        className="focus:ring-2 focus:ring-primary"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-gray-500 text-sm">
                      List the main ingredients (comma separated)
                    </FormDescription>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              {/* Image URL */}
              <FormField
                control={form.control}
                name="picture"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Image URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        className="focus:ring-2 focus:ring-primary"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-gray-500 text-sm">
                      Provide a URL for your dish's image
                    </FormDescription>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              {/* Vegetarian Checkbox */}
              <FormField
                control={form.control}
                name="isVeg"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-primary"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-gray-700 font-medium">
                        Vegetarian
                      </FormLabel>
                      <FormDescription className="text-gray-500 text-sm">
                        Check if this is a vegetarian dish
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Menu Item
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
