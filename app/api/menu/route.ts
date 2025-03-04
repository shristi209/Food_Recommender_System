import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import { getDbPool } from '@/lib/database';
import { createMenuItemVector } from '@/app/utils/vectorUtils';
import { getRestaurantFromRequest } from '@/lib/restaurant';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const pool = await getDbPool();
    
    // Join with restaurants table to get restaurant info
    const [menuItems] = await pool.execute(`
      SELECT 
        m.*,
        r.restaurantName,
        r.address,
        r.phone,
        c.name as cuisineName,
        cat.name as categoryName
      FROM menu_items m
      JOIN restaurants r ON m.restaurantId = r.id
      JOIN cuisines c ON m.cuisineId = c.id
      JOIN categories cat ON m.categoryId = cat.id
      WHERE r.id IN (
        SELECT id FROM restaurants WHERE userId IN (
          SELECT id FROM users WHERE role = 'restaurant'
        )
      )
      ORDER BY m.createdAt DESC
    `);

    return NextResponse.json({ menuItems });
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get restaurant info from the auth token
    const restaurant = await getRestaurantFromRequest(request);
    
    const {
      name,
      cuisineId,
      categoryId,
      spicyLevel,
      isVeg,
      ingredients,
      price,
      picture
    } = await request.json();

    // Validate inputs
    if (!name || !cuisineId || !categoryId || spicyLevel === undefined || isVeg === undefined || price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Convert string IDs to numbers
    const numericCuisineId = parseInt(cuisineId);
    const numericCategoryId = parseInt(categoryId);
    const numericSpicyLevel = parseInt(spicyLevel);

    // Validate numeric conversions
    if (isNaN(numericCuisineId) || isNaN(numericCategoryId) || isNaN(numericSpicyLevel)) {
      return NextResponse.json({ error: 'Invalid ID values' }, { status: 400 });
    }

    // Validate price
    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return NextResponse.json({ error: 'Invalid price value' }, { status: 400 });
    }

    // Create feature vector
    const vector = createMenuItemVector({
      cuisineId: numericCuisineId,
      categoryId: numericCategoryId,
      spicyLevel: numericSpicyLevel,
      isVeg: Number(isVeg)
    });

    const pool = await getDbPool();

    // Insert menu item with vector using restaurant.id from auth
    const [result] = await pool.execute(
      `INSERT INTO menu_items 
       (restaurantId, name, cuisineId, categoryId, spicyLevel, isVeg, ingredients, price, picture, vector) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [restaurant.id, name, numericCuisineId, numericCategoryId, numericSpicyLevel, isVeg, ingredients, numericPrice, picture || null, JSON.stringify(vector)]
    );

    return NextResponse.json({
      message: 'Menu item added successfully',
      result
    });

  } catch (error) {
    console.error('Failed to add menu item:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to add menu item' }, { status: 500 });
  }
}
