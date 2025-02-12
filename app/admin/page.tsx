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
import { Restaurant } from '../types';
import { useState } from 'react';

export default function AdminDashboard() {
  const [pendingRestaurants] = useState<Restaurant[]>([
    {
      id: '1',
      name: 'Tasty Bites',
      email: 'contact@tastybites.com',
      phone: '+1234567890',
      address: '123 Food Street',
      isApproved: false,
      registrationCertificate: 'cert.jpg',
      panNumber: 'ABCDE1234F',
      panImage: 'pan.jpg',
    },
  ]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Pending Restaurant Approvals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingRestaurants.map((restaurant) => (
              <Card key={restaurant.id}>
                <CardHeader>
                  <CardTitle>{restaurant.name}</CardTitle>
                  <CardDescription>{restaurant.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Phone:</span> {restaurant.phone}
                    </p>
                    <p>
                      <span className="font-medium">Address:</span> {restaurant.address}
                    </p>
                    <p>
                      <span className="font-medium">PAN Number:</span> {restaurant.panNumber}
                    </p>
                    <div className="space-y-2 mt-4">
                      <p className="font-medium">Documents:</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Registration Certificate
                          </p>
                          <img
                            src={restaurant.registrationCertificate}
                            alt="Registration Certificate"
                            className="w-full h-32 object-cover rounded-md"
                          />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">PAN Card</p>
                          <img
                            src={restaurant.panImage}
                            alt="PAN Card"
                            className="w-full h-32 object-cover rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button variant="outline" color="red">
                    Reject
                  </Button>
                  <Button>Approve</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}