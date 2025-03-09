import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';
import { verifyAuth } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

interface RatingRow extends RowDataPacket {
  rating_id: number;
  rating: number;
}

// POST endpoint to add or update a rating
export async function POST(req: NextRequest) {
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

    const { menuId, rating } = await req.json();

    // Validate input
    if (!menuId || !rating || rating < 1 || rating > 5) {
      return new NextResponse('Invalid input. Menu ID and rating (1-5) are required.', { status: 400 });
    }

    const pool = await getDbPool();
    console.log("user id, menu id, rating", userId, menuId, rating);
    // Check if user has already rated this menu item
    const [existingRatings] = await pool.execute<RatingRow[]>(
      'SELECT rating_id FROM user_ratings WHERE user_id = ? AND menu_id = ?',
      [userId, menuId]
    );

    if (existingRatings.length > 0) {
      // Update existing rating
      await pool.execute(
        'UPDATE user_ratings SET rating = ? WHERE user_id = ? AND menu_id = ?',
        [rating, userId, menuId]
      );
    } else {
      // Insert new rating
      await pool.execute(
        'INSERT INTO user_ratings (user_id, menu_id, rating) VALUES (?, ?, ?)',
        [userId, menuId, rating]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting rating:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// GET endpoint to retrieve a user's rating for a specific menu item
export async function GET(req: NextRequest) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    const userId = decoded.id;
    const searchParams = req.nextUrl.searchParams;
    const menuId = searchParams.get('menuId');

    if (!menuId) {
      return new NextResponse('Menu ID is required', { status: 400 });
    }

    const pool = await getDbPool();

    // Get user's rating for this menu item
    const [ratings] = await pool.execute<RatingRow[]>(
      'SELECT rating FROM user_ratings WHERE user_id = ? AND menu_id = ?',
      [userId, menuId]
    );

    if (ratings.length > 0) {
      return NextResponse.json({ rating: ratings[0].rating });
    } else {
      return NextResponse.json({ rating: null });
    }
  } catch (error) {
    console.error('Error retrieving rating:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
