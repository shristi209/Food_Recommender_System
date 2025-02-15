'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="border-b">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Food Recommendation
          </Link>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Role-specific navigation */}
                {user?.role === 'admin' && (
                  <Link href="/dashboard/admin">
                    <Button variant="ghost">Admin Dashboard</Button>
                  </Link>
                )}
                {user?.role === 'restaurant' && (
                  <Link href="/dashboard/restaurant">
                    <Button variant="ghost">Restaurant Dashboard</Button>
                  </Link>
                )}
                {(user?.role === 'customer' || user?.role === 'restaurant') && (
                  <Link href="/orders">
                    <Button variant="ghost">Orders</Button>
                  </Link>
                )}
                <Button variant="ghost" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
