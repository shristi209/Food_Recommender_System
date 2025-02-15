import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import { getDbPool } from '@/lib/database';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const spicyLevel = parseInt(searchParams.get('spicyLevel') || '0');
  const isVeg = searchParams.get('isVeg') === 'true';
  const pool = await getDbPool();
  try {
    // Search in menu items with restaurant and cuisine info
    const [results] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        m.id,
        m.name as itemName,
        m.spicyLevel,
        m.isVeg,
        m.ingredients,
        r.id as restaurantId,
        r.name as restaurantName,
        r.image as restaurantImage,
        c.name as cuisineName,
        cat.name as categoryName,
        (m.spicyLevel * ? + (1 - m.isVeg) * ?) / SQRT(POW(m.spicyLevel, 2) + POW((1 - m.isVeg), 2)) as similarity_score
      FROM menu_items m
      JOIN restaurants r ON m.restaurantId = r.id
      JOIN cuisines c ON m.cuisineId = c.id
      JOIN categories cat ON m.categoryId = cat.id
      WHERE 
        m.name LIKE ? OR
        r.name LIKE ? OR
        c.name LIKE ? OR
        cat.name LIKE ? OR
        m.ingredients LIKE ?
      ORDER BY 
        CASE 
          WHEN m.name LIKE ? THEN 1
          WHEN r.name LIKE ? THEN 2
          ELSE 3
        END,
        similarity_score DESC
      LIMIT 20
    `, [
      spicyLevel,
      isVeg ? 0 : 1,
      `%${query}%`,
      `%${query}%`,
      `%${query}%`,
      `%${query}%`,
      `%${query}%`,
      `%${query}%`,
      `%${query}%`
    ]);

    // Group results by restaurant
    const groupedResults = results.reduce((acc: any, item) => {
      if (!acc[item.restaurantId]) {
        acc[item.restaurantId] = {
          id: item.restaurantId,
          name: item.restaurantName,
          image: item.restaurantImage,
          cuisine: item.cuisineName,
          menuItems: []
        };
      }

      acc[item.restaurantId].menuItems.push({
        id: item.id,
        name: item.itemName,
        spicyLevel: item.spicyLevel,
        isVeg: Boolean(item.isVeg),
        ingredients: item.ingredients,
        category: item.categoryName,
        similarityScore: item.similarity_score
      });

      return acc;
    }, {});

    return NextResponse.json({
      restaurants: Object.values(groupedResults)
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}
