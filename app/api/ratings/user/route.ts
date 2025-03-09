import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';
import { verifyAuth } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

interface UserRatingRow extends RowDataPacket {
  menu_id: number;
  rating: number;
}

// GET endpoint to retrieve all ratings for the current user
export async function GET(req: NextRequest) {
  try {
    // Verify user is logged in
    const decoded = verifyAuth(req);
    if (!decoded?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = decoded.id;
    const pool = await getDbPool();

    // Get all ratings for this user
    const [ratings] = await pool.execute<UserRatingRow[]>(
      'SELECT menu_id, rating FROM user_ratings WHERE user_id = ?',
      [userId]
    );

    // Convert to a map for easier lookup
    const ratingsMap: Record<string, number> = {};
    ratings.forEach((rating) => {
      ratingsMap[rating.menu_id] = rating.rating;
    });

    return NextResponse.json({ ratings: ratingsMap });
  } catch (error) {
    console.error('Error retrieving user ratings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
