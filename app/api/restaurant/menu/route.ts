import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';
import { getRestaurantFromRequest } from '@/lib/restaurant';

// Get menu items for the current restaurant
export async function GET(request: NextRequest) {
  const pool = await getDbPool();
  
  try {
    const restaurant = await getRestaurantFromRequest(request);
    
    // Get restaurant details
    const [restaurantDetails] = await pool.execute(
      `SELECT id, restaurantName, address, phone
       FROM restaurants 
       WHERE id = ?`,
      [restaurant.id]
    );

    // Get menu items for this restaurant with cuisine and category details
    const [menuResults] = await pool.execute(
      `SELECT 
        m.id as menuItemId,
        m.name as menuItemName,
        m.price,
        m.picture,
        m.spicyLevel,
        m.isVeg,
        m.ingredients,
        c.name as cuisineName,
        cat.name as categoryName
      FROM menu_items m
      LEFT JOIN cuisines c ON m.cuisineId = c.id
      LEFT JOIN categories cat ON m.categoryId = cat.id
      WHERE m.restaurantId = ?
      ORDER BY cat.name, m.name`,
      [restaurant.id]
    );
    
    const restaurants = restaurantDetails as any[];
    if (restaurants.length === 0) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: restaurants[0].id,
      restaurantName: restaurants[0].restaurantName,
      address: restaurants[0].address,
      phone: restaurants[0].phone,
      menuItems: menuResults
    });
    
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 401 }
    );
  } finally {
    await pool.end();
  }
}

// Add a new menu item
export async function POST(request: NextRequest) {
  const pool = await getDbPool();
  
  try {
    const restaurant = await getRestaurantFromRequest(request);
    
    // Get the menu item data from request body
    const { 
      name, 
      price, 
      cuisineId,
      categoryId,
      spicyLevel,
      isVeg,
      ingredients,
      picture 
    } = await request.json();
    
    // Insert new menu item
    const [result] = await pool.execute(
      `INSERT INTO menu_items (
        restaurantId, name, price, cuisineId, categoryId,
        spicyLevel, isVeg, ingredients, picture
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [restaurant.id, name, price, cuisineId, categoryId,
       spicyLevel, isVeg, ingredients, picture]
    );
    
    return NextResponse.json({ 
      message: 'Menu item added successfully',
      id: (result as any).insertId
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error adding menu item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 401 }
    );
  } finally {
    await pool.end();
  }
}
