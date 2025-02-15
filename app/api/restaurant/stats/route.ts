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
    const [todayOrdersResult] = await pool.execute(
      'SELECT COUNT(*) as count, SUM(totalAmount) as revenue FROM Orders WHERE restaurantId = ? AND createdAt >= ?',
      [restaurant.id, today.toISOString()]
    );
    
    const [yesterdayOrdersResult] = await pool.execute(
      'SELECT COUNT(*) as count, SUM(totalAmount) as revenue FROM Orders WHERE restaurantId = ? AND createdAt >= ? AND createdAt < ?',
      [restaurant.id, yesterday.toISOString(), today.toISOString()]
    );
    
    const [activeCustomersResult] = await pool.execute(
      `SELECT COUNT(DISTINCT userId) as count 
       FROM Orders 
       WHERE restaurantId = ? 
       AND createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [restaurant.id]
    );
    
    const [ratingResult] = await pool.execute(
      'SELECT AVG(rating) as average FROM Reviews WHERE restaurantId = ?',
      [restaurant.id]
    );
    
    const todayStats = (todayOrdersResult as any[])[0];
    const yesterdayStats = (yesterdayOrdersResult as any[])[0];
    const activeCustomers = (activeCustomersResult as any[])[0];
    const rating = (ratingResult as any[])[0];
    
    // Calculate percentage changes
    const orderChange = yesterdayStats.count > 0 
      ? ((todayStats.count - yesterdayStats.count) / yesterdayStats.count) * 100 
      : 0;
      
    const revenueChange = yesterdayStats.revenue > 0 
      ? ((todayStats.revenue - yesterdayStats.revenue) / yesterdayStats.revenue) * 100 
      : 0;
    
    return NextResponse.json({
      orders: {
        today: todayStats.count || 0,
        change: orderChange.toFixed(1)
      },
      revenue: {
        today: todayStats.revenue || 0,
        change: revenueChange.toFixed(1)
      },
      activeCustomers: {
        count: activeCustomers.count || 0
      },
      rating: {
        average: rating.average ? parseFloat(rating.average).toFixed(1) : '0.0'
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
