import { BloomFilter } from '../../backend/src/utils/bloomFilter';

describe('BloomFilter Unit Tests', () => {
  describe('createOptimal', () => {
    it('creates filter with mathematically optimal bit size and hash count', () => {
      const filter = BloomFilter.createOptimal(1000, 0.01);
      // For n=1000, p=0.01: m ~ 9586 bits, k ~ 7
      expect(filter.bitSize).toBeGreaterThan(9000);
      expect(filter.hashCount).toBeGreaterThanOrEqual(6);
      expect(filter.hashCount).toBeLessThanOrEqual(8);
    });

    it('throws error for invalid parameters', () => {
      expect(() => BloomFilter.createOptimal(0, 0.01)).toThrow();
      expect(() => BloomFilter.createOptimal(1000, 0)).toThrow();
      expect(() => BloomFilter.createOptimal(1000, 1)).toThrow();
    });
  });

  describe('add and has operations', () => {
    it('returns true for all inserted items (zero false negatives)', () => {
      const filter = BloomFilter.createOptimal(500, 0.01);
      const items = Array.from({ length: 100 }, (_, i) => `embedding-vector-hash-${i}`);

      for (const item of items) {
        filter.add(item);
      }

      expect(filter.elementsCount).toBe(100);

      for (const item of items) {
        expect(filter.has(item)).toBe(true);
      }
    });

    it('returns false for most non-inserted items (low false positives)', () => {
      const filter = BloomFilter.createOptimal(1000, 0.01);
      const inserted = Array.from({ length: 200 }, (_, i) => `seen-tx-${i}`);
      for (const item of inserted) {
        filter.add(item);
      }

      let falsePositives = 0;
      const testCount = 500;
      for (let i = 0; i < testCount; i++) {
        if (filter.has(`unseen-tx-${i}`)) {
          falsePositives++;
        }
      }

      // False positive rate should be below 3% (expected 1%)
      expect(falsePositives / testCount).toBeLessThan(0.03);
    });

    it('handles Buffer inputs seamlessly', () => {
      const filter = BloomFilter.createOptimal(100, 0.01);
      const buf1 = Buffer.from('photo-digest-1');
      const buf2 = Buffer.from('photo-digest-2');

      filter.add(buf1);
      expect(filter.has(buf1)).toBe(true);
      expect(filter.has(buf2)).toBe(false);
    });
  });

  describe('clear and getFillRatio', () => {
    it('clears filter bits back to zero', () => {
      const filter = BloomFilter.createOptimal(100, 0.01);
      filter.add('item-1');
      filter.add('item-2');

      expect(filter.getFillRatio()).toBeGreaterThan(0);
      expect(filter.elementsCount).toBe(2);

      filter.clear();
      expect(filter.getFillRatio()).toBe(0);
      expect(filter.elementsCount).toBe(0);
      expect(filter.has('item-1')).toBe(false);
    });
  });

  describe('exportBase64 and fromBase64', () => {
    it('serializes and deserializes filter preserving set membership', () => {
      const original = BloomFilter.createOptimal(500, 0.01);
      const sample = ['key-alpha', 'key-beta', 'key-gamma'];
      for (const k of sample) original.add(k);

      const b64 = original.exportBase64();
      expect(typeof b64).toBe('string');
      expect(b64.length).toBeGreaterThan(0);

      const restored = BloomFilter.fromBase64(b64, original.bitSize, original.hashCount);
      for (const k of sample) {
        expect(restored.has(k)).toBe(true);
      }
      expect(restored.has('key-unseen')).toBe(false);
    });
  });
});
