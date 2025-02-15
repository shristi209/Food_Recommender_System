import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token');
    
    if (!token?.value) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'No token found' 
      });
    }

    if (!process.env.NEXT_PUBLIC_JWT_SECRET_KEY) {
      throw new Error('JWT_SECRET_KEY is not defined');
    }

    const decoded = jwt.verify(token.value, process.env.NEXT_PUBLIC_JWT_SECRET_KEY);
    
    return NextResponse.json({
      authenticated: true,
      user: decoded
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return NextResponse.json({ 
      authenticated: false,
      message: 'Invalid token'
    });
  }
}
