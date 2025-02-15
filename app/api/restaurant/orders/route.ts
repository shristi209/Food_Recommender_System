import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';
import { getRestaurantFromRequest } from '@/lib/restaurant';

// Get all orders for the current restaurant
export async function GET(request: NextRequest) {
  const pool = await getDbPool();
  
  try {
    const restaurant = await getRestaurantFromRequest(request);
    
    // Get orders for this restaurant
    const [orderResults] = await pool.execute(
      `SELECT 
        Orders.*,
        Users.name as customerName,
        Users.email as customerEmail
       FROM Orders 
       JOIN Users ON Orders.userId = Users.id
       WHERE Orders.restaurantId = ?
       ORDER BY Orders.createdAt DESC`,
      [restaurant.id]
    );
    
    return NextResponse.json(orderResults);
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 401 }
    );
  } finally {
    await pool.end();
  }
}
