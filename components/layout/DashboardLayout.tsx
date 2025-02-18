'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  Cog6ToothIcon,
  BuildingStorefrontIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const adminNavItems: SidebarItem[] = [
  { name: 'Dashboard', href: '/dashboard/admin', icon: HomeIcon },
  { name: 'Restaurants', href: '/dashboard/admin/restaurants', icon: BuildingStorefrontIcon },
  // { name: 'Users', href: '/dashboard/admin/users', icon: UserGroupIcon },
  // { name: 'Settings', href: '/dashboard/admin/settings', icon: Cog6ToothIcon },
];

const restaurantNavItems: SidebarItem[] = [
  { name: 'Dashboard', href: '/dashboard/restaurant', icon: HomeIcon },
  { name: 'Add Items', href: '/dashboard/restaurant/menu', icon: BuildingStorefrontIcon },
  { name: 'View Items', href: '/dashboard/restaurant/viewmenu', icon: Cog6ToothIcon },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'admin' | 'restaurant';
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const pathname = usePathname();
  const navItems = role === 'admin' ? adminNavItems : restaurantNavItems;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {  logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile menu button */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center bg-white px-4 sm:hidden">
        <button
          type="button"
          className="text-gray-500 hover:text-gray-600"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
        <h1 className="ml-4 text-lg font-semibold text-gray-900">
          {role === 'admin' ? 'Admin Panel' : 'Restaurant Panel'}
        </h1>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 sm:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
      >
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white">
          <div className="flex h-16 items-center justify-between px-6">
            <h1 className="text-xl font-semibold text-gray-900">
              {role === 'admin' ? 'Admin Panel' : 'Restaurant Panel'}
            </h1>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-600"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <nav className="mt-6 px-3">
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      group flex items-center rounded-md px-3 py-2 text-sm font-medium
                      ${isActive 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                    `}
                  >
                    <item.icon
                      className={`
                        mr-3 h-6 w-6 flex-shrink-0
                        ${isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-900'}
                      `}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
              {/* <Button onClick={logout}>Logout</Button> */}
            </div>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden sm:fixed sm:inset-y-0 sm:left-0 sm:z-50 sm:block sm:w-64 sm:bg-white sm:shadow-lg">
        <div className="flex h-16 items-center justify-center border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">
            {role === 'admin' ? 'Admin Panel' : 'Restaurant Panel'}
          </h1>
        </div>
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center rounded-md px-3 py-2 text-sm font-medium
                    ${isActive 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <item.icon
                    className={`
                      mr-3 h-6 w-6 flex-shrink-0
                      ${isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-900'}
                    `}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
            <Button onClick={logout}>Logout</Button>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="sm:pl-64">
        <div className="py-6 px-4 sm:px-8">
          {/* Add top spacing for mobile header */}
          <div className="h-16 sm:hidden" />
          {children}
        </div>
      </div>
    </div>
  );
}
