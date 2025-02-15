'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Order } from '@/app/types';
import { useState } from 'react';

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

export default function Profile() {
  const [user] = useState<User>({
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'customer',
    allergies: ['Peanuts', 'Shellfish'],
    address: '123 Main St',
    phone: '+1234567890',
  });

  const [orders] = useState<Order[]>([
    {
      id: '1',
      userId: '1',
      restaurantId: '1',
      items: [
        {
          id: '1',
          name: 'Margherita Pizza',
          description: 'Fresh tomatoes, mozzarella, and basil',
          price: 12.99,
          image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143',
          restaurantId: '1',
          quantity: 2,
          category: 'Main Course',
          isVegetarian: true,
          containsAllergens: ['Milk', 'Wheat'],
        },
      ],
      total: 25.98,
      status: 'delivered',
      createdAt: '2024-03-20T10:00:00Z',
      deliveryAddress: '123 Main St',
    },
  ]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        <Tabs defaultValue="profile">
          <TabsList className="mb-8">
            <TabsTrigger value="profile">Profile Details</TabsTrigger>
            <TabsTrigger value="orders">Order History</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" defaultValue={user.name} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" defaultValue={user.email} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" defaultValue={user.phone} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" defaultValue={user.address} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Food Allergies</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {allergens.map((allergen) => (
                        <div key={allergen} className="flex items-center space-x-2">
                          <Checkbox
                            id={`allergen-${allergen}`}
                            defaultChecked={user.allergies?.includes(allergen)}
                          />
                          <Label htmlFor={`allergen-${allergen}`}>{allergen}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button type="submit">Save Changes</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>Order #{order.id}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between py-2 border-b"
                          >
                            <div className="flex items-center space-x-4">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Quantity: {item.quantity}
                                </p>
                              </div>
                            </div>
                            <p className="font-semibold">${item.price * item.quantity}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Delivery Address:</p>
                          <p>{order.deliveryAddress}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total Amount:</p>
                          <p className="text-xl font-bold">${order.total}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            order.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}