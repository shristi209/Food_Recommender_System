// Constants for vector dimensions
const CUISINE_COUNT = 8;  // Momo to Biryani
const CATEGORY_COUNT = 4; // Nepali, Italian, Chinese, Indian
const SPICY_LEVELS = 6;   // 0 to 5
const VECTOR_SIZE = CUISINE_COUNT + CATEGORY_COUNT + SPICY_LEVELS + 1; // +1 for veg/non-veg

interface MenuItemVector {
  cuisineId: number;
  categoryId: number;
  spicyLevel: number;
  isVeg: number;
}

interface UserPreferences {
  cuisinePreference: number[];
  categoryPreference: number[];
  spicyPreference: number;
  vegPreference: boolean;
}

/**
 * Creates a binary feature vector for a menu item
 * Vector structure: [cuisine(8), category(4), spicyLevel(6), isVeg(1)]
 */
export function createMenuItemVector(item: MenuItemVector): number[] {
  // Initialize vector with zeros
  const vector = new Array(VECTOR_SIZE).fill(0);
  
  // Cuisine one-hot encoding (positions 0-7)
  if (item.cuisineId >= 1 && item.cuisineId <= CUISINE_COUNT) {
    vector[item.cuisineId - 1] = 1;
  }
  
  // Category one-hot encoding (positions 8-11)
  if (item.categoryId >= 1 && item.categoryId <= CATEGORY_COUNT) {
    vector[CUISINE_COUNT + (item.categoryId - 1)] = 1;
  }
  
  // Spicy level one-hot encoding (positions 12-17)
  const spicyLevel = Math.min(Math.max(item.spicyLevel, 0), 5); // Ensure value is between 0-5
  vector[CUISINE_COUNT + CATEGORY_COUNT + spicyLevel] = 1;
  
  // Vegetarian encoding (position 18)
  vector[VECTOR_SIZE - 1] = item.isVeg === 1 ? 1 : 0;
  
  return vector;
}

/**
 * Creates a feature vector for user preferences
 * Vector structure matches menu item vector for comparison
 */
export function createUserInteractionVector(preferences: UserPreferences): number[] {
  // Initialize vector with zeros
  const vector = new Array(VECTOR_SIZE).fill(0);
  
  // Cuisine preferences (can have multiple 1s)
  preferences.cuisinePreference.forEach(cuisineId => {
    if (cuisineId >= 1 && cuisineId <= CUISINE_COUNT) {
      vector[cuisineId - 1] = 1;
    }
  });
  
  // Category preferences (can have multiple 1s)
  preferences.categoryPreference.forEach(categoryId => {
    if (categoryId >= 1 && categoryId <= CATEGORY_COUNT) {
      vector[CUISINE_COUNT + (categoryId - 1)] = 1;
    }
  });
  
  // Spicy level preference (one-hot encoding)
  const spicyLevel = Math.min(Math.max(Math.round(preferences.spicyPreference), 0), 5);
  vector[CUISINE_COUNT + CATEGORY_COUNT + spicyLevel] = 1;
  
  // Vegetarian preference
  vector[VECTOR_SIZE - 1] = preferences.vegPreference ? 1 : 0;
  
  return vector;
}

/**
 * Calculates the cosine similarity between two vectors
 * Returns a value between -1 and 1, where 1 means most similar
 */
export function cosineSimilarity(vector1: number[], vector2: number[]): number {
  if (vector1.length !== vector2.length) {
    throw new Error(`Vectors must be of equal length. Got ${vector1.length} and ${vector2.length}`);
  }

  const dotProduct = vector1.reduce((acc, val, i) => acc + val * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((acc, val) => acc + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((acc, val) => acc + val * val, 0));

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  const similarity = dotProduct / (magnitude1 * magnitude2);
  return Math.max(-1, Math.min(1, similarity)); // Ensure result is between -1 and 1
}

// Find similar items based on cosine similarity
export async function findSimilarItems(
  targetVector: number[],
  items: Array<{ vector: number[]; [key: string]: any }>,
  topK: number = 5
): Promise<Array<{ item: any; similarity: number }>> {
  const similarities = items.map(item => ({
    item,
    similarity: cosineSimilarity(targetVector, item.vector)
  }));

  // Sort by similarity in descending order and get top K items
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}
