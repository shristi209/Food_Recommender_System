import { getDbPool } from '@/lib/database';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const pool = await getDbPool();
    const [menuItems] = await pool.execute(
      `SELECT 
        m.id,
        m.name,
        m.price,
        m.picture,
        m.spicyLevel,
        m.isVeg,
        m.ingredients,
        r.id as restaurantId,
        r.restaurantName,
        r.address,
        r.phone,
        c.name as cuisineName,
        cat.name as categoryName
      FROM menu_items m
      JOIN restaurants r ON m.restaurantId = r.id
      JOIN cuisines c ON m.cuisineId = c.id
      JOIN categories cat ON m.categoryId = cat.id
      WHERE m.id = ? AND r.status = 1`,
      [params.id]
    );

    if (!Array.isArray(menuItems) || menuItems.length === 0) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ menuItem: menuItems[0] });
  } catch (error) {
    console.error('Failed to fetch menu item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu item' },
      { status: 500 }
    );
  }
}
