import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';

export async function GET(req: NextRequest) {
  try {
    const pool = await getDbPool();
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return new NextResponse('Search query is required', { status: 400 });
    }

    // Split query into keywords
    const keywords = query.toLowerCase().split(' ');
    
    // Create WHERE conditions for each keyword
    const whereConditions = keywords.map(() => 
      `(LOWER(m.name) LIKE ? OR 
        LOWER(r.restaurantName) LIKE ? OR 
        LOWER(c.name) LIKE ? OR 
        LOWER(cat.name) LIKE ? OR
        LOWER(m.ingredients) LIKE ? OR
        LOWER(r.address) LIKE ? OR
        LOWER(r.phone) LIKE ? OR
        LOWER(m.isVeg) LIKE ? OR
        LOWER(m.spicyLevel) LIKE ?)`
    ).join(' AND ');

    // Create parameters array with wildcards
    const params = keywords.flatMap(keyword => [
      `%${keyword}%`, // name
      `%${keyword}%`, // restaurantName
      `%${keyword}%`, // cuisineName
      `%${keyword}%`, // categoryName
      `%${keyword}%`, // ingredients
      `%${keyword}%`, // address
      `%${keyword}%`, // phone
      `%${keyword}%`, // isVeg
      `%${keyword}%`  // spicyLevel
    ]);

    const [results] = await pool.query(
      `SELECT 
        m.id,
        m.name,
        m.price,
        m.ingredients,
        m.isVeg,
        m.spicyLevel,
        r.restaurantName,
        r.address,
        r.phone,
        c.name as cuisineName,
        cat.name as categoryName
       FROM menu_items m
       JOIN restaurants r ON m.restaurantId = r.id
       JOIN cuisines c ON m.cuisineId = c.id
       JOIN categories cat ON m.categoryId = cat.id
       WHERE ${whereConditions}
       ORDER BY 
         CASE 
           WHEN LOWER(m.name) LIKE ? THEN 1
           WHEN LOWER(r.restaurantName) LIKE ? THEN 2
           WHEN LOWER(c.name) LIKE ? THEN 3
           WHEN LOWER(cat.name) LIKE ? THEN 4
           ELSE 5
         END,
         m.name ASC
       LIMIT 20`,
      [...params, 
        `%${query.toLowerCase()}%`, 
        `%${query.toLowerCase()}%`,
        `%${query.toLowerCase()}%`,
        `%${query.toLowerCase()}%`
      ]
    );

    // Ensure all fields are properly formatted
    // const formattedResults = results.map((item: any) => ({
    //   ...item,
    //   isVeg: Boolean(item.isVeg),
    //   spicyLevel: Number(item.spicyLevel),
    //   price: Number(item.price),
    //   ingredients: item.ingredients || '',
    //   address: item.address || '',
    //   phone: item.phone || '',
    // }));

    // return NextResponse.json(formattedResults || []);
  } catch (error) {
    console.error('Error searching menu items:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
