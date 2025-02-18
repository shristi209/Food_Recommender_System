import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const pool = await getDbPool();
    
    // Join with categories table to get category info
    const [cuisines] = await pool.execute(`
        SELECT 
            cuisines.id, 
            cuisines.name, 
            cuisines.categoryId,
            categories.name as categoryName
        FROM cuisines
        LEFT JOIN categories ON cuisines.categoryId = categories.id
        ORDER BY categories.name, cuisines.name
    `);

    return NextResponse.json({ cuisines });
  } catch (error) {
    console.error('Failed to fetch cuisines:', error);
    return NextResponse.json({ error: 'Failed to fetch cuisines' }, { status: 500 });
  }
}