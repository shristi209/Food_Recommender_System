import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';
import { getRestaurantFromRequest } from '@/lib/restaurant';
import { RowDataPacket, OkPacket } from 'mysql2';

interface RestaurantDetailsRow extends RowDataPacket {
  id: string;
  restaurantName: string;
  address: string;
  phone: string;
}

interface MenuItemRow extends RowDataPacket {
  menuItemId: number;
  menuItemName: string;
  price: number;
  picture: string | null;
  spicyLevel: number;
  isVeg: number;
  ingredients: string | null;
  cuisineName: string | null;
  categoryName: string | null;
}

// Get menu items for the current restaurant
export async function GET(request: NextRequest) {
  const pool = await getDbPool();
  
  try {
    const restaurant = await getRestaurantFromRequest(request);
    
    // Get restaurant details
    const [restaurantDetails] = await pool.execute<RestaurantDetailsRow[]>(
      `SELECT id, restaurantName, address, phone
       FROM restaurants 
       WHERE id = ?`,
      [restaurant.id]
    );

    // Get menu items for this restaurant with cuisine and category details
    const [menuResults] = await pool.execute<MenuItemRow[]>(
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
    
    if (restaurantDetails.length === 0) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const restaurant_details = restaurantDetails[0];
    return NextResponse.json({
      id: restaurant_details.id,
      restaurantName: restaurant_details.restaurantName,
      address: restaurant_details.address,
      phone: restaurant_details.phone,
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
    const [result] = await pool.execute<OkPacket>(
      `INSERT INTO menu_items (
        restaurantId, name, price, cuisineId, categoryId,
        spicyLevel, isVeg, ingredients, picture
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [restaurant.id, name, price, cuisineId, categoryId,
       spicyLevel, isVeg, ingredients, picture]
    );
    
    return NextResponse.json({ 
      message: 'Menu item added successfully',
      id: result.insertId
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
