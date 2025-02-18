import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const pool = await getDbPool();
    
    // Get all cuisines and categories
    const [cuisines] = await pool.execute(`
      SELECT id, name 
      FROM cuisines 
      ORDER BY name ASC
    `);
    
    const [categories] = await pool.execute(`
      SELECT id, name 
      FROM categories 
      ORDER BY name ASC
    `);

    return NextResponse.json({ cuisines, categories });
  } catch (error) {
    console.error('Failed to fetch options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch options' },
      { status: 500 }
    );
  }
}
