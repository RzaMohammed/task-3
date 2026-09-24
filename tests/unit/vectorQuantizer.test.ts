import {
  quantizeVector,
  dequantizeVector,
  quantizedCosineDistance,
  calculateQuantizationError,
} from '../../backend/src/utils/vectorQuantizer';
import { cosineDistance } from '../../backend/src/utils/vectorMath';

describe('Vector Quantizer Unit Tests', () => {
  // Realistic 128-dimensional embedding sample
  const sampleVector = [
    0.15, -0.42, 0.88, -0.05, 0.33, -0.71, 0.62, 0.11,
    -0.29, 0.44, 0.03, -0.65, 0.77, -0.18, 0.55, -0.37,
  ];

  const similarVector = [
    0.14, -0.40, 0.86, -0.04, 0.35, -0.69, 0.60, 0.12,
    -0.28, 0.43, 0.04, -0.63, 0.75, -0.17, 0.53, -0.35,
  ];

  describe('quantizeVector', () => {
    it('quantizes float array into int8 values within [-128, 127]', () => {
      const qv = quantizeVector(sampleVector);

      expect(qv.dimensions).toBe(sampleVector.length);
      expect(qv.values.length).toBe(sampleVector.length);
      expect(qv.minVal).toBeCloseTo(-0.71, 2);
      expect(qv.maxVal).toBeCloseTo(0.88, 2);
      expect(qv.scale).toBeGreaterThan(0);

      // Check all int8 bounds
      for (const val of qv.values) {
        expect(val).toBeGreaterThanOrEqual(-128);
        expect(val).toBeLessThanOrEqual(127);
        expect(Number.isInteger(val)).toBe(true);
      }
    });

    it('handles uniform vectors where all elements are equal', () => {
      const uniform = [0.5, 0.5, 0.5, 0.5];
      const qv = quantizeVector(uniform);

      expect(qv.dimensions).toBe(4);
      expect(qv.values).toEqual([0, 0, 0, 0]);
      const reconstructed = dequantizeVector(qv);
      expect(reconstructed).toEqual([0.5, 0.5, 0.5, 0.5]);
    });

    it('throws error for empty or invalid vector', () => {
      expect(() => quantizeVector([])).toThrow('Vector must be a non-empty array of numbers');
      expect(() => quantizeVector([1, NaN, 2])).toThrow('Invalid numeric element at index 1');
    });
  });

  describe('dequantizeVector & calculateQuantizationError', () => {
    it('dequantizes with very low reconstruction error', () => {
      const qv = quantizeVector(sampleVector);
      const reconstructed = dequantizeVector(qv);

      expect(reconstructed.length).toBe(sampleVector.length);

      const metrics = calculateQuantizationError(sampleVector, reconstructed);
      // With 255 bins across range 1.59, max bin step is ~0.0062
      expect(metrics.maxError).toBeLessThan(0.01);
      expect(metrics.meanSquaredError).toBeLessThan(0.0001);
    });

    it('throws when calculating error on mismatched vector lengths', () => {
      expect(() => calculateQuantizationError([1, 2], [1])).toThrow('Dimension mismatch');
    });
  });

  describe('quantizedCosineDistance', () => {
    it('computes cosine distance closely matching unquantized cosine distance', () => {
      const originalDist = cosineDistance(sampleVector, similarVector);

      const qvA = quantizeVector(sampleVector);
      const qvB = quantizeVector(similarVector);
      const quantDist = quantizedCosineDistance(qvA, qvB);

      // Quantized cosine distance should match within 0.005 of original
      expect(Math.abs(originalDist - quantDist)).toBeLessThan(0.005);
    });

    it('throws error when comparing quantized vectors with different dimensions', () => {
      const qvA = quantizeVector([1, 2, 3]);
      const qvB = quantizeVector([1, 2, 3, 4]);

      expect(() => quantizedCosineDistance(qvA, qvB)).toThrow('dimension mismatch');
    });
  });
});
