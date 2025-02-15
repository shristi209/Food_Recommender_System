import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import { getDbPool } from '@/lib/database';
import { createUserInteractionVector, findSimilarItems } from '@/app/utils/vectorUtils';

export async function POST(request: Request) {
  try {
    const {
      userId,
      viewDuration,
      addToCart,
      spicyPreference,
      vegPreference,
      cuisinePreference,
      categoryPreference,
      restaurantId 
    } = await request.json();

    // Create user interaction vector
    const userVector = createUserInteractionVector({
      viewDuration,
      addToCart,
      spicyPreference,
      vegPreference,
      cuisinePreference,
      categoryPreference
    });

    const pool = await getDbPool();

    // Get menu items with their vectors
    let query = `
      SELECT 
        m.*,
        r.name as restaurant_name,
        r.image as restaurant_image,
        c.name as cuisine_name,
        cat.name as category_name
      FROM menu_items m
      JOIN restaurants r ON m.restaurantId = r.id
      JOIN cuisines c ON m.cuisineId = c.id
      JOIN categories cat ON m.categoryId = cat.id
    `;

    // Add restaurant filter if provided
    if (restaurantId) {
      query += ' WHERE m.restaurantId = ?';
    }

    const [menuItems] = await pool.execute<RowDataPacket[]>(
      query,
      restaurantId ? [restaurantId] : []
    );

    // Convert menu items to include vectors
    const itemsWithVectors = menuItems.map(item => ({
      ...item,
      vector: JSON.parse(item.vector)
    }));

    // Find similar items
    const similarItems = await findSimilarItems(userVector, itemsWithVectors, 5);

    // Store user interaction for future reference
    if (userId) {
      await pool.execute(
        `INSERT INTO user_interactions 
         (userId, viewDuration, addToCart, spicyPreference, vegPreference) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, viewDuration || 0, addToCart || false, spicyPreference || 0, vegPreference || false]
      );
    }

    return NextResponse.json({
      recommendations: similarItems.map(({ item, similarity }) => ({
        ...item,
        similarityScore: similarity,
        vector: undefined // Don't send vector to client
      }))
    });

  } catch (error) {
    console.error('Failed to get recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}
