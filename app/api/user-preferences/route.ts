//add user_preferences and add to user_interaction to avoid cold strat.
import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';

export async function POST(request: Request) {
  const db = await getDbPool();
  
  try {
    const { userId, cuisineId, categoryId, spicyLevel, isVeg } = await request.json();

    if (!userId || !cuisineId || !categoryId || !spicyLevel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save user preferences
    await db.execute(
      `INSERT INTO user_preferences 
       (userId, preferredCuisineId, preferredCategoryId, spicyPreference, vegPreference) 
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       preferredCuisineId = VALUES(preferredCuisineId),
       preferredCategoryId = VALUES(preferredCategoryId),
       spicyPreference = VALUES(spicyPreference),
       vegPreference = VALUES(vegPreference)`,
      [userId, cuisineId, categoryId, spicyLevel, isVeg]
    );

    // Add this as an interaction to avoid cold start
    await db.execute(
      `INSERT INTO user_interactions 
       (userId, menuItemId, preferenceScore)
       VALUES (?, 1, 1)
       ON DUPLICATE KEY UPDATE
       preferenceScore = VALUES(preferenceScore)`,
      [userId]
    );

    return NextResponse.json({ success: true });  
  } catch (error) {
    console.error('Failed to save user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}
