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

    // Specific handling for admin login
    if (user.role === 'admin') {
      // No additional checks needed for admin users
    }

    // Specific handling for restaurant login
    if (user.role === 'restaurant') {
      // Additional checks only for restaurant users
      if (!user.id) {
        return NextResponse.json({
          message: 'Invalid restaurant user'
        }, { status: 500 });
      }

      const [restaurantResults] = await pool.execute(
        'SELECT * FROM Restaurants WHERE userId = ? AND status = ?', 
        [user.id, 'approved']
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

    // Create token with user information
    const tokenData = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || user.restaurantName || ''
    };

    console.log('Creating token with data:', tokenData); // Debug log

    const token = jwt.sign(
      tokenData,
      process.env.NEXT_PUBLIC_JWT_SECRET_KEY,
      { 
        expiresIn: '1h',
        algorithm: 'HS256'
      }
    );

    // Create response
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name || user.restaurantName || ''
      }
    }, { status: 200 });

    // Set HTTP-only cookie for security
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 // 1 hour
    });

    // Set a non-HTTP-only cookie for logout functionality
    response.cookies.set({
      name: 'logged_in',
      value: 'true',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 // 1 hour
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      message: 'Internal server error', 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  } finally {
    await pool.end();
  }
}
