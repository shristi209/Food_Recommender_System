import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import { getDbPool } from '@/lib/database';

// Function to calculate cosine similarity between two vectors
function cosineSimilarity(vector1: number[], vector2: number[]): number {
  if (vector1.length !== vector2.length) return 0;
  
  const dotProduct = vector1.reduce((acc, val, i) => acc + val * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((acc, val) => acc + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((acc, val) => acc + val * val, 0));
  
  return dotProduct / (magnitude1 * magnitude2);
}

// Function to convert string vector to number array
function vectorToArray(vectorString: string): number[] {
  return vectorString.replace(/[\[\]]/g, '').split(',').map(Number);
}

export async function POST(request: Request) {
  try {
    const { menuItemId, userId } = await request.json();
    const pool = await getDbPool();

    // Get the selected menu item's vector and details
    const [selectedItem] = await pool.execute<RowDataPacket[]>(
      `SELECT m.*, c.name as cuisine_name, cat.name as category_name 
       FROM menu_items m 
       JOIN cuisines c ON m.cuisineId = c.id 
       JOIN categories cat ON m.categoryId = cat.id 
       WHERE m.id = ?`,
      [menuItemId]
    );

    if (!selectedItem || selectedItem.length === 0) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    // Get user's order history preferences
    const [userHistory] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        AVG(m.spicyLevel) as avg_spicy_level,
        AVG(m.isVeg) as veg_preference
       FROM orders o
       JOIN menu_items m ON o.menuId = m.id
       WHERE o.userId = ?
       GROUP BY o.userId`,
      [userId]
    );

    // Create feature vector based on selected item and user history
    const selectedVector = vectorToArray(selectedItem[0].vector);
    
    // Get recommendations using cosine similarity
    const [menuItems] = await pool.execute<RowDataPacket[]>(
      `SELECT m.*, 
              c.name as cuisine_name, 
              cat.name as category_name,
              r.name as restaurant_name,
              r.image as restaurant_image
       FROM menu_items m
       JOIN cuisines c ON m.cuisineId = c.id
       JOIN categories cat ON m.categoryId = cat.id
       JOIN restaurants r ON m.restaurantId = r.id
       WHERE m.id != ? AND m.restaurantId = ?`,
      [menuItemId, selectedItem[0].restaurantId]
    );

    // Calculate similarity scores
    const recommendations = menuItems
      .map(item => ({
        ...item,
        similarityScore: cosineSimilarity(selectedVector, vectorToArray(item.vector))
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 3);

    // Store in orders table
    if (userId) {
      await pool.execute(
        'INSERT INTO orders (userId, menuId, restaurantId) VALUES (?, ?, ?)',
        [userId, menuItemId, selectedItem[0].restaurantId]
      );
    }

    return NextResponse.json({
      selectedItem: selectedItem[0],
      recommendations,
      message: 'Item added to cart successfully'
    });

  } catch (error) {
    console.error('Recommendation error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}
