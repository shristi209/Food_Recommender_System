'use client';

import { useState, useEffect } from 'react';
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
// import toast from '@/components/toast';

interface Restaurant {
  id: string;
  restaurantName: string;
  email: string;
  address: string;
  registrationCertificate: string;
  panImage: string;
  panNumber: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

type RestaurantStatus = 'pending' | 'approved' | 'rejected';

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await axios.get('/api/restaurants');
        console.log('API Response:', response.data); // Debug log

        if (!Array.isArray(response.data)) {
          console.error('Expected array of restaurants, got:', typeof response.data);
          return;
        }

        const data = response.data.map((restaurant: any) => {
          // Ensure status is one of the valid values, default to 'pending' if invalid
          const status: RestaurantStatus = ['pending', 'approved', 'rejected'].includes(restaurant.status) 
            ? restaurant.status 
            : 'pending';
          
          // Log any restaurants with invalid status
          if (restaurant.status && !['pending', 'approved', 'rejected'].includes(restaurant.status)) {
            console.warn(`Restaurant ${restaurant.id} has invalid status: ${restaurant.status}`);
          }
          
          return {
            id: restaurant.id,
            restaurantName: restaurant.restaurantName,
            email: restaurant.email,
            address: restaurant.address,
            registrationCertificate: restaurant.registrationCertificate,
            panImage: restaurant.panImage,
            panNumber: restaurant.panNumber,
            phone: restaurant.phone,
            status,
            createdAt: restaurant.createdAt
          } as Restaurant;
        });

        console.log('Processed restaurants:', data); // Debug log
        setRestaurants(data);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        if (axios.isAxiosError(error)) {
          console.error('Response data:', error.response?.data);
        }
      }
    };

    fetchRestaurants();
  }, []);

  const handleStatusChange = async (id: string, newStatus: RestaurantStatus) => {
    // Store the current status to revert in case of error
    const currentRestaurant = restaurants.find(r => r.id === id);
    const oldStatus = currentRestaurant?.status || 'pending';

    // Optimistically update the UI
    setRestaurants(restaurants.map(restaurant =>
      restaurant.id === id ? { ...restaurant, status: newStatus } : restaurant
    ));

    try {
      const response = await axios.patch(`/api/restaurants/${id}/status`, {
        status: newStatus
      });

      const updatedRestaurant = response.data;
      
      // Ensure the response has the correct status type
      const typedRestaurant: Restaurant = {
        ...updatedRestaurant,
        status: updatedRestaurant.status as RestaurantStatus
      };

      // Update the local state with the response from the server
      setRestaurants(restaurants.map(restaurant =>
        restaurant.id === typedRestaurant.id ? typedRestaurant : restaurant
      ));
    } catch (error) {
      console.error('Error updating restaurant status:', error);
      // Revert status change in case of error
      setRestaurants(restaurants.map(restaurant =>
        restaurant.id === id ? { ...restaurant, status: oldStatus } : restaurant
      ));
      // Show error message to user
      // toast({
      //   title: "Error",
      //   description: "Failed to update restaurant status. Please try again.",
      //   variant: "destructive",
      // });
    }
  };

  // Filter the restaurants to show only the ones with a 'pending' status
  const pendingRestaurants = restaurants.filter(restaurant => restaurant.status === 'pending');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Pending Restaurants</h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage restaurant applications and approvals
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
        <ul role="list" className="divide-y divide-gray-200">
          {pendingRestaurants.map((restaurant) => (
            <li key={restaurant.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <BuildingStorefrontIcon className="h-6 w-6 text-gray-400" />
                    <div className="ml-4">
                      <h2 className="text-lg font-medium text-gray-900">{restaurant.restaurantName}</h2>
                      {/* <p className="text-sm text-gray-500">Email: {restaurant.email}</p> */}
                      <p className="text-sm text-gray-500">Address: {restaurant.address}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <h2 className="text-sm text-gray-500">PAN Number: {restaurant.panNumber}</h2>
                    <p className="text-sm text-gray-500">Phone: {restaurant.phone}</p>
                    <h2 className="text-sm text-gray-500">BusinessCertificate: {restaurant.registrationCertificate}</h2>
                    <p className="text-sm text-gray-500">
                      Joined: {new Date(restaurant.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="ml-6">
                  <span
                    className="inline-flex rounded-full px-3 py-1 text-sm font-semibold bg-yellow-100 text-yellow-800"
                  >
                    {restaurant.status}
                  </span>
                  <div className="mt-2 space-x-2">
                    <button
                      onClick={() => handleStatusChange(restaurant.id, 'approved')}
                      className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-sm font-medium text-green-700 hover:bg-green-100"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusChange(restaurant.id, 'rejected')}
                      className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-sm font-medium text-red-700 hover:bg-red-100"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
