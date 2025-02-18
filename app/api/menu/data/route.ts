import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const pool = await getDbPool();
    
    // Get cuisines and categories
    const [cuisines] = await pool.execute('SELECT id, name FROM cuisines ORDER BY name');
    const [categories] = await pool.execute('SELECT id, name FROM categories ORDER BY name');
    
    return NextResponse.json({
      cuisines,
      categories
    });
  } catch (error) {
    console.error('Failed to fetch menu data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu data' },
      { status: 500 }
    );
  }
}
