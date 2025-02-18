// Cosine similarity between two vectors
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must be of equal length');
  }

  const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

// Convert string vector to number array
export function parseVector(vectorString: string): number[] {
  try {
    return JSON.parse(vectorString);
  } catch (e) {
    throw new Error('Invalid vector format');
  }
}

// Get top N similar items based on vector similarity
export function getTopSimilarItems<T extends { vector: string }>(
  targetVector: number[],
  items: T[],
  n: number = 5
): T[] {
  return items
    .map(item => ({
      item,
      similarity: cosineSimilarity(targetVector, parseVector(item.vector))
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, n)
    .map(({ item }) => item);
}
