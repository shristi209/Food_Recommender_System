import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';
import { getRestaurantFromRequest } from '@/lib/restaurant';

// Get menu items for the current restaurant
export async function GET(request: NextRequest) {
  const pool = await getDbPool();
  
  try {
    const restaurant = await getRestaurantFromRequest(request);
    
    // Get menu items for this restaurant
    const [menuResults] = await pool.execute(
      'SELECT * FROM MenuItems WHERE restaurantId = ? ORDER BY category, name',
      [restaurant.id]
    );
    
    return NextResponse.json(menuResults);
    
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
    const { name, description, price, category, image } = await request.json();
    
    // Insert new menu item
    const [result] = await pool.execute(
      `INSERT INTO MenuItems (
        restaurantId, name, description, price, category, image
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [restaurant.id, name, description, price, category, image]
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
