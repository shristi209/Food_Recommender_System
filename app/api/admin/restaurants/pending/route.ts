import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const pool = await getDbPool();
  
  try {
    // Verify admin role
    const token = request.cookies.get('auth_token');
    if (!token?.value) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify token and check role
    try {
      const decoded = verifyAuth(request);
      if (decoded.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }
    } catch (error) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Get pending restaurants
    const [results] = await pool.execute(
      `SELECT r.*, u.email, u.name as ownerName 
       FROM Restaurants r 
       JOIN Users u ON r.userId = u.userId 
       WHERE r.status = ?`,
      ['pending']
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching pending restaurants:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
