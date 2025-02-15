import { NextRequest } from 'next/server';
import { getDbPool } from './database';
import { verifyAuth, verifyRole } from './auth';

export interface RestaurantInfo {
  id: string;
  userId: string;
  restaurantName: string;
}

export async function getRestaurantFromRequest(request: NextRequest): Promise<RestaurantInfo> {
  const pool = await getDbPool();
  
  try {
    // Verify auth and role
    const decoded = verifyAuth(request);
    verifyRole(decoded, ['restaurant']);
    
    // Get restaurant info from user ID
    const [restaurantResults] = await pool.execute(
      'SELECT id, userId, restaurantName FROM restaurants WHERE userId = ?',
      [decoded.id]
    );
    const restaurants = restaurantResults as any[];
    
    if (restaurants.length === 0) {
      throw new Error('Restaurant not found');
    }
    
    return restaurants[0] as RestaurantInfo;
    
  } finally {
    await pool.end();
  }
}
