import { getDbPool } from '@/lib/database';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("params.id............",params.id);
    const pool = await getDbPool();

    // First check if restaurant exists
    const [restaurantCheck] = await pool.execute(
      `SELECT * FROM restaurants WHERE id = ?`,
      [params.id]
    );
    console.log("Restaurant check:", restaurantCheck);

    // Fetch restaurant details
    const [restaurants] = await pool.execute(
      `SELECT 
        r.id,
        r.restaurantName,
        r.address,
        r.phone,
        m.id as menuItemId,
        m.name as menuItemName,
        m.price,
        m.picture,
        m.spicyLevel,
        m.isVeg,
        m.ingredients,
        c.name as cuisineName,
        cat.name as categoryName
      FROM restaurants r
      LEFT JOIN menu_items m ON r.id = m.restaurantId
      LEFT JOIN cuisines c ON m.cuisineId = c.id
      LEFT JOIN categories cat ON m.categoryId = cat.id
      WHERE r.id = ? AND r.status = "approved"`,
      [params.id]
    );
    console.log("restaurants............",restaurants);

    if (!Array.isArray(restaurants) || restaurants.length === 0) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Format the response
    const firstRow = restaurants[0];
    const restaurant = {
      id: firstRow.id,
      restaurantName: firstRow.restaurantName,
      address: firstRow.address,
      phone: firstRow.phone,
      menuItems: restaurants.map(row => ({
          id: row.menuItemId,
          name: row.menuItemName,
          price: row.price,
          picture: row.picture,
          spicyLevel: row.spicyLevel,
          isVeg: row.isVeg,
          ingredients: row.ingredients,
          cuisineName: row.cuisineName,
          categoryName: row.categoryName
      })).filter(item => item.id != null)
    };

    return NextResponse.json({ restaurant });
  } catch (error) {
    console.error('Failed to fetch restaurant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurant' },
      { status: 500 }
    );
  }
}
