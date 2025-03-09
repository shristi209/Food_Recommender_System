import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import { getDbPool } from '@/lib/database';
import { verifyAuth } from '@/lib/auth';
import { cosineSimilarity, createMenuItemVector, createUserInteractionVector } from '@/app/utils/vectorUtils';
import { 
  createRatingMatrix, 
  calculateItemSimilarityMatrix, 
  predictRating
} from '@/app/utils/collaborativeFiltering';

// Type definitions for better code readability and type safety
interface MenuItem extends RowDataPacket {
  id: number;
  restaurantId: number;
  name: string;
  cuisineId: number;
  categoryId: number;
  spicyLevel: number;
  isVeg: number;
  ingredients: string;
  vector: string;
  picture: string;
  price: number;
  description: string;
  createdAt: Date;
  // Joined fields
  restaurantName: string;
  cuisineName: string;
  categoryName: string;
}

interface UserRating extends RowDataPacket {
  user_id: string;
  menu_id: string;
  rating: number;
}

interface UserPreference extends RowDataPacket {
  avgSpicyLevel: number;
  preferredVeg: number;
  preferredCuisines: string;
  preferredCategories: string;
}

interface RecommendationItem extends MenuItem {
  similarityScore: number;
  predictedRating: number | null;
  hybridScore: number;
  explanation: string;
  matchingFactors: {
    cuisine: boolean;
    category: boolean;
    spicyLevel: boolean;
    dietaryMatch: boolean;
  };
}

interface UserPreferencesDisplay {
  preferredCuisines: string[];
  spicyPreference: number;
  vegPreference: boolean;
}

/**
 * GET /api/recommendations/hybrid
 * 
 * Provides personalized food recommendations using a hybrid approach that combines:
 * 1. Content-based filtering: Analyzes item features (cuisine, category, spice level, etc.) - 60%
 * 2. Collaborative filtering: Analyzes user rating patterns - 40%
 * 
 * If collaborative filtering data is insufficient, falls back to 100% content-based filtering.
 */
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

    // Fetch all menu items with their details
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

    // Get user's interaction data for content-based filtering
    const [userPreferences] = await db.query<UserPreference[]>(
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

    // If no user preferences exist, return an appropriate message
    if (!userPreferences || userPreferences.length === 0) {
      return NextResponse.json({
        type: 'no_preferences',
        message: 'No user preferences available for recommendations',
        recommendations: []
      });
    }

    // Process user preferences for content-based filtering
    const preferences = userPreferences[0];
    const preferredCuisineIds = preferences.preferredCuisines?.split(',').map(Number) || [];
    const preferredCategoryIds = preferences.preferredCategories?.split(',').map(Number) || [];

    // Create user preference vector for content-based filtering
    const userVector = createUserInteractionVector({
      cuisinePreference: preferredCuisineIds,
      categoryPreference: preferredCategoryIds,
      spicyPreference: preferences.avgSpicyLevel || 0,
      vegPreference: preferences.preferredVeg === 1
    });

    // Get all user ratings for collaborative filtering
    const [allRatings] = await db.query<UserRating[]>(
      `SELECT user_id, menu_id, rating FROM user_ratings`
    );

    // Check if we have enough data for collaborative filtering
    const userHasRatings = allRatings.some(rating => rating.user_id === userId.toString() || rating.user_id === userId);
    const hasEnoughRatings = allRatings.length >= 10; // Minimum threshold for collaborative filtering

    // Calculate content-based recommendations for all items
    const contentBasedRecommendations = calculateContentBasedRecommendations(
      menuItems,
      userVector,
      preferences,
      preferredCuisineIds,
      preferredCategoryIds
    );

    let recommendationType = 'content-based';
    let recommendationExplanation = 'Recommendations based on your food preferences';
    let hybridRecommendations = contentBasedRecommendations;

    // If we have enough data, incorporate collaborative filtering
    if (hasEnoughRatings && userHasRatings) {
      // Prepare data for collaborative filtering
      const ratingMatrix = createRatingMatrix(allRatings);
      const similarityMatrix = calculateItemSimilarityMatrix(ratingMatrix);

      // Calculate hybrid recommendations
      hybridRecommendations = calculateHybridRecommendations(
        contentBasedRecommendations,
        userId.toString(),
        ratingMatrix,
        similarityMatrix,
        0.6 // 60% content-based, 40% collaborative
      );

      recommendationType = 'hybrid';
      recommendationExplanation = 'Hybrid recommendations based on your preferences and rating patterns';
    }

    // Sort and select top recommendations
    const topRecommendations = hybridRecommendations
      .sort((a, b) => b.hybridScore - a.hybridScore)
      .slice(0, 10);

    // Format user preferences for display
    const userPreferencesDisplay = {
      preferredCuisines: menuItems
        .filter(item => preferredCuisineIds.includes(item.cuisineId))
        .map(item => item.cuisineName)
        .filter((value, index, self) => self.indexOf(value) === index),
      spicyPreference: preferences.avgSpicyLevel || 0,
      vegPreference: preferences.preferredVeg === 1
    };

    return NextResponse.json({
      type: recommendationType,
      message: recommendationExplanation,
      recommendations: topRecommendations,
      userPreferences: userPreferencesDisplay
    });

  } catch (error) {
    console.error('Hybrid recommendation error:', error);
    return NextResponse.json(
      { error: 'Failed to get hybrid recommendations' },
      { status: 500 }
    );
  }
}

/**
 * Calculates content-based recommendations using cosine similarity
 */
function calculateContentBasedRecommendations(
  menuItems: MenuItem[],
  userVector: number[],
  preferences: UserPreference,
  preferredCuisineIds: number[],
  preferredCategoryIds: number[]
): RecommendationItem[] {
  return menuItems.map(item => {
    // Create menu item vector
    const itemVector = createMenuItemVector({
      cuisineId: item.cuisineId,
      categoryId: item.categoryId,
      spicyLevel: item.spicyLevel,
      isVeg: item.isVeg
    });

    // Calculate similarity score
    const similarityScore = cosineSimilarity(itemVector, userVector);

    // Identify matching factors for explanation
    const matchingFactors = {
      cuisine: preferredCuisineIds.includes(item.cuisineId),
      category: preferredCategoryIds.includes(item.categoryId),
      spicyLevel: Math.abs(preferences.avgSpicyLevel - item.spicyLevel) <= 1,
      dietaryMatch: preferences.preferredVeg === item.isVeg
    };

    // Generate explanation based on matching factors
    let explanation = 'Recommended based on ';
    const factors = [];
    if (matchingFactors.cuisine) factors.push(`cuisine (${item.cuisineName})`);
    if (matchingFactors.category) factors.push(`category (${item.categoryName})`);
    if (matchingFactors.spicyLevel) factors.push(`spice level (${item.spicyLevel})`);
    if (matchingFactors.dietaryMatch) factors.push(item.isVeg ? 'vegetarian preference' : 'non-vegetarian preference');
    
    explanation += factors.length > 0 
      ? factors.join(', ') 
      : 'overall food preferences';

    return {
      ...item,
      similarityScore,
      predictedRating: null,
      hybridScore: similarityScore, // For content-based only, hybrid score = similarity score
      explanation,
      matchingFactors
    };
  });
}

/**
 * Calculates hybrid recommendations by combining content-based and collaborative filtering
 */
function calculateHybridRecommendations(
  contentBasedRecommendations: RecommendationItem[],
  userId: string,
  ratingMatrix: any,
  similarityMatrix: any,
  contentWeight: number = 0.6
): RecommendationItem[] {
  return contentBasedRecommendations.map(item => {
    // Get content-based score (already calculated)
    const contentScore = item.similarityScore;
    
    // Get collaborative filtering score (predicted rating)
    const predictedRating = predictRating(
      userId, 
      item.id.toString(), 
      ratingMatrix, 
      similarityMatrix
    );
    
    // Normalize predicted rating to 0-1 scale for combining with content score
    const normalizedRating = predictedRating !== null 
      ? (predictedRating - 1) / 4 // Convert from 1-5 scale to 0-1 scale
      : 0;
    
    // Calculate hybrid score
    const hybridScore = predictedRating !== null
      ? (contentWeight * contentScore) + ((1 - contentWeight) * normalizedRating)
      : contentScore; // Fall back to content score if no predicted rating
    
    // Update explanation if collaborative filtering is used
    let explanation = item.explanation;
    if (predictedRating !== null) {
      explanation += ` and your rating patterns (predicted rating: ${predictedRating.toFixed(1)}/5)`;
    }
    
    return {
      ...item,
      predictedRating,
      hybridScore,
      explanation
    };
  });
}