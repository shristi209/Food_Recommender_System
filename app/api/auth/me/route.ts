import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { User } from '@/types/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token');
    
    if (!token?.value) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'No token found' 
      }, { status: 401 });
    }

    if (!process.env.NEXT_PUBLIC_JWT_SECRET_KEY) {
      throw new Error('JWT_SECRET_KEY is not defined');
    }

    const decoded = jwt.verify(token.value, process.env.NEXT_PUBLIC_JWT_SECRET_KEY) as User;
    
    // Return user data
    return NextResponse.json({
      authenticated: true,
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        restaurantId: decoded.restaurantId
      }
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    // Clear cookies on error
    const response = NextResponse.json({ 
      authenticated: false,
      message: 'Invalid token'
    }, { status: 401 });

    response.cookies.delete('auth_token');
    response.cookies.delete('logged_in');
    
    return response;
  }
}
