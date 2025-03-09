import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty ids array' }, { status: 400 });
    }
    
    const pool = await getDbPool();
    
    // Convert all ids to numbers and create placeholders
    const menuItemIds = ids.map(id => parseInt(id));
    const placeholders = menuItemIds.map(() => '?').join(',');
    
    const [menuItems] = await pool.execute(
      `SELECT 
        mi.id, 
        mi.name, 
        mi.price, 
        mi.description, 
        mi.picture, 
        mi.ingredients,
        mi.is_veg as isVeg, 
        mi.spicy_level as spicyLevel,
        r.name as restaurantName,
        r.id as restaurantId,
        r.address,
        r.phone,
        c.name as cuisineName,
        cat.name as categoryName
      FROM menu_items mi
      JOIN restaurants r ON mi.restaurant_id = r.id
      JOIN cuisines c ON mi.cuisine_id = c.id
      JOIN categories cat ON mi.category_id = cat.id
      WHERE mi.id IN (${placeholders})`,
      menuItemIds
    );
    
    return NextResponse.json({ menuItems });
  } catch (error) {
    console.error('Error fetching menu items by IDs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
