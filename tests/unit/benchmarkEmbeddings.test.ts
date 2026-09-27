// @ts-ignore
const {
  runEmbeddingBenchmark,
  generateRandomNormalizedVector,
  computeCosineDistance,
  quantize8Bit,
  dequantize8Bit,
} = require('../../scripts/benchmark-embeddings');

describe('Biometric Embedding Benchmark Unit Tests', () => {
  describe('generateRandomNormalizedVector', () => {
    it('generates a normalized vector of specified dimensions', () => {
      const vec = generateRandomNormalizedVector(128);
      expect(vec).toHaveLength(128);

      // Verify L2 norm is approximately 1.0
      const norm = Math.sqrt(vec.reduce((acc: number, v: number) => acc + v * v, 0));
      expect(norm).toBeCloseTo(1.0, 2);
    });
  });

  describe('computeCosineDistance', () => {
    it('computes 0 distance for identical vectors', () => {
      const vec = [0.6, 0.8];
      const dist = computeCosineDistance(vec, vec);
      expect(dist).toBeCloseTo(0.0, 4);
    });

    it('computes 2.0 distance for opposing vectors', () => {
      const v1 = [1, 0];
      const v2 = [-1, 0];
      const dist = computeCosineDistance(v1, v2);
      expect(dist).toBeCloseTo(2.0, 4);
    });
  });

  describe('quantize8Bit and dequantize8Bit', () => {
    it('quantizes to Int8 range and reconstructs vector with minimal error', () => {
      const vec = generateRandomNormalizedVector(64);
      const qv = quantize8Bit(vec);

      expect(qv.quantized).toBeInstanceOf(Int8Array);
      expect(qv.quantized).toHaveLength(64);

      const reconstructed = dequantize8Bit(qv);
      expect(reconstructed).toHaveLength(64);

      for (let i = 0; i < 64; i++) {
        expect(Math.abs(vec[i] - reconstructed[i])).toBeLessThan(0.02);
      }
    });
  });

  describe('runEmbeddingBenchmark', () => {
    it('executes full benchmark and returns valid performance & compression metrics', () => {
      const results = runEmbeddingBenchmark({ count: 100, dimensions: 128 });

      expect(results.dimensions).toBe(128);
      expect(results.iterations).toBe(100);
      expect(results.cosineDistanceOpsPerSec).toBeGreaterThan(1000);
      expect(results.quantizationOpsPerSec).toBeGreaterThan(1000);
      expect(results.compressionRatio).toBeGreaterThan(3.0); // At least 3x compression
      expect(results.maxQuantizationError).toBeLessThan(0.05);
      expect(results.memoryStats.memorySavedPercent).toBeGreaterThan(70);
    });
  });
});
