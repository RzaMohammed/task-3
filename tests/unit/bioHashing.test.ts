import {
  generateOrthonormalBasis,
  generateBioHash,
  computeHammingDistance,
  computeBioSimilarity,
  verifyBioMatch,
} from '../../backend/src/utils/bioHashing';

describe('BioHashing & Cancelable Biometrics Unit Tests', () => {
  // Realistic 64-dimensional test embedding
  const sampleEmbedding = [
    0.15, -0.42, 0.88, -0.05, 0.33, -0.71, 0.62, 0.11,
    -0.29, 0.44, 0.03, -0.65, 0.77, -0.18, 0.55, -0.37,
    0.22, -0.31, 0.49, -0.12, 0.68, -0.54, 0.39, 0.08,
    -0.19, 0.35, 0.14, -0.48, 0.59, -0.27, 0.41, -0.22,
    0.18, -0.39, 0.75, -0.08, 0.29, -0.63, 0.51, 0.14,
    -0.22, 0.39, 0.08, -0.58, 0.69, -0.15, 0.48, -0.31,
    0.25, -0.28, 0.42, -0.15, 0.61, -0.49, 0.33, 0.05,
    -0.15, 0.31, 0.18, -0.42, 0.52, -0.21, 0.37, -0.18,
  ];

  // Minor perturbation representing slight camera / lighting variance
  const perturbedEmbedding = sampleEmbedding.map(v => v + 0.01 * (Math.sin(v * 10)));

  // Completely different biometric identity
  const differentEmbedding = sampleEmbedding.map(v => -v * 0.8 + 0.1);

  const userSeed = 'alice-solana-wallet-seed-9821';
  const revokedSeed = 'alice-new-revoked-token-seed-2026';

  describe('generateOrthonormalBasis', () => {
    it('generates deterministic basis of correct dimensions', () => {
      const basisA = generateOrthonormalBasis(userSeed, 16, 16);
      const basisB = generateOrthonormalBasis(userSeed, 16, 16);

      expect(basisA.length).toBe(16);
      expect(basisA[0].length).toBe(16);
      expect(basisA).toEqual(basisB);
    });

    it('generates orthonormal vectors with unit norm and orthogonal dot products', () => {
      const basis = generateOrthonormalBasis(userSeed, 8, 8);

      for (let i = 0; i < basis.length; i++) {
        let normSq = 0;
        for (let j = 0; j < basis[i].length; j++) {
          normSq += basis[i][j] * basis[i][j];
        }
        expect(Math.sqrt(normSq)).toBeCloseTo(1.0, 4);

        for (let k = i + 1; k < basis.length; k++) {
          let dot = 0;
          for (let j = 0; j < basis[i].length; j++) {
            dot += basis[i][j] * basis[k][j];
          }
          expect(Math.abs(dot)).toBeLessThan(1e-4);
        }
      }
    });

    it('throws error for invalid dimensions', () => {
      expect(() => generateOrthonormalBasis(userSeed, 0, 16)).toThrow('Dimensions must be positive integers');
      expect(() => generateOrthonormalBasis(userSeed, 16, -1)).toThrow('Dimensions must be positive integers');
    });
  });

  describe('generateBioHash', () => {
    it('generates deterministic bitstring and hex output', () => {
      const res1 = generateBioHash(sampleEmbedding, userSeed);
      const res2 = generateBioHash(sampleEmbedding, userSeed);

      expect(res1.bitstring).toBe(res2.bitstring);
      expect(res1.hex).toBe(res2.hex);
      expect(res1.bitLength).toBe(sampleEmbedding.length);
      expect(res1.byteLength).toBe(Math.ceil(sampleEmbedding.length / 8));
      expect(res1.seedFingerprint.length).toBe(16);
    });

    it('preserves biometric similarity for slight face perturbations', () => {
      const hashOriginal = generateBioHash(sampleEmbedding, userSeed);
      const hashPerturbed = generateBioHash(perturbedEmbedding, userSeed);

      const similarity = computeBioSimilarity(hashOriginal.bitstring, hashPerturbed.bitstring);
      expect(similarity).toBeGreaterThanOrEqual(0.85);

      const match = verifyBioMatch(hashOriginal.bitstring, hashPerturbed.bitstring, 0.80);
      expect(match.matched).toBe(true);
    });

    it('produces distinct, low similarity hashes for different persons with same seed', () => {
      const hashAlice = generateBioHash(sampleEmbedding, userSeed);
      const hashBob = generateBioHash(differentEmbedding, userSeed);

      const similarity = computeBioSimilarity(hashAlice.bitstring, hashBob.bitstring);
      expect(similarity).toBeLessThan(0.70);
    });

    it('satisfies cancelability/revocability: same person with different seed produces uncorrelated hashes', () => {
      const hashOld = generateBioHash(sampleEmbedding, userSeed);
      const hashRevoked = generateBioHash(sampleEmbedding, revokedSeed);

      // Even though the face is identical, changing the seed revokes the old template
      const similarity = computeBioSimilarity(hashOld.bitstring, hashRevoked.bitstring);
      expect(similarity).toBeLessThan(0.75);
      expect(hashOld.bitstring).not.toBe(hashRevoked.bitstring);
      expect(hashOld.seedFingerprint).not.toBe(hashRevoked.seedFingerprint);
    });

    it('throws error on invalid inputs', () => {
      expect(() => generateBioHash([], userSeed)).toThrow('Embedding must be a non-empty array of numbers');
      expect(() => generateBioHash(sampleEmbedding, '')).toThrow('Token seed must be a non-empty string');
      expect(() => generateBioHash([1, NaN, 3], userSeed)).toThrow('Invalid embedding component');
      expect(() => generateBioHash(sampleEmbedding, userSeed, { inputDim: 32 })).toThrow('Embedding dimension mismatch');
    });
  });

  describe('Hamming distance and matching utilities', () => {
    it('computes exact Hamming distance', () => {
      expect(computeHammingDistance('1010', '1010')).toBe(0);
      expect(computeHammingDistance('1010', '1001')).toBe(2);
      expect(computeHammingDistance('1111', '0000')).toBe(4);
    });

    it('throws error for mismatched bit lengths', () => {
      expect(() => computeHammingDistance('101', '1010')).toThrow('Length mismatch');
    });

    it('correctly calculates match decision based on threshold', () => {
      const match = verifyBioMatch('11110000', '11110001', 0.80);
      expect(match.matched).toBe(true);
      expect(match.distance).toBe(1);
      expect(match.similarity).toBeCloseTo(0.875, 3);
    });
  });
});
