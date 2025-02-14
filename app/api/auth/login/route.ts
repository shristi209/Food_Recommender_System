import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  const pool = await getDbPool();
  
  try {
    const { email, password } = await req.json();

    // Validate input
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json({ 
        message: 'Invalid input: Email and password are required' 
      }, { status: 400 });
    }

    // Check if the email exists in the database
    const [userResults] = await pool.execute(
      'SELECT * FROM Users WHERE email = ?', 
      [email]
    );

    const users = userResults as any[];

    if (users.length === 0) {
      return NextResponse.json({ 
        message: 'User not found' 
      }, { status: 404 });
    }

    const user = users[0];

    // Compare the password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ 
        message: 'Invalid credentials' 
      }, { status: 401 });
    }

    // Specific handling for restaurant login
    if (user.role === 'restaurant') {
      // Additional checks only for restaurant users
      if (!user.userId) {
        return NextResponse.json({
          message: 'Invalid restaurant user'
        }, { status: 500 });
      }

      const [restaurantResults] = await pool.execute(
        'SELECT * FROM Restaurants WHERE userId = ? AND status = ?', 
        [user.userId, 'approved']
      );

      const restaurants = restaurantResults as any[];

      if (restaurants.length === 0) {
        return NextResponse.json({
          message: 'Restaurant not approved or not found'
        }, { status: 403 });
      }
    }

    if (!process.env.NEXT_PUBLIC_JWT_SECRET_KEY) {
      throw new Error('JWT_SECRET_KEY is not defined');
    }

    const token = jwt.sign(
      { 
        userId: user.userId, 
        email: user.email, 
        role: user.role,
        name: user.name || user.restaurantName || ''
      },
      process.env.NEXT_PUBLIC_JWT_SECRET_KEY,
      { 
        expiresIn: '1h',  // 1 hour expiration
        algorithm: 'HS256' 
      }
    );

    // Create response with explicit cookie setting
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        user_id: user.userId,
        email: user.email,
        role: user.role,
        name: user.name || user.restaurantName || ''
      }
    }, { status: 200 });

    // Explicitly set cookie with more robust configuration
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, // 1 hour in seconds
      path: '/' // Ensure cookie is available across the site
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      message: 'Internal server error', 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
