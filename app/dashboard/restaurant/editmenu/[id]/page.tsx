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
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import axios from 'axios';
import { useRouter } from 'next/navigation';

// Define the form schema
const menuItemSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  cuisineId: z.string({
    required_error: "Please select a cuisine.",
  }),
  categoryId: z.string({
    required_error: "Please select a category.",
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

type MenuItemFormValues = z.infer<typeof menuItemSchema>;

// Spicy levels
const SPICY_LEVELS = [
  { value: "Not Spicy", label: "Not Spicy" },
  { value: "Mild", label: "Mild" },
  { value: "Medium", label: "Medium" },
  { value: "Hot", label: "Hot" },
  { value: "Very Hot", label: "Very Hot" },
  { value: "Extra Hot", label: "Extra Hot" },
];

export default function EditMenuPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cuisines, setCuisines] = useState<Array<{ id: number; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      cuisineId: "",
      categoryId: "",
      spicyLevel: "",
      isVeg: false,
      ingredients: "",
      price: 0,
      picture: "",
    },
  });

  // Fetch cuisines and categories
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get('/api/menu/data');
        const { cuisines, categories } = response.data;
        
        // Convert IDs to strings for the form
        setCuisines(cuisines.map((cuisine: any) => ({
          id: cuisine.id,
          name: cuisine.name
        })));
        setCategories(categories.map((category: any) => ({
          id: category.id,
          name: category.name
        })));
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load form data",
          variant: "destructive",
        });
      }
    }

    fetchData();
  }, [toast]);

  // Fetch menu item data
  useEffect(() => {
    async function fetchMenuItem() {
      try {
        const response = await axios.get(`/api/menu-item/${params.id}`);
        const item = response.data;
        
        form.reset({
          name: item.menuItemName,
          cuisineId: item.cuisineId.toString(),
          categoryId: item.categoryId.toString(),
          spicyLevel: item.spicyLevel,
          isVeg: item.isVeg,
          ingredients: item.ingredients,
          price: item.price,
          picture: item.picture || "",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load menu item",
          variant: "destructive",
        });
        router.push('/dashboard/restaurant/viewmenu');
      } finally {
        setInitialLoading(false);
      }
    }

    fetchMenuItem();
  }, [params.id, form, toast, router]);

  async function onSubmit(data: MenuItemFormValues) {
    setLoading(true);
    try {
      await axios.put(`/api/menu-item/${params.id}`, data);
      
      toast({
        title: "Success",
        description: "Menu item updated successfully",
      });
      
      router.push('/dashboard/restaurant/viewmenu');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update menu item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Edit Menu Item</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Menu Item Details</CardTitle>
          <CardDescription>
            Update the details of your menu item.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cuisineId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cuisine</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cuisine" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cuisines.map((cuisine) => (
                            <SelectItem
                              key={cuisine.id}
                              value={cuisine.id.toString()}
                            >
                              {cuisine.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem
                              key={category.id}
                              value={category.id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Price"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="spicyLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Spicy Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select spicy level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SPICY_LEVELS.map((level) => (
                            <SelectItem
                              key={level.value}
                              value={level.value}
                            >
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="ingredients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ingredients</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="List the ingredients"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Separate ingredients with commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="picture"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Picture URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Image URL"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isVeg"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Vegetarian</FormLabel>
                      <FormDescription>
                        Check if this item is vegetarian
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/restaurant/viewmenu')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Menu Item
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
