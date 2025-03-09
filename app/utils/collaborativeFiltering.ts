/**
 * Collaborative Filtering Utilities
 * This module provides functions for item-item collaborative filtering based on user ratings.
 */

interface RatingMatrix {
  [userId: string]: {
    [itemId: string]: number;
  };
}

interface SimilarityMatrix {
  [itemId: string]: {
    [itemId: string]: number;
  };
}

/**
 * Calculate the cosine similarity between two rating vectors
 */
export function calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have the same length');
  }

  // Calculate dot product
  let dotProduct = 0;
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
  }

  // Calculate magnitudes
  const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));

  // Handle zero magnitudes
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Convert raw ratings data into a user-item matrix
 */
export function createRatingMatrix(ratings: Array<{ user_id: string; menu_id: string; rating: number }>): RatingMatrix {
  const matrix: RatingMatrix = {};

  ratings.forEach(({ user_id, menu_id, rating }) => {
    if (!matrix[user_id]) {
      matrix[user_id] = {};
    }
    matrix[user_id][menu_id] = rating;
  });

  return matrix;
}

/**
 * Calculate item-item similarity matrix using cosine similarity
 */
export function calculateItemSimilarityMatrix(
  ratingMatrix: RatingMatrix
): SimilarityMatrix {
  const similarityMatrix: SimilarityMatrix = {};
  const itemIds = new Set<string>();
  
  // Collect all item IDs
  Object.values(ratingMatrix).forEach(userRatings => {
    Object.keys(userRatings).forEach(itemId => {
      itemIds.add(itemId);
    });
  });
  
  const itemIdsArray = Array.from(itemIds);
  
  // For each pair of items, calculate similarity
  for (let i = 0; i < itemIdsArray.length; i++) {
    const item1 = itemIdsArray[i];
    
    if (!similarityMatrix[item1]) {
      similarityMatrix[item1] = {};
    }
    
    for (let j = 0; j < itemIdsArray.length; j++) {
      const item2 = itemIdsArray[j];
      
      // Skip if same item or already calculated
      if (item1 === item2 || similarityMatrix[item1][item2] !== undefined) {
        continue;
      }
      
      // Create rating vectors for both items (only for users who rated both)
      const commonUserRatings: Array<[number, number]> = [];
      
      // Collect common user ratings for item pair
      Object.keys(ratingMatrix).forEach(userId => {
        const userRatings = ratingMatrix[userId];
        if (userRatings[item1] !== undefined && userRatings[item2] !== undefined) {
          commonUserRatings.push([userRatings[item1], userRatings[item2]]);
        }
      });
      
      // Calculate similarity if there are common ratings
      let similarity = 0;
      if (commonUserRatings.length > 0) {
        const vec1 = commonUserRatings.map(pair => pair[0]);
        const vec2 = commonUserRatings.map(pair => pair[1]);
        
        similarity = calculateCosineSimilarity(vec1, vec2);
      }
      
      // Store similarity (symmetric)
      similarityMatrix[item1][item2] = similarity;
      
      // Ensure the other item has an entry in the matrix
      if (!similarityMatrix[item2]) {
        similarityMatrix[item2] = {};
      }
      similarityMatrix[item2][item1] = similarity;
    }
  }
  
  return similarityMatrix;
}

/**
 * Predict a user's rating for an item using item-based collaborative filtering
 */
export function predictRating(
  userId: string,
  itemId: string,
  ratingMatrix: RatingMatrix,
  similarityMatrix: SimilarityMatrix,
  k: number = 5
): number | null {
  // If user has already rated this item, return the actual rating
  if (ratingMatrix[userId] && ratingMatrix[userId][itemId] !== undefined) {
    return ratingMatrix[userId][itemId];
  }
  
  // If user has no ratings or item has no similarities, return null
  if (!ratingMatrix[userId] || !similarityMatrix[itemId]) {
    return null;
  }
  
  // Get items rated by the user
  const ratedItems = Object.keys(ratingMatrix[userId]);
  if (ratedItems.length === 0) {
    return null;
  }
  
  // Calculate weighted sum of ratings
  let weightedSum = 0;
  let similaritySum = 0;
  
  // Find k most similar items that the user has rated
  const similarItems = ratedItems
    .map(ratedItemId => ({
      itemId: ratedItemId,
      similarity: similarityMatrix[itemId][ratedItemId] || 0
    }))
    .filter(item => item.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
  
  // If no similar items, return null
  if (similarItems.length === 0) {
    return null;
  }
  
  // Calculate prediction
  similarItems.forEach(({ itemId: similarItemId, similarity }) => {
    weightedSum += similarity * ratingMatrix[userId][similarItemId];
    similaritySum += similarity;
  });
  
  // Avoid division by zero
  if (similaritySum === 0) {
    return null;
  }
  
  return weightedSum / similaritySum;
}

/**
 * Get top N recommendations for a user using item-based collaborative filtering
 */
export function getTopRecommendations(
  userId: string,
  ratingMatrix: RatingMatrix,
  similarityMatrix: SimilarityMatrix,
  allItems: string[],
  n: number = 10,
  k: number = 5
): Array<{ itemId: string; predictedRating: number }> {
  // Get items not yet rated by the user
  const userRatings = ratingMatrix[userId] || {};
  const unratedItems = allItems.filter(itemId => userRatings[itemId] === undefined);
  
  // Predict ratings for unrated items
  const predictions = unratedItems
    .map(itemId => {
      const predictedRating = predictRating(userId, itemId, ratingMatrix, similarityMatrix, k);
      return {
        itemId,
        predictedRating: predictedRating !== null ? predictedRating : 0
      };
    })
    .filter(item => item.predictedRating > 0)
    .sort((a, b) => b.predictedRating - a.predictedRating)
    .slice(0, n);
  
  return predictions;
}

/**
 * Combine content-based and collaborative filtering scores
 * @param contentScore Content-based similarity score (0-1)
 * @param collaborativeScore Collaborative filtering predicted rating (1-5)
 * @param alpha Weight for content-based score (0-1)
 * @returns Combined score (0-1)
 */
// export function hybridScore(
//   contentScore: number, 
//   collaborativeScore: number | null, 
//   alpha: number = 0.5
// ): number {
//   // Normalize collaborative score to 0-1 range
//   const normalizedCollaborative = collaborativeScore !== null 
//     ? (collaborativeScore - 1) / 4  // Convert from 1-5 to 0-1
//     : 0;
  
//   // Weighted average
//   return alpha * contentScore + (1 - alpha) * normalizedCollaborative;
// }
