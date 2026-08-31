/**
 * Computes cosine similarity between two numerical vectors.
 * Handles zero vectors, dimension mismatches, and non-finite values safely.
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
    return 0.0;
  }

  if (vecA.length !== vecB.length) {
    return 0.0;
  }

  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;

  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i];
    const b = vecB[i];

    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return 0.0;
    }

    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA <= 0 || normB <= 0) {
    return 0.0;
  }

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));

  if (!Number.isFinite(similarity)) {
    return 0.0;
  }

  // Clamp precision within [-1.0, 1.0] and round to 4 decimal places
  const clamped = Math.max(-1.0, Math.min(1.0, similarity));
  return Math.round(clamped * 10000) / 10000;
}

/**
 * Converts a raw cosine similarity float into a normalized representation and percentage.
 */
export function formatSimilarityScore(similarity: number): {
  similarity: number;
  similarity_percentage: number;
} {
  const safeSim = Math.max(0.0, Math.min(1.0, similarity));
  const percentage = Math.round(safeSim * 1000) / 10; // e.g. 95.4
  return {
    similarity: safeSim,
    similarity_percentage: percentage
  };
}
