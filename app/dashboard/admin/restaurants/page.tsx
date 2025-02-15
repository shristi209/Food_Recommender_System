'use client';

import { useState, useEffect } from 'react';
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline';

interface Restaurant {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  address: string;
  createdAt: string;
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([
    {
      id: '1',
      name: 'Pizza Palace',
      email: 'info@pizzapalace.com',
      status: 'approved',
      address: '123 Main St, City',
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      name: 'Burger House',
      email: 'contact@burgerhouse.com',
      status: 'pending',
      address: '456 Oak St, City',
      createdAt: '2024-02-01',
    },
  ]);

  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected') => {
    // TODO: Implement status change API call
    setRestaurants(restaurants.map(restaurant => 
      restaurant.id === id ? { ...restaurant, status: newStatus } : restaurant
    ));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Restaurants</h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage restaurant applications and approvals
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
        <ul role="list" className="divide-y divide-gray-200">
          {restaurants.map((restaurant) => (
            <li key={restaurant.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <BuildingStorefrontIcon className="h-6 w-6 text-gray-400" />
                    <div className="ml-4">
                      <h2 className="text-lg font-medium text-gray-900">{restaurant.name}</h2>
                      <p className="text-sm text-gray-500">{restaurant.email}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">{restaurant.address}</p>
                    <p className="text-sm text-gray-500">
                      Joined: {new Date(restaurant.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="ml-6">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                      restaurant.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : restaurant.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {restaurant.status}
                  </span>
                  {restaurant.status === 'pending' && (
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
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
