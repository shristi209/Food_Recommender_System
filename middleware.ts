import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { UserRole } from '@/types/auth';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

// Define protected routes and their allowed roles
const protectedRoutes = {
  '/dashboard/admin': ['admin'],
  '/dashboard/restaurant': ['restaurant'],
  '/orders': ['customer', 'restaurant'],
  '/menu/manage': ['restaurant'],
  '/profile': ['customer', 'restaurant'],
};

// Auth routes that should not be accessible when logged in
const authRoutes = ['/auth/login', '/auth/register'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Get role from cookies
  const token = request.cookies.get('auth_token')?.value;
  const decoded = token ? jwt.decode(token) as JWTPayload | null : null;
  const role = decoded?.role;
  
  // If no role and trying to access protected route, redirect to login
  if (!role && !authRoutes.includes(pathname)) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(url);
  }

  // If user has role and trying to access auth routes, redirect to home
  if (role && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Check if the route is protected
  for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route)) {
      // Check if user's role is allowed
      if (!role || !allowedRoles.includes(role)) {
        console.log('Access denied. User role:', role, 'Required roles:', allowedRoles);
        // Redirect to 403 page or home page
        return NextResponse.redirect(new URL('/403', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/orders/:path*',
    '/auth/login',
    '/auth/register',
  ],
};
