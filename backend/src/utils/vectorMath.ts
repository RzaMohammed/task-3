/**
 * Vector Mathematics & Biometric Embedding Similarity Utilities
 * Provides high-performance vector operations for face recognition embeddings and similarity matching.
 */

/**
 * Calculates dot product of two numerical vectors
 */
export function dotProduct(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) {
    throw new Error('Vectors cannot be empty');
  }
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: vector A (${a.length}) vs vector B (${b.length})`);
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Computes Euclidean norm (L2 magnitude) of a vector
 */
export function euclideanNorm(v: number[]): number {
  if (v.length === 0) {
    throw new Error('Vector cannot be empty');
  }
  let sum = 0;
  for (let i = 0; i < v.length; i++) {
    sum += v[i] * v[i];
  }
  return Math.sqrt(sum);
}

/**
 * Normalizes vector to unit length (L2 norm = 1.0)
 */
export function normalizeVector(v: number[]): number[] {
  const norm = euclideanNorm(v);
  if (norm === 0) {
    throw new Error('Cannot normalize zero vector');
  }
  return v.map((x) => x / norm);
}

/**
 * Computes Cosine Similarity between two embedding vectors.
 * Returns value in range [-1.0, 1.0].
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  const normA = euclideanNorm(a);
  const normB = euclideanNorm(b);

  if (normA === 0 || normB === 0) {
    throw new Error('Cannot compute cosine similarity with zero-norm vector');
  }

  const dot = dotProduct(a, b);
  const similarity = dot / (normA * normB);

  // Clamp floating precision artifacts into [-1, 1]
  return Math.max(-1, Math.min(1, similarity));
}

/**
 * Computes Cosine Distance (1 - Cosine Similarity).
 * Returns value in range [0.0, 2.0] where 0.0 denotes identity.
 */
export function cosineDistance(a: number[], b: number[]): number {
  return 1 - cosineSimilarity(a, b);
}

/**
 * Computes Euclidean (L2) distance between two embedding vectors
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) {
    throw new Error('Vectors cannot be empty');
  }
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: vector A (${a.length}) vs vector B (${b.length})`);
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Computes Manhattan (L1) distance between two embedding vectors
 */
export function manhattanDistance(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) {
    throw new Error('Vectors cannot be empty');
  }
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: vector A (${a.length}) vs vector B (${b.length})`);
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.abs(a[i] - b[i]);
  }
  return sum;
}

export interface BiometricMatchResult {
  isMatch: boolean;
  similarity: number;
  distance: number;
  confidence: number;
  threshold: number;
}

/**
 * Determines whether two face embedding vectors represent a biometric match
 * based on cosine similarity and configurable acceptance threshold.
 */
export function isBiometricMatch(
  embedding1: number[],
  embedding2: number[],
  threshold = 0.6
): BiometricMatchResult {
  if (threshold < -1 || threshold > 1) {
    throw new Error('Threshold must be between -1.0 and 1.0');
  }
  const similarity = cosineSimilarity(embedding1, embedding2);
  const distance = 1 - similarity;
  const isMatch = similarity >= threshold;

  // Normalized confidence percentage (0 to 100%) mapped from [-1, 1] -> [0, 100]
  const confidence = Math.max(0, Math.min(100, Math.round(((similarity + 1) / 2) * 1000) / 10));

  return {
    isMatch,
    similarity: Math.round(similarity * 10000) / 10000,
    distance: Math.round(distance * 10000) / 10000,
    confidence,
    threshold,
  };
}
