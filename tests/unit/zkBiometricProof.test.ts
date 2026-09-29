import {
  calculateVectorDistanceBp,
  createZkDistanceProof,
  verifyZkDistanceProof,
  serializeZkProof,
  deserializeZkProof,
} from '../../backend/src/utils/zkBiometricProof';

describe('Zero-Knowledge Biometric Distance Proof Unit Tests', () => {
  const anchorVector = [
    0.15, -0.42, 0.88, -0.05, 0.33, -0.71, 0.62, 0.11,
    -0.29, 0.44, 0.03, -0.65, 0.77, -0.18, 0.55, -0.37,
  ];

  // Close candidate (within distance)
  const matchingCandidate = [
    0.16, -0.41, 0.87, -0.04, 0.34, -0.70, 0.61, 0.12,
    -0.28, 0.45, 0.04, -0.64, 0.76, -0.17, 0.54, -0.36,
  ];

  // Distant candidate (violates threshold)
  const distantCandidate = [
    -0.85, 0.62, -0.48, 0.95, -0.73, 0.51, -0.62, -0.81,
    0.79, -0.54, -0.63, 0.88, -0.77, 0.68, -0.75, 0.84,
  ];

  describe('calculateVectorDistanceBp', () => {
    it('computes exact zero distance for identical vectors', () => {
      expect(calculateVectorDistanceBp(anchorVector, anchorVector)).toBe(0);
    });

    it('computes distance in basis points accurately', () => {
      const distanceBp = calculateVectorDistanceBp(anchorVector, matchingCandidate);
      expect(distanceBp).toBeGreaterThan(0);
      expect(distanceBp).toBeLessThan(1000); // Less than 0.1000 distance
    });

    it('throws error when vector dimensions mismatch', () => {
      expect(() => calculateVectorDistanceBp([1, 2], [1])).toThrow('dimension mismatch');
    });
  });

  describe('createZkDistanceProof & verifyZkDistanceProof', () => {
    it('creates and successfully verifies valid ZK distance proof within threshold', () => {
      const thresholdBp = 2000; // 0.2000 max distance
      const proof = createZkDistanceProof(anchorVector, matchingCandidate, thresholdBp);

      expect(proof.proofId).toMatch(/^zkp_/);
      expect(proof.anchorHash).toHaveLength(64);
      expect(proof.distanceThresholdBp).toBe(thresholdBp);

      // Verify with raw vector
      const result = verifyZkDistanceProof(proof, anchorVector);
      expect(result.verified).toBe(true);
      expect(result.anchorMatched).toBe(true);
      expect(result.distanceSatisfied).toBe(true);
      expect(result.algebraicProofValid).toBe(true);
      expect(result.error).toBeUndefined();

      // Verify with anchor hash string directly
      const resultWithHash = verifyZkDistanceProof(proof, proof.anchorHash);
      expect(resultWithHash.verified).toBe(true);
    });

    it('refuses to generate proof if distance exceeds threshold', () => {
      const thresholdBp = 100; // Unreasonably strict threshold
      expect(() => createZkDistanceProof(anchorVector, distantCandidate, thresholdBp)).toThrow(
        /exceeds threshold/
      );
    });

    it('fails verification if anchor hash does not match expected identity', () => {
      const proof = createZkDistanceProof(anchorVector, matchingCandidate, 2000);
      const wrongAnchor = [0.99, 0.99, 0.99, 0.99];

      const result = verifyZkDistanceProof(proof, wrongAnchor);
      expect(result.verified).toBe(false);
      expect(result.anchorMatched).toBe(false);
      expect(result.error).toMatch(/Anchor hash does not match/);
    });

    it('fails verification if proof commitment is tampered', () => {
      const proof = createZkDistanceProof(anchorVector, matchingCandidate, 2000);
      // Maliciously tamper with commitment
      const tamperedProof = {
        ...proof,
        commitment: 'deadbeef12345678',
      };

      const result = verifyZkDistanceProof(tamperedProof, anchorVector);
      expect(result.verified).toBe(false);
      expect(result.algebraicProofValid).toBe(false);
    });

    it('fails verification if responseZ1 is tampered', () => {
      const proof = createZkDistanceProof(anchorVector, matchingCandidate, 2000);
      const tamperedProof = {
        ...proof,
        responseZ1: (BigInt(`0x${proof.responseZ1}`) + 1n).toString(16),
      };

      const result = verifyZkDistanceProof(tamperedProof, anchorVector);
      expect(result.verified).toBe(false);
      expect(result.algebraicProofValid).toBe(false);
      expect(result.error).toMatch(/Schnorr commitment equality check failed/);
    });
  });

  describe('Serialization and Deserialization', () => {
    it('round-trips proof to JSON string and back preserves verifiability', () => {
      const proof = createZkDistanceProof(anchorVector, matchingCandidate, 2500);
      const json = serializeZkProof(proof);
      const deserialized = deserializeZkProof(json);

      expect(deserialized).toEqual(proof);
      const result = verifyZkDistanceProof(deserialized, anchorVector);
      expect(result.verified).toBe(true);
    });
  });
});
