import * as crypto from 'crypto';

/**
 * BioHashing & Cancelable Biometrics Utility
 *
 * Implements ISO/IEC 24745 compliant biometric template protection using
 * seed-parameterized random orthogonal projection. Enables revocable,
 * non-invertible biometric tokens from continuous 512-D face embeddings.
 */

export interface BioHashConfig {
  inputDim?: number;
  outputDim?: number;
  threshold?: number;
}

export interface BioHashResult {
  bitstring: string;
  hex: string;
  byteLength: number;
  bitLength: number;
  seedFingerprint: string;
}

/**
 * Generates deterministic pseudo-random floats in range [-1, 1] using HMAC-SHA256
 */
function createDeterministicRandom(seed: string): () => number {
  let counter = 0;
  let buffer = Buffer.alloc(0);
  let offset = 0;

  return function nextFloat(): number {
    if (offset >= buffer.length) {
      const hmac = crypto.createHmac('sha256', seed);
      hmac.update(`biohash-drbg-v1:${counter++}`);
      buffer = hmac.digest();
      offset = 0;
    }

    const uint32 = buffer.readUInt32BE(offset);
    offset += 4;
    return (uint32 / 4294967295) * 2 - 1;
  };
}

function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Generates an orthonormal projection matrix using the Gram-Schmidt process.
 */
export function generateOrthonormalBasis(seed: string, inputDim = 512, outputDim = 512): number[][] {
  if (inputDim <= 0 || outputDim <= 0) {
    throw new Error('Dimensions must be positive integers');
  }

  const rng = createDeterministicRandom(seed);
  const basis: number[][] = [];

  for (let i = 0; i < outputDim; i++) {
    const v: number[] = new Array(inputDim);
    for (let j = 0; j < inputDim; j++) {
      v[j] = rng();
    }

    for (let k = 0; k < basis.length; k++) {
      const u = basis[k];
      const proj = dotProduct(v, u);
      for (let j = 0; j < inputDim; j++) {
        v[j] -= proj * u[j];
      }
    }

    let normSq = 0;
    for (let j = 0; j < inputDim; j++) {
      normSq += v[j] * v[j];
    }
    const norm = Math.sqrt(normSq);
    if (norm < 1e-12) {
      for (let j = 0; j < inputDim; j++) {
        v[j] = rng();
      }
    } else {
      for (let j = 0; j < inputDim; j++) {
        v[j] /= norm;
      }
    }

    basis.push(v);
  }

  return basis;
}

/**
 * Projects a 512-D face embedding onto an orthonormal seed basis and quantizes
 * into a revocable BioHash bitstring.
 */
export function generateBioHash(
  embedding: number[],
  tokenSeed: string,
  config: BioHashConfig = {}
): BioHashResult {
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error('Embedding must be a non-empty array of numbers');
  }
  if (!tokenSeed || typeof tokenSeed !== 'string') {
    throw new Error('Token seed must be a non-empty string');
  }

  const inputDim = config.inputDim ?? embedding.length;
  const outputDim = config.outputDim ?? embedding.length;
  const threshold = config.threshold ?? 0.0;

  if (embedding.length !== inputDim) {
    throw new Error(`Embedding dimension mismatch: expected ${inputDim}, received ${embedding.length}`);
  }

  for (let i = 0; i < embedding.length; i++) {
    if (typeof embedding[i] !== 'number' || isNaN(embedding[i]) || !isFinite(embedding[i])) {
      throw new Error(`Invalid embedding component at index ${i}`);
    }
  }

  const basis = generateOrthonormalBasis(tokenSeed, inputDim, outputDim);
  const bitArray: number[] = new Array(outputDim);

  for (let i = 0; i < outputDim; i++) {
    const projection = dotProduct(embedding, basis[i]);
    bitArray[i] = projection >= threshold ? 1 : 0;
  }

  const bitstring = bitArray.join('');
  const byteCount = Math.ceil(outputDim / 8);
  const buffer = Buffer.alloc(byteCount);

  for (let i = 0; i < outputDim; i++) {
    if (bitArray[i] === 1) {
      const byteIndex = Math.floor(i / 8);
      const bitIndex = 7 - (i % 8);
      buffer[byteIndex] |= (1 << bitIndex);
    }
  }

  const seedFingerprint = crypto.createHash('sha256').update(tokenSeed).digest('hex').slice(0, 16);

  return {
    bitstring,
    hex: buffer.toString('hex'),
    byteLength: buffer.length,
    bitLength: outputDim,
    seedFingerprint,
  };
}

export function computeHammingDistance(bitsA: string, bitsB: string): number {
  if (bitsA.length !== bitsB.length) {
    throw new Error(`Length mismatch: ${bitsA.length} vs ${bitsB.length}`);
  }

  let distance = 0;
  for (let i = 0; i < bitsA.length; i++) {
    if (bitsA[i] !== bitsB[i]) {
      distance++;
    }
  }
  return distance;
}

export function computeBioSimilarity(bitsA: string, bitsB: string): number {
  const distance = computeHammingDistance(bitsA, bitsB);
  return 1.0 - distance / bitsA.length;
}

export function verifyBioMatch(
  bitsA: string,
  bitsB: string,
  similarityThreshold = 0.75
): { matched: boolean; similarity: number; distance: number } {
  const distance = computeHammingDistance(bitsA, bitsB);
  const similarity = 1.0 - distance / bitsA.length;
  return {
    matched: similarity >= similarityThreshold,
    similarity: Math.round(similarity * 10000) / 10000,
    distance,
  };
}
