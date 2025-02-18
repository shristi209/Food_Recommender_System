import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';
import { getRestaurantFromRequest } from '@/lib/restaurant';

// Get statistics for the current restaurant
export async function GET(request: NextRequest) {
  const pool = await getDbPool();
  
  try {
    const restaurant = await getRestaurantFromRequest(request);
    
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get yesterday's date at midnight
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Get statistics
    const [trackingUsersResult] = await pool.execute(
      `SELECT COUNT(DISTINCT userId) as count 
       FROM user_interactions ui
       JOIN menu_items mi ON ui.menuItemId = mi.id
       WHERE mi.restaurantId = ? 
       AND (ui.viewCount > 0 OR ui.searchCount > 0)`,
      [restaurant.id]
    );

    const [cartItemsResult] = await pool.execute(
      `SELECT COUNT(*) as count 
       FROM user_interactions ui
       JOIN menu_items mi ON ui.menuItemId = mi.id
       WHERE mi.restaurantId = ? 
       AND ui.cartAddCount > 0`,
      [restaurant.id]
    );

    // Get today's interactions
    const [todayInteractionsResult] = await pool.execute(
      `SELECT 
         COUNT(DISTINCT ui.userId) as userCount,
         SUM(ui.cartAddCount) as cartAdds
       FROM user_interactions ui
       JOIN menu_items mi ON ui.menuItemId = mi.id
       WHERE mi.restaurantId = ? 
       AND DATE(ui.lastInteractionAt) = CURDATE()`,
      [restaurant.id]
    );

    // Get yesterday's interactions
    const [yesterdayInteractionsResult] = await pool.execute(
      `SELECT 
         COUNT(DISTINCT ui.userId) as userCount,
         SUM(ui.cartAddCount) as cartAdds
       FROM user_interactions ui
       JOIN menu_items mi ON ui.menuItemId = mi.id
       WHERE mi.restaurantId = ? 
       AND DATE(ui.lastInteractionAt) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`,
      [restaurant.id]
    );

    const todayStats = (todayInteractionsResult as any[])[0];
    const yesterdayStats = (yesterdayInteractionsResult as any[])[0];
    const trackingUsers = (trackingUsersResult as any[])[0];
    const cartItems = (cartItemsResult as any[])[0];

    // Calculate percentage changes
    const userChange = yesterdayStats.userCount > 0 
      ? ((todayStats.userCount - yesterdayStats.userCount) / yesterdayStats.userCount) * 100 
      : 0;

    const cartChange = yesterdayStats.cartAdds > 0
      ? ((todayStats.cartAdds - yesterdayStats.cartAdds) / yesterdayStats.cartAdds) * 100
      : 0;
    
    return NextResponse.json({
      todayOrders: {
        count: todayStats.userCount || 0,
        change: userChange.toFixed(1),
        trend: userChange >= 0 ? 'up' : 'down'
      },
      todayRevenue: {
        amount: todayStats.cartAdds || 0,
        change: cartChange.toFixed(1),
        trend: cartChange >= 0 ? 'up' : 'down'
      },
      trackingUsers: {
        count: trackingUsers.count || 0,
        change: '+0',
        trend: 'up'
      },
      cartItems: {
        count: cartItems.count || 0,
        change: '+0',
        trend: 'up'
      }
    });
    
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 401 }
    );
  } finally {
    await pool.end();
  }
}
