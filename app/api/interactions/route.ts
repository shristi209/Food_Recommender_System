//input user interaction, with the updated preference score, after tracking from use_interactions hooks. 
//use-interactions hooks capture the tracked data and sent to here
import mysql, { RowDataPacket } from 'mysql2/promise';
import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';
import { verifyAuth } from '@/lib/auth';
import { INTERACTION_WEIGHTS } from '@/utils/interactionWeights';
import { NextRequest } from 'next/server';

interface UserInteraction extends RowDataPacket {
  viewCount: number;
  cartAddCount: number;
  searchCount: number;
  lastInteractionAt: string | Date;
  preferenceScore: number;
}

const calculatePreferenceScore = (
  viewCount: number,
  cartAddCount: number,
  searchCount: number,
  lastInteractionAt: Date,
  weight: number = 1    //initial weight
) => {
  // Time decay factor - interactions become less important over time
  const now = new Date();
  const daysSinceLastInteraction = (now.getTime() - lastInteractionAt.getTime()) / (1000 * 60 * 60 * 24);
  const timeDecay = Math.exp(-0.1 * daysSinceLastInteraction); // decay by 10% per day

  // Calculate score based on interaction weights and specific weight
  return (
    (viewCount * INTERACTION_WEIGHTS.view +
    cartAddCount * INTERACTION_WEIGHTS.cart_add +
    searchCount * INTERACTION_WEIGHTS.search) * timeDecay * weight
  );
};

// POST /api/interactions - Record user interaction
export async function POST(req: NextRequest) {
  const db = await getDbPool();
  try {
    // Verify user authentication
    const decoded = verifyAuth(req);
    if (!decoded?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    const userId = decoded.id;
    
//receives data from the use-interactions hook
    const body = await req.json();
    const { menuItemId, interactionType, weight = 1, metadata = {} } = body;

    if (!menuItemId || !interactionType) {
      return NextResponse.json(
        { error: 'menuItemId and interactionType are required' },
        { status: 400 }
      );
    }

    console.log('Recording interaction:', {
      userId,
      menuItemId,
      interactionType,
      weight,
      metadata
    });

    try {
      // First verify the menu item exists
      const [menuItems] = await db.query(
        'SELECT id FROM menu_items WHERE id = ?',
        [menuItemId]
      );

      // if (!menuItems.recordset.length) {
      //   return NextResponse.json(
      //     { error: 'Menu item not found' },
      //     { status: 404 }
      //   );
      // }

      // Calculate initial preference score with the specific weight
      const initialPreferenceScore = weight * INTERACTION_WEIGHTS[
        interactionType === 'cartAddCount' ? 'cart_add' : 
        interactionType === 'viewCount' ? 'view' : 'search'
      ];

      // Insert or update interaction record
      await db.query(
        `INSERT INTO user_interactions 
           (userId, menuItemId, viewCount, cartAddCount, searchCount, preferenceScore)
         VALUES 
           (?, ?, 
            ${interactionType === 'viewCount' ? '1' : '0'}, 
            ${interactionType === 'cartAddCount' ? '1' : '0'}, 
            ${interactionType === 'searchCount' ? '1' : '0'}, 
            ?)
         ON DUPLICATE KEY UPDATE
           ${interactionType} = ${interactionType} + 1,
           lastInteractionAt = CURRENT_TIMESTAMP`,
        [userId, menuItemId, initialPreferenceScore]
      );

      // Get updated counts to calculate new preference score
      const [rows] = await db.query<UserInteraction[]>(
        `SELECT viewCount, cartAddCount, searchCount, lastInteractionAt, preferenceScore
         FROM user_interactions
         WHERE userId = ? AND menuItemId = ?`,
        [userId, menuItemId]
      );

      if (rows.length > 0) {
        const interaction = rows[0];
        console.log('Updated interaction counts:', interaction);

        const preferenceScore = calculatePreferenceScore(
          interaction.viewCount,
          interaction.cartAddCount,
          interaction.searchCount,
          new Date(interaction.lastInteractionAt),
          weight
        );

        // Update preference score
        await db.query(
          `UPDATE user_interactions
           SET preferenceScore = ?
           WHERE userId = ? AND menuItemId = ?`,
          [preferenceScore, userId, menuItemId]
        );

        console.log('Updated preference score:', preferenceScore);

        return NextResponse.json({ 
          success: true, 
          preferenceScore,
          counts: {
            viewCount: interaction.viewCount,
            cartAddCount: interaction.cartAddCount,
            searchCount: interaction.searchCount
          }
        });
      }

      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error recording interaction:', error);
    return NextResponse.json(
      { error: 'Failed to track interaction' },
      { status: 500 }
    );
  }
}

// GET /api/interactions/recommendations - Get personalized recommendations
// export async function GET(req: NextRequest) {
//   const db = await getDbPool();
//   try {
//     const decoded = verifyAuth(req);
//     const userId = decoded.id;

//     // Get user's interactions with preference scores
//     const [interactions] = await db.query(
//       `SELECT menuItemId, preferenceScore
//        FROM user_interactions
//        WHERE userId = ?
//        ORDER BY preferenceScore DESC
//        LIMIT 10`,
//       [userId]
//     );

//     // Get menu items for these interactions
//     const menuItemIds = interactions.map((i: any) => i.menuItemId);
//     if (menuItemIds.length === 0) {
//       return NextResponse.json({ recommendations: [] });
//     }

//     const [menuItems] = await db.query(
//       `SELECT * FROM menu_items 
//        WHERE id IN (?)`,
//       [menuItemIds]
//     );

//     return NextResponse.json({ 
//       recommendations: menuItems 
//     });

//   } catch (error) {
//     console.error('Error getting recommendations:', error);
//     return NextResponse.json(
//       { error: 'Failed to get recommendations' },
//       { status: 500 }
//     );
//   }
// }
