import {
  modPow,
  generateBlindingFactor,
  createPedersenCommitment,
  generateRangeProof,
  verifyRangeProof,
  verifyCommitmentHomomorphism,
  GROUP_P,
} from '../../backend/src/utils/rangeProof';

describe('Pedersen Commitment & ZK Range Proof Unit Tests', () => {
  describe('modPow', () => {
    it('computes small powers accurately', () => {
      expect(modPow(2n, 10n, 1000n)).toBe(24n);
      expect(modPow(3n, 4n, 50n)).toBe(31n);
    });

    it('handles base larger than modulus', () => {
      expect(modPow(15n, 2n, 7n)).toBe(1n);
    });
  });

  describe('Pedersen Commitments', () => {
    it('creates deterministic commitments for identical values and blinding factors', () => {
      const v = 8500n;
      const r = generateBlindingFactor();

      const c1 = createPedersenCommitment(v, r);
      const c2 = createPedersenCommitment(v, r);

      expect(c1).toBe(c2);
      expect(c1).toBeGreaterThan(0n);
      expect(c1).toBeLessThan(GROUP_P);
    });

    it('hides the committed value when blinding factor differs', () => {
      const v = 8500n;
      const r1 = generateBlindingFactor();
      const r2 = generateBlindingFactor();

      const c1 = createPedersenCommitment(v, r1);
      const c2 = createPedersenCommitment(v, r2);

      expect(c1).not.toBe(c2);
    });

    it('exhibits additive homomorphic property C(v1 + v2, r1 + r2) = C(v1, r1) * C(v2, r2)', () => {
      const v1 = 3000n;
      const r1 = generateBlindingFactor();
      const c1 = createPedersenCommitment(v1, r1);

      const v2 = 5000n;
      const r2 = generateBlindingFactor();
      const c2 = createPedersenCommitment(v2, r2);

      const sumV = v1 + v2;
      const sumR = (r1 + r2) % (GROUP_P - 1n);
      const cSum = createPedersenCommitment(sumV, sumR);

      expect(verifyCommitmentHomomorphism(c1.toString(16), c2.toString(16), cSum.toString(16))).toBe(true);
    });
  });

  describe('generateRangeProof & verifyRangeProof', () => {
    it('generates and verifies a valid range proof for confidential biometric match', () => {
      // Biometric similarity confidence = 87.50% (8750 basis points)
      // Asserting confidence >= 8000 (80%) and <= 10000 (100%)
      const proof = generateRangeProof(8750, 8000, 10000);

      expect(proof.commitment).toBeTruthy();
      expect(proof.challenge).toBeTruthy();
      expect(proof.min).toBe(8000);
      expect(proof.max).toBe(10000);

      const isValid = verifyRangeProof(proof);
      expect(isValid).toBe(true);
    });

    it('rejects generating proof when value is below lower bound', () => {
      expect(() => generateRangeProof(6500, 8000, 10000)).toThrow('outside target range');
    });

    it('rejects generating proof when value is above upper bound', () => {
      expect(() => generateRangeProof(10500, 8000, 10000)).toThrow('outside target range');
    });

    it('rejects tampered challenge', () => {
      const proof = generateRangeProof(8500, 8000, 10000);
      proof.challenge = 'deadbeef1234';

      expect(verifyRangeProof(proof)).toBe(false);
    });

    it('rejects tampered minimum bound in proof', () => {
      const proof = generateRangeProof(8500, 8000, 10000);
      proof.min = 7000; // Altering bound post-generation

      expect(verifyRangeProof(proof)).toBe(false);
    });

    it('rejects corrupted response string', () => {
      const proof = generateRangeProof(8500, 8000, 10000);
      proof.response = 'invalid:format';

      expect(verifyRangeProof(proof)).toBe(false);
    });
  });
});
