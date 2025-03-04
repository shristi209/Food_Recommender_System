import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import { getDbPool } from '@/lib/database';
import { verifyAuth } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { cosineSimilarity, createMenuItemVector, createUserInteractionVector } from '@/app/utils/vectorUtils';

interface MenuItem extends RowDataPacket {
  id: number;
  restaurantId: number;
  name: string;
  cuisineId: number;
  categoryId: number;
  spicyLevel: number;
  isVeg: number;  // TINYINT(1) in MySQL
  ingredients: string;
  vector: string;
  picture: string;
  price: number;
  createdAt: Date;
  // Joined fields
  restaurantName: string;
  cuisineName: string;
  categoryName: string;
}

interface UserInteraction extends RowDataPacket {
  id: number;
  userId: number;
  menuItemId: number;
  viewCount: number;
  cartAddCount: number;
  searchCount: number;
  preferenceScore: number;
  lastInteractionAt: Date;
}

interface RecommendationItem extends MenuItem {
  similarityScore: number;
  matchingFactors: {
    cuisine: boolean;
    category: boolean;
    spicyLevel: boolean;
    dietaryMatch: boolean;
  };
}

// GET /api/recommendations - Get personalized recommendations
export async function GET(req: NextRequest) {
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

    // Get user's interaction data
    const [userInteractions] = await db.query<UserInteraction[]>(
      `SELECT * FROM user_interactions WHERE userId = ? ORDER BY lastInteractionAt DESC LIMIT 1`,
      [userId]
    );

    if (!userInteractions || userInteractions.length === 0) {
      // Return popular items if no user interactions
      const [popularItems] = await db.query<MenuItem[]>(
        `SELECT 
          m.*,
          r.restaurantName,
          c.name as cuisineName,
          cat.name as categoryName
         FROM menu_items m 
         JOIN restaurants r ON m.restaurantId = r.id
         JOIN cuisines c ON m.cuisineId = c.id
         JOIN categories cat ON m.categoryId = cat.id
         ORDER BY 
           (SELECT COUNT(*) FROM user_interactions ui WHERE ui.menuItemId = m.id) DESC
         LIMIT 10`
      );

      return NextResponse.json({
        type: 'popular',
        recommendations: popularItems.map(item => ({
          ...item,
          similarityScore: 0,
          matchingFactors: {
            cuisine: false,
            category: false,
            spicyLevel: false,
            dietaryMatch: false
          }
        }))
      });
    }

    // Get all menu items with their details
    const [menuItems] = await db.query<MenuItem[]>(
      `SELECT 
        m.*,
        r.restaurantName,
        c.name as cuisineName,
        cat.name as categoryName
       FROM menu_items m 
       JOIN restaurants r ON m.restaurantId = r.id
       JOIN cuisines c ON m.cuisineId = c.id
       JOIN categories cat ON m.categoryId = cat.id`
    );

    // Calculate user preferences based on interactions
    const [userPreferences] = await db.query<RowDataPacket[]>(
      `SELECT 
        ROUND(AVG(m.spicyLevel)) as avgSpicyLevel,
        MAX(m.isVeg) as preferredVeg,
        GROUP_CONCAT(DISTINCT m.cuisineId) as preferredCuisines,
        GROUP_CONCAT(DISTINCT m.categoryId) as preferredCategories
       FROM user_interactions ui
       JOIN menu_items m ON ui.menuItemId = m.id
       WHERE ui.userId = ?
       GROUP BY ui.userId`,
      [userId]
    );

    const preferences = userPreferences[0];
    const preferredCuisineIds = preferences.preferredCuisines?.split(',').map(Number) || [];
    const preferredCategoryIds = preferences.preferredCategories?.split(',').map(Number) || [];

    // Create user preference vector once
    const userVector = createUserInteractionVector({
      cuisinePreference: preferredCuisineIds,
      categoryPreference: preferredCategoryIds,
      spicyPreference: preferences.avgSpicyLevel || 0,
      vegPreference: preferences.preferredVeg === 1
    });

    // Calculate recommendations
    const recommendations: RecommendationItem[] = menuItems.map(item => {
      // Create menu item vector
      const itemVector = createMenuItemVector({
        cuisineId: item.cuisineId,
        categoryId: item.categoryId,
        spicyLevel: item.spicyLevel,
        isVeg: item.isVeg
      });

      // Calculate similarity
      const similarityScore = cosineSimilarity(itemVector, userVector);

      return {
        ...item,
        similarityScore,
        matchingFactors: {
          cuisine: preferredCuisineIds.includes(item.cuisineId),
          category: preferredCategoryIds.includes(item.categoryId),
          spicyLevel: Math.abs(preferences.avgSpicyLevel - item.spicyLevel) <= 1,
          dietaryMatch: preferences.preferredVeg === item.isVeg
        }
      };
    });

    // Sort by similarity score and get top 10
    const topRecommendations = recommendations
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 10);

    // Get user preferences for display
    const userPreferencesDisplay = {
      preferredCuisines: menuItems
        .filter(item => preferredCuisineIds.includes(item.cuisineId))
        .map(item => item.cuisineName)
        .filter((value, index, self) => self.indexOf(value) === index),
      spicyPreference: preferences.avgSpicyLevel || 0,
      vegPreference: preferences.preferredVeg === 1
    };

    return NextResponse.json({
      type: 'personalized',
      recommendations: topRecommendations,
      userPreferences: userPreferencesDisplay
    });

  } catch (error) {
    console.error('Recommendation error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

// export async function POST(request: Request) {
//   try {
//     const { menuItemId, userId } = await request.json();
//     const pool = await getDbPool();

//     // Get the selected menu item's vector and details
//     const [selectedItem] = await pool.execute<RowDataPacket[]>(
//       `SELECT m.*, c.name as cuisine_name, cat.name as category_name 
//        FROM menu_items m 
//        JOIN cuisines c ON m.cuisineId = c.id 
//        JOIN categories cat ON m.categoryId = cat.id 
//        WHERE m.id = ?`,
//       [menuItemId]
//     );

//     if (!selectedItem || selectedItem.length === 0) {
//       return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
//     }

//     // Get user's order history preferences
//     const [userHistory] = await pool.execute<RowDataPacket[]>(
//       `SELECT 
//         AVG(m.spicyLevel) as avg_spicy_level,
//         AVG(m.isVeg) as veg_preference
//        FROM orders o
//        JOIN menu_items m ON o.menuId = m.id
//        WHERE o.userId = ?
//        GROUP BY o.userId`,
//       [userId]
//     );

//     // Create feature vector based on selected item and user history
//     const selectedVector = createMenuItemVector({
//       cuisineId: selectedItem[0].cuisineId,
//       categoryId: selectedItem[0].categoryId,
//       spicyLevel: selectedItem[0].spicyLevel,
//       isVeg: selectedItem[0].isVeg
//     });
    
//     // Get recommendations using cosine similarity
//     const [menuItems] = await pool.execute<RowDataPacket[]>(
//       `SELECT m.*, 
//               c.name as cuisine_name, 
//               cat.name as category_name,
//               r.name as restaurant_name,
//               r.image as restaurant_image
//        FROM menu_items m
//        JOIN cuisines c ON m.cuisineId = c.id
//        JOIN categories cat ON m.categoryId = cat.id
//        JOIN restaurants r ON m.restaurantId = r.id
//        WHERE m.id != ? AND m.restaurantId = ?`,
//       [menuItemId, selectedItem[0].restaurantId]
//     );

//     // Calculate similarity scores
//     const recommendations: RecommendationItem[] = menuItems
//       .map(item => ({
//         ...item,
//         similarityScore: cosineSimilarity(selectedVector, createMenuItemVector({
//           cuisineId: item.cuisineId,
//           categoryId: item.categoryId,
//           spicyLevel: item.spicyLevel,
//           isVeg: item.isVeg
//         })),
//         matchingFactors: {
//           cuisine: userHistory[0].avg_spicy_level === item.spicyLevel,
//           category: userHistory[0].veg_preference === item.isVeg,
//           spicyLevel: Math.abs(userHistory[0].avg_spicy_level - item.spicyLevel) <= 1,
//           dietaryMatch: userHistory[0].veg_preference === item.isVeg
//         }
//       }))
//       .sort((a, b) => b.similarityScore - a.similarityScore)
//       .slice(0, 3);

//     // Store in orders table
//     if (userId) {
//       await pool.execute(
//         'INSERT INTO orders (userId, menuId, restaurantId) VALUES (?, ?, ?)',
//         [userId, menuItemId, selectedItem[0].restaurantId]
//       );
//     }

//     return NextResponse.json({
//       selectedItem: selectedItem[0],
//       recommendations,
//       message: 'Item added to cart successfully'
//     });

//   } catch (error) {
//     console.error('Recommendation error:', error);
//     return NextResponse.json(
//       { error: 'Failed to get recommendations' },
//       { status: 500 }
//     );
//   }
// }
