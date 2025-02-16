'use client';

import { useState, useEffect } from 'react';
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface Restaurant {
  id: string;
  restaurantName: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  address: string;
  registrationCertificate: string;
  panImage: string;
  panNumber: string;
  phone: string;
  createdAt: string;
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    async function fetchRestaurants() {
      try {
        const response = await fetch('/api/restaurants');
        if (!response.ok) {
          throw new Error('Failed to fetch restaurants');
        }
        const data = await response.json();
        setRestaurants(data.restaurants);
      } catch (error) {
        console.error('Failed to fetch restaurants:', error);
      }
    }
    fetchRestaurants();
  }, []);

  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected') => {
    // Optimistically update the UI
    setRestaurants(restaurants.map(restaurant =>
      restaurant.id === id ? { ...restaurant, status: newStatus } : restaurant
    ));

    try {
      const response = await fetch(`/api/restaurants/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update restaurant status');
      }

      const updatedRestaurant = await response.json();
      // Optionally, update the local state if necessary
      setRestaurants(restaurants.map(restaurant =>
        restaurant.id === updatedRestaurant.id ? updatedRestaurant : restaurant
      ));
    } catch (error) {
      console.error('Error updating restaurant status:', error);
      // Revert status change in case of error
      setRestaurants(restaurants.map(restaurant =>
        restaurant.id === id ? { ...restaurant, status: 'pending' } : restaurant
      ));
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
