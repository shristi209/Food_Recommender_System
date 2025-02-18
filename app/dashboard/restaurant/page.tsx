'use client';

import { useEffect, useState } from 'react';
import { 
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  UserIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface StatsCard {
  name: string;
  value: string;
  icon: React.ElementType;
  change: string;
  trend: 'up' | 'down';
}

interface RecentOrder {
  id: string;
  customer: string;
  items: string[];
  total: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  time: string;
}

export default function RestaurantDashboard() {
  const [stats, setStats] = useState<StatsCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/restaurant/stats');
        const data = await response.json();

        setStats([
          {
            name: 'Today\'s Active Users',
            value: data.todayOrders.count.toString(),
            icon: UserIcon,
            change: `${data.todayOrders.change}%`,
            trend: data.todayOrders.trend,
          },
          {
            name: 'Today\'s Cart Adds',
            value: data.todayRevenue.amount.toString(),
            icon: ClipboardDocumentListIcon,
            change: `${data.todayRevenue.change}%`,
            trend: data.todayRevenue.trend,
          },
          {
            name: 'Total Tracking Users',
            value: data.trackingUsers.count.toString(),
            icon: UserIcon,
            change: data.trackingUsers.change,
            trend: data.trackingUsers.trend,
          },
          {
            name: 'Items in Cart',
            value: data.cartItems.count.toString(),
            icon: StarIcon,
            change: data.cartItems.change,
            trend: data.cartItems.trend,
          },
        ]);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);


  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Restaurant Dashboard</h1>
        <p className="mt-2 text-sm text-gray-700">
          Overview of your restaurant's performance and customer engagement
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          // Loading skeleton
          [...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <div className="h-8 w-3/4 bg-gray-200 rounded"></div>
              <div className="mt-4 h-6 w-1/2 bg-gray-200 rounded"></div>
            </div>
          ))
        ) : (
          stats.map((stat) => (
            <div
              key={stat.name}
              className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">{stat.name}</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stat.value}</div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <span
                  className={`inline-flex items-baseline text-sm font-semibold ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.change}
                </span>
                <span className="ml-2 text-sm text-gray-500">from yesterday</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent Orders */}
      {/* <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
        <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
          <ul role="list" className="divide-y divide-gray-200">
            {recentOrders.map((order) => (
              <li key={order.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p className="font-medium text-gray-900">{order.id}</p>
                      <span className="ml-2 text-sm text-gray-500">from {order.customer}</span>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {order.items.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="ml-6 flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{order.total}</p>
                      <p className="text-xs text-gray-500">{order.time}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status === 'preparing'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'ready'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div> */}
    </div>
  );
}
