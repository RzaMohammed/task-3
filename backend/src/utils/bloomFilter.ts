/**
 * Space-Optimal Probabilistic Bloom Filter
 * 
 * Provides ultra-fast O(k) probabilistic set membership queries for facial
 * embedding hashes, duplicate image fingerprints, and Solana transaction IDs
 * before expensive database or vector index lookups.
 * 
 * Implements Kirsch-Mitzenmacher double-hashing to synthesize k independent
 * hash functions from two 32-bit hash primitives (FNV-1a and Murmur-style mixer).
 */

import crypto from 'crypto';

export interface BloomFilterOptions {
  expectedElements?: number;
  falsePositiveRate?: number;
}

export class BloomFilter {
  public readonly bitSize: number; // m
  public readonly hashCount: number; // k
  private bitArray: Uint8Array;
  private elementsAdded: number = 0;

  constructor(bitSize: number, hashCount: number, buffer?: Uint8Array) {
    if (bitSize <= 0) throw new Error('bitSize must be greater than 0');
    if (hashCount <= 0) throw new Error('hashCount must be greater than 0');

    this.bitSize = bitSize;
    this.hashCount = hashCount;
    const byteLength = Math.ceil(bitSize / 8);

    if (buffer) {
      if (buffer.length !== byteLength) {
        throw new Error(`Buffer size mismatch: expected ${byteLength} bytes, received ${buffer.length}`);
      }
      this.bitArray = new Uint8Array(buffer);
    } else {
      this.bitArray = new Uint8Array(byteLength);
    }
  }

  /**
   * Factory method to create an optimal filter sized for expected items and target false positive rate.
   */
  public static createOptimal(
    expectedElements = 10000,
    falsePositiveRate = 0.01
  ): BloomFilter {
    if (expectedElements <= 0) throw new Error('expectedElements must be positive');
    if (falsePositiveRate <= 0 || falsePositiveRate >= 1) {
      throw new Error('falsePositiveRate must be strictly between 0 and 1');
    }

    // m = -ceil((n * ln(p)) / (ln(2)^2))
    const m = Math.ceil(
      -(expectedElements * Math.log(falsePositiveRate)) / Math.pow(Math.log(2), 2)
    );

    // k = round((m / n) * ln(2))
    const k = Math.max(1, Math.round((m / expectedElements) * Math.log(2)));

    return new BloomFilter(m, k);
  }

  /**
   * 32-bit FNV-1a Hash
   */
  private fnv1a(buffer: Buffer): number {
    let hash = 0x811c9dc5;
    for (let i = 0; i < buffer.length; i++) {
      hash ^= buffer[i];
      hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
  }

  /**
   * 32-bit Murmur-style avalanche mixer
   */
  private murmurMix(buffer: Buffer): number {
    const md5 = crypto.createHash('md5').update(buffer).digest();
    return md5.readUInt32LE(0);
  }

  /**
   * Generates k bit indices using Kirsch-Mitzenmacher double hashing:
   * gi(x) = (h1(x) + i * h2(x)) mod m
   */
  private getBitIndices(item: string | Buffer): number[] {
    const buf = Buffer.isBuffer(item) ? item : Buffer.from(item, 'utf8');
    const h1 = this.fnv1a(buf);
    const h2 = this.murmurMix(buf);

    const indices: number[] = new Array(this.hashCount);
    for (let i = 0; i < this.hashCount; i++) {
      const combined = (h1 + Math.imul(i, h2)) >>> 0;
      indices[i] = combined % this.bitSize;
    }
    return indices;
  }

  /**
   * Adds an item to the Bloom filter.
   */
  public add(item: string | Buffer): void {
    const indices = this.getBitIndices(item);
    for (const bit of indices) {
      const byteIdx = Math.floor(bit / 8);
      const bitMask = 1 << (bit % 8);
      this.bitArray[byteIdx] |= bitMask;
    }
    this.elementsAdded++;
  }

  /**
   * Tests whether an item might be in the set.
   * False negatives are impossible; false positives occur with probability <= falsePositiveRate.
   */
  public has(item: string | Buffer): boolean {
    const indices = this.getBitIndices(item);
    for (const bit of indices) {
      const byteIdx = Math.floor(bit / 8);
      const bitMask = 1 << (bit % 8);
      if ((this.bitArray[byteIdx] & bitMask) === 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * Resets all bits to 0.
   */
  public clear(): void {
    this.bitArray.fill(0);
    this.elementsAdded = 0;
  }

  /**
   * Proportion of bits set to 1 in the filter.
   */
  public getFillRatio(): number {
    let setBits = 0;
    for (let i = 0; i < this.bitArray.length; i++) {
      let b = this.bitArray[i];
      while (b > 0) {
        setBits += b & 1;
        b >>= 1;
      }
    }
    return Math.round((setBits / this.bitSize) * 10000) / 10000;
  }

  /**
   * Number of items added via this instance.
   */
  public get elementsCount(): number {
    return this.elementsAdded;
  }

  /**
   * Serializes filter to Base64 string for Redis or cold storage persistence.
   */
  public exportBase64(): string {
    return Buffer.from(this.bitArray).toString('base64');
  }

  /**
   * Rehydrates a BloomFilter from exported Base64 string.
   */
  public static fromBase64(base64: string, bitSize: number, hashCount: number): BloomFilter {
    const buf = Buffer.from(base64, 'base64');
    return new BloomFilter(bitSize, hashCount, new Uint8Array(buf));
  }
}
