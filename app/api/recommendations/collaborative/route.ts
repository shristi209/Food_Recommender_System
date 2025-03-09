import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import { getDbPool } from '@/lib/database';
import { verifyAuth } from '@/lib/auth';
import { 
  createRatingMatrix, 
  calculateItemSimilarityMatrix, 
  getTopRecommendations 
} from '@/app/utils/collaborativeFiltering';

interface MenuItem extends RowDataPacket {
  id: number;
  restaurantId: number;
  name: string;
  cuisineId: number;
  categoryId: number;
  spicyLevel: number;
  isVeg: number;
  ingredients: string;
  vector: string;
  picture: string;
  price: number;
  description: string;
  createdAt: Date;
  // Joined fields
  restaurantName: string;
  cuisineName: string;
  categoryName: string;
}

interface UserRating extends RowDataPacket {
  user_id: string;
  menu_id: string;
  rating: number;
}

// GET /api/recommendations/collaborative - Get collaborative filtering recommendations
export async function GET(req: NextRequest) {
  const db = await getDbPool();
  try {
    // Verify user authentication
    const decoded = verifyAuth(req);
    if (!decoded?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    const userId = decoded.id;

    // Get all user ratings
    const [allRatings] = await db.query<UserRating[]>(
      `SELECT user_id, menu_id, rating FROM user_ratings`
    );

    // If there are no ratings yet, return an appropriate message
    if (!allRatings || allRatings.length === 0) {
      return NextResponse.json({
        type: 'no_data',
        message: 'No ratings available for collaborative filtering',
        recommendations: []
      });
    }

    // Create rating matrix and calculate item similarity matrix
    const ratingMatrix = createRatingMatrix(allRatings);
    const similarityMatrix = calculateItemSimilarityMatrix(ratingMatrix);
    
    // Check if user has any ratings
    const userHasRatings = allRatings.some(rating => rating.user_id === userId.toString());
    
    if (!userHasRatings) {
      // If user has no ratings, return an appropriate message
      return NextResponse.json({
        type: 'no_user_ratings',
        message: 'User has no ratings yet for collaborative filtering',
        recommendations: []
      });
    }

    // Get all menu item IDs
    const [menuItems] = await db.query<MenuItem[]>(
      `SELECT 
        m.*,
        r.restaurantName as restaurantName,
        c.name as cuisineName,
        cat.name as categoryName
       FROM menu_items m 
       JOIN restaurants r ON m.restaurantId = r.id
       JOIN cuisines c ON m.cuisineId = c.id
       JOIN categories cat ON m.categoryId = cat.id`
    );

    const allItemIds = menuItems.map(item => item.id.toString());

    // Get top recommendations for user
    const recommendations = getTopRecommendations(
      userId.toString(),
      ratingMatrix,
      similarityMatrix,
      allItemIds,
      10,
      5
    );

    // If no recommendations could be made, return an appropriate message
    if (recommendations.length === 0) {
      return NextResponse.json({
        type: 'no_recommendations',
        message: 'Could not generate collaborative recommendations with available data',
        recommendations: []
      });
    }

    // Get full menu item details for recommendations
    const recommendedItems = recommendations.map(rec => {
      const menuItem = menuItems.find(item => item.id.toString() === rec.itemId);
      return {
        ...menuItem,
        predictedRating: rec.predictedRating,
        explanation: `This item is recommended because it's similar to items you've rated highly.`
      };
    }).filter(Boolean);

    return NextResponse.json({
      type: 'collaborative',
      message: 'Recommendations based on your rating patterns and similar users',
      recommendations: recommendedItems
    });

  } catch (error) {
    console.error('Collaborative recommendation error:', error);
    return NextResponse.json(
      { error: 'Failed to get collaborative recommendations' },
      { status: 500 }
    );
  }
}
