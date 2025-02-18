import { getDbPool } from '@/lib/database';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const pool = await getDbPool();
    const [rows] = await pool.execute(
      `SELECT 
        r.id,
        r.restaurantName,
        r.address,
        r.phone,
        r.status,
        r.panNumber,
        r.panImage,
        r.registrationCertificate,
        r.createdAt
       FROM restaurants r`
    );

    // Return rows directly instead of wrapping in an object
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to fetch restaurants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurants' },
      { status: 500 }
    );
  }
}
