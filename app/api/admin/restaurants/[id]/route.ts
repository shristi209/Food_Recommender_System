import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';
import { verifyAuth } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { status } = await request.json();

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update restaurant status
    await pool.execute(
      'UPDATE Restaurants SET status = ? WHERE id = ?',
      [status, params.id]
    );

    return NextResponse.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating restaurant status:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
