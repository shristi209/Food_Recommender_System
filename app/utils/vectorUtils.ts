// Define cuisine (dishes) and category (cuisine types) mappings
export const CUISINES = {
  // Nepali dishes (categoryId: 1)
  MOMO: 1,
  CHOWMIN: 2,
  // Italian dishes (categoryId: 2)
  PIZZA: 3,
  PASTA: 4,
  // Chinese dishes (categoryId: 3)
  SUSHI: 5,
  DUMPLINGS: 6,
  // Indian dishes (categoryId: 4)
  BUTTER_CHICKEN: 7,
  BIRYANI: 8
} as const;

export const CATEGORIES = {
  NEPALI: 1,
  ITALIAN: 2,
  CHINESE: 3,
  INDIAN: 4
} as const;

// Get total counts for vector sizing
const CUISINE_COUNT = Object.keys(CUISINES).length; // 8 dishes
const CATEGORY_COUNT = Object.keys(CATEGORIES).length; // 4 cuisine types

// Helper function to get category for a cuisine
function getCategoryForCuisine(cuisineId: number): number {
  // Map cuisine IDs to their respective categories
  if (cuisineId <= 2) return CATEGORIES.NEPALI;
  if (cuisineId <= 4) return CATEGORIES.ITALIAN;
  if (cuisineId <= 6) return CATEGORIES.CHINESE;
  return CATEGORIES.INDIAN;
}

// Convert menu item properties to a binary feature vector using one-hot encoding
export function createMenuItemVector(item: {
  cuisineId: number;
  categoryId: number;
  spicyLevel: number;
  isVeg: boolean;
}) {
  // Initialize vector with zeros
  const vector = new Array(CUISINE_COUNT + CATEGORY_COUNT + 7).fill(0);

  // One-hot encoding for cuisine (dish) (first CUISINE_COUNT positions)
  vector[item.cuisineId - 1] = 1;

  // One-hot encoding for category (cuisine type) (next CATEGORY_COUNT positions)
  vector[CUISINE_COUNT + (item.categoryId - 1)] = 1;

  // Spicy level encoding (next 6 positions, 0-5)
  vector[CUISINE_COUNT + CATEGORY_COUNT + item.spicyLevel] = 1;

  // Vegetarian encoding (last position)
  vector[vector.length - 1] = item.isVeg ? 1 : 0;

  return vector;
}

// Convert user interaction to a feature vector
export function createUserInteractionVector(interaction: {
  viewDuration?: number;
  addToCart?: boolean;
  spicyPreference?: number;
  vegPreference?: boolean;
  cuisinePreference?: number[]; // IDs of preferred dishes
  categoryPreference?: number[]; // IDs of preferred cuisine types
}) {
  // Initialize vector with zeros
  const vector = new Array(CUISINE_COUNT + CATEGORY_COUNT + 7).fill(0);

  // One-hot encoding for cuisine preferences (dishes)
  if (interaction.cuisinePreference?.length) {
    interaction.cuisinePreference.forEach(id => {
      vector[id - 1] = 1;
    });
  }

  // One-hot encoding for category preferences (cuisine types)
  if (interaction.categoryPreference?.length) {
    interaction.categoryPreference.forEach(id => {
      vector[CUISINE_COUNT + (id - 1)] = 1;
    });
  }

  // Spicy preference (0-5)
  if (interaction.spicyPreference !== undefined) {
    vector[CUISINE_COUNT + CATEGORY_COUNT + interaction.spicyPreference] = 1;
  }

  // Vegetarian preference
  if (interaction.vegPreference !== undefined) {
    vector[vector.length - 1] = interaction.vegPreference ? 1 : 0;
  }

  return vector;
}

// Calculate cosine similarity between two vectors
export function cosineSimilarity(vector1: number[], vector2: number[]): number {
  if (vector1.length !== vector2.length) {
    throw new Error('Vectors must be of equal length');
  }

  const dotProduct = vector1.reduce((acc, val, i) => acc + val * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((acc, val) => acc + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((acc, val) => acc + val * val, 0));

  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  return dotProduct / (magnitude1 * magnitude2);
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

// Example vector structure:
// [
//   // Cuisine (dish) one-hot encoding (8 positions)
//   1, 0, 0, 0, 0, 0, 0, 0,  // MOMO
//   // or
//   0, 0, 0, 0, 0, 0, 0, 1,  // BIRYANI
//
//   // Category (cuisine type) one-hot encoding (4 positions)
//   1, 0, 0, 0,  // NEPALI
//   // or
//   0, 0, 0, 1,  // INDIAN
//
//   // Spicy level one-hot encoding (6 positions for 0-5)
//   1, 0, 0, 0, 0, 0,  // Level 0
//   // or
//   0, 0, 0, 0, 1, 0,  // Level 4
//
//   // Vegetarian (1 position)
//   1  // Is vegetarian
//   // or
//   0  // Not vegetarian
// ]
