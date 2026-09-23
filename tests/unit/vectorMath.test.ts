import {
  dotProduct,
  euclideanNorm,
  normalizeVector,
  cosineSimilarity,
  cosineDistance,
  euclideanDistance,
  manhattanDistance,
  isBiometricMatch,
} from '../../backend/src/utils/vectorMath';

describe('Vector Math & Biometric Similarity Unit Tests', () => {
  describe('dotProduct', () => {
    it('computes dot product of standard vectors', () => {
      expect(dotProduct([1, 2, 3], [4, 5, 6])).toBe(32); // 4 + 10 + 18
    });

    it('returns zero for orthogonal vectors', () => {
      expect(dotProduct([1, 0], [0, 1])).toBe(0);
    });

    it('throws error when vector dimensions mismatch', () => {
      expect(() => dotProduct([1, 2], [1, 2, 3])).toThrow('Vector dimension mismatch');
    });

    it('throws error when vectors are empty', () => {
      expect(() => dotProduct([], [])).toThrow('Vectors cannot be empty');
    });
  });

  describe('euclideanNorm', () => {
    it('computes magnitude of 2D 3-4-5 triangle', () => {
      expect(euclideanNorm([3, 4])).toBe(5);
    });

    it('computes norm of unit vector as 1.0', () => {
      expect(euclideanNorm([1, 0, 0])).toBe(1);
    });

    it('throws on empty vector', () => {
      expect(() => euclideanNorm([])).toThrow('Vector cannot be empty');
    });
  });

  describe('normalizeVector', () => {
    it('normalizes vector to unit length (norm = 1.0)', () => {
      const normalized = normalizeVector([3, 4]);
      expect(normalized[0]).toBeCloseTo(0.6, 5);
      expect(normalized[1]).toBeCloseTo(0.8, 5);
      expect(euclideanNorm(normalized)).toBeCloseTo(1.0, 5);
    });

    it('throws when attempting to normalize a zero vector', () => {
      expect(() => normalizeVector([0, 0, 0])).toThrow('Cannot normalize zero vector');
    });
  });

  describe('cosineSimilarity & cosineDistance', () => {
    it('returns 1.0 similarity and 0.0 distance for identical vectors', () => {
      const v = [0.5, 0.5, 0.5, 0.5];
      expect(cosineSimilarity(v, v)).toBeCloseTo(1.0, 5);
      expect(cosineDistance(v, v)).toBeCloseTo(0.0, 5);
    });

    it('returns -1.0 similarity and 2.0 distance for opposite vectors', () => {
      const v1 = [1, 0];
      const v2 = [-1, 0];
      expect(cosineSimilarity(v1, v2)).toBeCloseTo(-1.0, 5);
      expect(cosineDistance(v1, v2)).toBeCloseTo(2.0, 5);
    });

    it('returns 0.0 similarity and 1.0 distance for orthogonal vectors', () => {
      const v1 = [1, 0];
      const v2 = [0, 1];
      expect(cosineSimilarity(v1, v2)).toBeCloseTo(0.0, 5);
      expect(cosineDistance(v1, v2)).toBeCloseTo(1.0, 5);
    });

    it('throws error when vector is all zeros', () => {
      expect(() => cosineSimilarity([0, 0], [1, 1])).toThrow('zero-norm vector');
    });
  });

  describe('euclideanDistance & manhattanDistance', () => {
    it('computes Euclidean distance correctly', () => {
      expect(euclideanDistance([0, 0], [3, 4])).toBe(5);
    });

    it('computes Manhattan distance correctly', () => {
      expect(manhattanDistance([1, 2, 3], [4, 6, 8])).toBe(12); // |1-4| + |2-6| + |3-8| = 3 + 4 + 5 = 12
    });

    it('throws error on mismatched dimensions', () => {
      expect(() => euclideanDistance([1, 2], [1])).toThrow('Vector dimension mismatch');
      expect(() => manhattanDistance([1, 2], [1])).toThrow('Vector dimension mismatch');
    });
  });

  describe('isBiometricMatch', () => {
    const faceA = [0.7071, 0.7071, 0.0];
    const faceB = [0.7071, 0.7071, 0.05]; // very close
    const faceC = [-0.7071, -0.7071, 0.0]; // opposite

    it('classifies near-identical face embeddings as match', () => {
      const result = isBiometricMatch(faceA, faceB, 0.6);
      expect(result.isMatch).toBe(true);
      expect(result.similarity).toBeGreaterThan(0.9);
      expect(result.distance).toBeLessThan(0.1);
      expect(result.confidence).toBeGreaterThan(90);
    });

    it('classifies opposite face embeddings as non-match', () => {
      const result = isBiometricMatch(faceA, faceC, 0.6);
      expect(result.isMatch).toBe(false);
      expect(result.similarity).toBeCloseTo(-1.0, 1);
      expect(result.distance).toBeGreaterThan(1.5);
    });

    it('honors custom stricter threshold', () => {
      const resultMatch = isBiometricMatch(faceA, faceB, 0.85);
      expect(resultMatch.isMatch).toBe(true);

      const resultFail = isBiometricMatch(faceA, [1, 0, 0], 0.85);
      expect(resultFail.isMatch).toBe(false);
    });

    it('throws error if threshold is out of [-1, 1] range', () => {
      expect(() => isBiometricMatch(faceA, faceB, 1.5)).toThrow('between -1.0 and 1.0');
      expect(() => isBiometricMatch(faceA, faceB, -2)).toThrow('between -1.0 and 1.0');
    });
  });
});
