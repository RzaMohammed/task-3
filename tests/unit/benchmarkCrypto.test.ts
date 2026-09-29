import { generateBioHash, computeHammingDistance } from '../../backend/src/utils/bioHashing';
import { createZkDistanceProof, verifyZkDistanceProof } from '../../backend/src/utils/zkBiometricProof';
import { TokenBucketRateLimiter } from '../../backend/src/utils/tokenBucket';

describe('Cryptographic Performance & Benchmark Unit Tests', () => {
  const sampleVectorA = [
    0.15, -0.42, 0.88, -0.05, 0.33, -0.71, 0.62, 0.11,
    -0.29, 0.44, 0.03, -0.65, 0.77, -0.18, 0.55, -0.37,
  ];
  const sampleVectorB = sampleVectorA.map(v => v + 0.01);
  const testSeed = 'bench-seed-key-2026';

  it('measures BioHashing projection and Hamming distance throughput', () => {
    const start = Date.now();
    const iterations = 50;

    for (let i = 0; i < iterations; i++) {
      const hashA = generateBioHash(sampleVectorA, testSeed, { inputDim: 16, outputDim: 16 });
      const hashB = generateBioHash(sampleVectorB, testSeed, { inputDim: 16, outputDim: 16 });
      const dist = computeHammingDistance(hashA.bitstring, hashB.bitstring);
      expect(dist).toBeGreaterThanOrEqual(0);
    }

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  it('measures Zero-Knowledge distance proof generation and verification cycles', () => {
    const proof = createZkDistanceProof(sampleVectorA, sampleVectorB, 2000);
    expect(proof).toBeDefined();

    const verification = verifyZkDistanceProof(proof, sampleVectorA);
    expect(verification.verified).toBe(true);
    expect(verification.algebraicProofValid).toBe(true);
  });

  it('measures token bucket rate limiter throughput under high contention', () => {
    const limiter = new TokenBucketRateLimiter({
      capacity: 10_000,
      refillRatePerSec: 5_000,
    });

    const now = 1700000000000;
    let allowedCount = 0;
    for (let i = 0; i < 1000; i++) {
      const res = limiter.consume(`client_${i % 10}`, now);
      if (res.allowed) allowedCount++;
    }

    expect(allowedCount).toBe(1000);
  });
});