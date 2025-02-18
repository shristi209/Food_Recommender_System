'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MenuItem {
  menuItemId: number;
  menuItemName: string;
  price: number;
  picture: string;
  spicyLevel: string;
  isVeg: boolean;
  ingredients: string;
  cuisineName: string;
  categoryName: string;
}

interface Restaurant {
  id: string;
  restaurantName: string;
  address: string;
  phone: string;
  menuItems: MenuItem[];
}

export default function ViewMenu() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchRestaurantMenu = async () => {
      try {
        const response = await axios.get('/api/restaurant/menu');
        const data = response.data;

        const menuItems = data.menuItems.map((item: MenuItem) => ({
          menuItemId: item.menuItemId,
          menuItemName: item.menuItemName,
          price: item.price,
          picture: item.picture,
          spicyLevel: item.spicyLevel,
          isVeg: item.isVeg,
          ingredients: item.ingredients,
          cuisineName: item.cuisineName,
          categoryName: item.categoryName,
        }));

        setRestaurant({
          id: data.id,
          restaurantName: data.restaurantName,
          address: data.address,
          phone: data.phone,
          menuItems,
        });
      } catch (error) {
        console.error('Error fetching menu:', error);
        toast({
          title: 'Error',
          description: 'Failed to load menu items',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantMenu();
  }, [toast]);

  const handleEdit = (menuItemId: number) => {
    router.push(`/dashboard/restaurant/editmenu/${menuItemId}`);
  };

  const handleDelete = async (menuItemId: number) => {
    setItemToDelete(menuItemId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await axios.delete(`/api/menu-item/${itemToDelete}`);
      
      // Update the UI
      if (restaurant) {
        const updatedMenuItems = restaurant.menuItems.filter(
          (item) => item.menuItemId !== itemToDelete
        );
        setRestaurant({ ...restaurant, menuItems: updatedMenuItems });
      }
      
      toast({
        title: 'Success',
        description: 'Menu item deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete menu item',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!restaurant) {
    return <div className="p-8">No restaurant data found</div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Menu Items</h2>
          <a href="/dashboard/restaurant/menu">
            <Button>Add New Item</Button>
          </a>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Cuisine</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Spicy Level</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {restaurant.menuItems.map((item) => (
                <TableRow key={item.menuItemId}>
                  <TableCell>
                    {item.picture && (
                      <div className="relative h-16 w-16">
                        <Image
                          src={item.picture}
                          alt={item.menuItemName}
                          fill
                          className="rounded-md object-cover"
                        />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{item.menuItemName}</TableCell>
                  <TableCell>Rs. {item.price}</TableCell>
                  <TableCell>{item.categoryName}</TableCell>
                  <TableCell>{item.cuisineName}</TableCell>
                  <TableCell>
                    <Badge variant={item.isVeg ? 'success' : 'destructive'}>
                      {item.isVeg ? 'Veg' : 'Non-veg'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.spicyLevel && (
                      <Badge variant="secondary">{item.spicyLevel}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(item.menuItemId)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(item.menuItemId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the menu item.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}