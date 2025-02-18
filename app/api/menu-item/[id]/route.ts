import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';
import { getRestaurantFromRequest } from '@/lib/restaurant';

// Delete menu item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const pool = await getDbPool();
  
  try {
    const restaurant = await getRestaurantFromRequest(request);
    
    // First verify that this menu item belongs to the restaurant
    const [checkResults] = await pool.execute(
      'SELECT restaurantId FROM menu_items WHERE id = ?',
      [params.id]
    );
    
    const items = checkResults as any[];
    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }
    
    if (items[0].restaurantId !== restaurant.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this menu item' },
        { status: 403 }
      );
    }
    
    // Delete the menu item
    await pool.execute(
      'DELETE FROM menu_items WHERE id = ?',
      [params.id]
    );
    
    return NextResponse.json({ 
      message: 'Menu item deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}

// Get menu item details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const pool = await getDbPool();
  
  try {
    const restaurant = await getRestaurantFromRequest(request);
    
    // Get menu item with all details
    const [menuResults] = await pool.execute(
      `SELECT 
        m.id as menuItemId,
        m.name as menuItemName,
        m.price,
        m.picture,
        m.spicyLevel,
        m.isVeg,
        m.ingredients,
        m.cuisineId,
        m.categoryId,
        c.name as cuisineName,
        cat.name as categoryName
      FROM menu_items m
      LEFT JOIN cuisines c ON m.cuisineId = c.id
      LEFT JOIN categories cat ON m.categoryId = cat.id
      WHERE m.id = ? AND m.restaurantId = ?`,
      [params.id, restaurant.id]
    );
    
    const items = menuResults as any[];
    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(items[0]);
    
  } catch (error) {
    console.error('Error fetching menu item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}

// Update menu item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const pool = await getDbPool();
  
  try {
    const restaurant = await getRestaurantFromRequest(request);
    
    // First verify that this menu item belongs to the restaurant
    const [checkResults] = await pool.execute(
      'SELECT restaurantId FROM menu_items WHERE id = ?',
      [params.id]
    );
    
    const items = checkResults as any[];
    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }
    
    if (items[0].restaurantId !== restaurant.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this menu item' },
        { status: 403 }
      );
    }
    
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
    
    // Update the menu item
    await pool.execute(
      `UPDATE menu_items 
       SET name = ?, price = ?, cuisineId = ?, categoryId = ?,
           spicyLevel = ?, isVeg = ?, ingredients = ?, picture = ?
       WHERE id = ?`,
      [name, price, cuisineId, categoryId, spicyLevel, isVeg, ingredients, picture, params.id]
    );
    
    return NextResponse.json({ 
      message: 'Menu item updated successfully' 
    });
    
  } catch (error) {
    console.error('Error updating menu item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
