import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';

export async function GET(request: Request) {
  const db = await getDbPool();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId parameter' },
      { status: 400 }
    );
  }

  try {
    const [rows] = await db.execute(
      `SELECT COUNT(*) as count 
       FROM user_interactions 
       WHERE userId = ?`,
      [userId]
    );

    const hasInteractions = (rows as any[])[0].count > 0;
    return NextResponse.json({ hasInteractions });
  } catch (error) {
    console.error('Failed to check user interactions:', error);
    return NextResponse.json(
      { error: 'Failed to check user interactions' },
      { status: 500 }
    );
  }
}
