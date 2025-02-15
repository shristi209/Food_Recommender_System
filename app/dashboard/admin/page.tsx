'use client';

import { useEffect, useState } from 'react';
import { 
  UserGroupIcon, 
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon 
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

interface StatsCard {
  name: string;
  value: string;
  icon: React.ElementType;
  change: string;
  trend: 'up' | 'down';
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsCard[]>([
    {
      name: 'Total Users',
      value: '2,453',
      icon: UserGroupIcon,
      change: '+5.2%',
      trend: 'up',
    },
    {
      name: 'Active Restaurants',
      value: '42',
      icon: BuildingStorefrontIcon,
      change: '+12.1%',
      trend: 'up',
    },
    {
      name: 'Total Orders',
      value: '1,254',
      icon: ClipboardDocumentListIcon,
      change: '+8.4%',
      trend: 'up',
    },
    {
      name: 'Revenue',
      value: '$45,254',
      icon: CurrencyDollarIcon,
      change: '+3.2%',
      trend: 'up',
    },
  ]);


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
        <p className="mt-2 text-sm text-gray-700">
          A summary of your restaurant management system's performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {stats.map((stat) => (
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
              <span className="ml-2 text-sm text-gray-500">from last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <div className="text-sm text-gray-500">
              No recent activity to display
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
