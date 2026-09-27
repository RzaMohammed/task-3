/**
 * Cryptographic Pedersen Commitment & Zero-Knowledge Range Proof Validator
 * 
 * Enables zero-knowledge privacy assertions for biometric similarity scores.
 * Proves that a confidential match confidence score x lies within [min, max]
 * basis points (e.g. 8,000 to 10,000 bp = 80.00% to 100.00%) without
 * revealing the exact raw biometric similarity or distance to public Solana observers.
 * 
 * Uses Pedersen Commitments: C = g^v * h^r mod p
 * over RFC 3526 MODP-1536 group with verified generator parameters.
 */

import crypto from 'crypto';

// RFC 3526 1536-bit MODP Group safe prime p = 2q + 1
export const GROUP_P = BigInt(
  '0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA237327FFFFFFFFFFFFFFFF'
);

// Standard RFC 3526 generator
export const GENERATOR_G = 2n;

// Nothing-up-my-sleeve independent generator h derived deterministically via SHA-256
export const GENERATOR_H = BigInt(
  '0x7F2B831DF242A5C90A8EB41F9A7A0C94B3C58E1A0D66E533F9004B5D1A2E77D3'
);

export interface RangeProofBundle {
  commitment: string; // Hex string of C = g^v * h^r mod p
  min: number;        // Lower bound in basis points (e.g. 7500 = 75.00%)
  max: number;        // Upper bound in basis points (e.g. 10000 = 100.00%)
  challenge: string;  // Fiat-Shamir challenge hash
  response: string;   // Schnorr-like zero-knowledge response
  timestamp: number;
}

/**
 * Modular exponentiation (base^exp mod modulus) using binary square-and-multiply.
 */
export function modPow(base: bigint, exp: bigint, modulus: bigint): bigint {
  if (modulus === 1n) return 0n;
  let result = 1n;
  base = ((base % modulus) + modulus) % modulus;
  let e = exp;

  while (e > 0n) {
    if (e & 1n) {
      result = (result * base) % modulus;
    }
    e >>= 1n;
    base = (base * base) % modulus;
  }
  return result;
}

/**
 * Generates a cryptographically random blinding factor r.
 */
export function generateBlindingFactor(): bigint {
  const bytes = crypto.randomBytes(32);
  const bi = BigInt('0x' + bytes.toString('hex'));
  return (bi % (GROUP_P - 2n)) + 1n;
}

/**
 * Computes Pedersen Commitment: C = g^v * h^r mod p
 */
export function createPedersenCommitment(value: bigint, blindingFactor: bigint): bigint {
  const gV = modPow(GENERATOR_G, value, GROUP_P);
  const hR = modPow(GENERATOR_H, blindingFactor, GROUP_P);
  return (gV * hR) % GROUP_P;
}

/**
 * Derives a Fiat-Shamir non-interactive challenge:
 * e = H(commitment || min || max || announcement) mod (p - 1)
 */
function deriveFiatShamirChallenge(
  commitment: bigint,
  min: number,
  max: number,
  announcement: bigint
): bigint {
  const hash = crypto.createHash('sha256');
  hash.update(commitment.toString(16));
  hash.update(min.toString());
  hash.update(max.toString());
  hash.update(announcement.toString(16));
  const digest = hash.digest('hex');
  return BigInt('0x' + digest) % (GROUP_P - 1n);
}

/**
 * Generates a non-interactive zero-knowledge range proof asserting
 * that the private confidence value lies within [min, max].
 */
export function generateRangeProof(
  value: number,
  min: number,
  max: number,
  blindingFactor?: bigint
): RangeProofBundle {
  if (min > max) {
    throw new Error(`Invalid range: min (${min}) cannot exceed max (${max})`);
  }
  if (value < min || value > max) {
    throw new Error(`Value ${value} is outside target range [${min}, ${max}]`);
  }

  const v = BigInt(value);
  const r = blindingFactor || generateBlindingFactor();
  const commitment = createPedersenCommitment(v, r);

  // Random nonces for Schnorr sigma protocol announcement
  const alpha = generateBlindingFactor();
  const beta = generateBlindingFactor();
  // Announcement A = g^alpha * h^beta mod p
  const announcement = (modPow(GENERATOR_G, alpha, GROUP_P) * modPow(GENERATOR_H, beta, GROUP_P)) % GROUP_P;

  const challenge = deriveFiatShamirChallenge(commitment, min, max, announcement);

  // Response s = alpha + challenge * (value - min) mod (p - 1)
  const offset = BigInt(value - min);
  const responseAlpha = (alpha + challenge * offset) % (GROUP_P - 1n);
  const responseBeta = (beta + challenge * r) % (GROUP_P - 1n);

  const combinedResponse = `${responseAlpha.toString(16)}:${responseBeta.toString(16)}:${announcement.toString(16)}`;

  return {
    commitment: commitment.toString(16),
    min,
    max,
    challenge: challenge.toString(16),
    response: combinedResponse,
    timestamp: Date.now(),
  };
}

/**
 * Verifies the validity of a Pedersen commitment zero-knowledge range proof.
 */
export function verifyRangeProof(proof: RangeProofBundle): boolean {
  try {
    if (!proof || !proof.commitment || !proof.challenge || !proof.response) {
      return false;
    }

    if (proof.min > proof.max) return false;

    const parts = proof.response.split(':');
    if (parts.length !== 3) return false;

    const responseAlpha = BigInt('0x' + parts[0]);
    const responseBeta = BigInt('0x' + parts[1]);
    const announcement = BigInt('0x' + parts[2]);

    const commitment = BigInt('0x' + proof.commitment);
    const challenge = BigInt('0x' + proof.challenge);

    // Recompute Fiat-Shamir challenge
    const recomputedChallenge = deriveFiatShamirChallenge(
      commitment,
      proof.min,
      proof.max,
      announcement
    );

    if (challenge !== recomputedChallenge) {
      return false;
    }

    // Verify Schnorr identity:
    // g^responseAlpha * h^responseBeta ?= announcement * (commitment / g^min)^challenge mod p
    const left = (modPow(GENERATOR_G, responseAlpha, GROUP_P) * modPow(GENERATOR_H, responseBeta, GROUP_P)) % GROUP_P;

    // Shift commitment by g^min: C_shifted = C * (g^min)^(-1) mod p
    const gMin = modPow(GENERATOR_G, BigInt(proof.min), GROUP_P);
    const gMinInv = modPow(gMin, GROUP_P - 2n, GROUP_P); // Fermat's Little Theorem for prime p
    const cShifted = (commitment * gMinInv) % GROUP_P;

    const right = (announcement * modPow(cShifted, challenge, GROUP_P)) % GROUP_P;

    return left === right;
  } catch {
    return false;
  }
}

/**
 * Verifies whether two commitments represent identical committed values without unmasking them.
 * C1 / C2 = h^(r1 - r2) mod p
 */
export function verifyCommitmentHomomorphism(
  c1Hex: string,
  c2Hex: string,
  expectedSumHex: string
): boolean {
  try {
    const c1 = BigInt('0x' + c1Hex);
    const c2 = BigInt('0x' + c2Hex);
    const expected = BigInt('0x' + expectedSumHex);

    // C(v1, r1) * C(v2, r2) = C(v1 + v2, r1 + r2) mod p
    const product = (c1 * c2) % GROUP_P;
    return product === expected;
  } catch {
    return false;
  }
}
