import { getDbPool } from '@/lib/database';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const db = await getDbPool();

  try {
    const [result] = await db.execute(
      `SELECT 
        SUM(viewCount + cartAddCount + searchCount) as totalInteractions 
       FROM user_interactions 
       WHERE userId = ?`,
      [userId]
    );

    const totalInteractions = result[0]?.totalInteractions || 0;

    return NextResponse.json({ totalInteractions });
  } catch (error) {
    console.error('Failed to fetch interaction count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interaction count' },
      { status: 500 }
    );
  }
}
