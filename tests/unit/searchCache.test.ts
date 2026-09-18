import { SearchCache } from '../../backend/src/services/search/search.cache';
import { SearchResponsePayload } from '../../backend/src/services/search/search.types';

describe('SearchCache Unit Test Suite', () => {
  let cache: SearchCache;

  const mockPayload: SearchResponsePayload = {
    success: true,
    query_type: 'visual_image_search',
    result_count: 1,
    results: [
      {
        id: 'match-1',
        title: 'Sample Face',
        url: 'https://example.com/face.jpg',
        source: 'example.com',
        imageUrl: 'https://example.com/face.jpg',
        thumbnailUrl: null,
        description: 'Test face result',
        publishedAt: null,
        resultType: 'image',
        metadata: {}
      }
    ]
  };

  beforeEach(() => {
    cache = new SearchCache({ maxSize: 3, defaultTtlMs: 500 });
  });

  test('computeKey deterministically hashes buffer using SHA-256', () => {
    const buf1 = Buffer.from('test-image-data-1');
    const buf2 = Buffer.from('test-image-data-1');
    const buf3 = Buffer.from('different-image');

    const key1 = SearchCache.computeKey(buf1);
    const key2 = SearchCache.computeKey(buf2);
    const key3 = SearchCache.computeKey(buf3);

    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
    expect(key1.startsWith('search:')).toBe(true);
    expect(key1.length).toBe(7 + 64); // "search:" (7) + 64 hex characters
  });

  test('cache miss returns null and increments miss metric', () => {
    const res = cache.get('non-existent-key');
    expect(res).toBeNull();

    const stats = cache.getStats();
    expect(stats.misses).toBe(1);
    expect(stats.hits).toBe(0);
    expect(stats.hitRatio).toBe(0);
  });

  test('set stores payload and get returns it with hit metric', () => {
    cache.set('key-1', mockPayload);

    expect(cache.has('key-1')).toBe(true);
    const result = cache.get('key-1');
    expect(result).toEqual(mockPayload);

    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(0);
    expect(stats.sets).toBe(1);
    expect(stats.size).toBe(1);
    expect(stats.hitRatio).toBe(1);
  });

  test('evicts least recently used item when reaching maxSize', () => {
    cache.set('k1', mockPayload);
    cache.set('k2', mockPayload);
    cache.set('k3', mockPayload);

    // Access k1 so k2 becomes the least recently used
    cache.get('k1');

    // Add 4th item, exceeding maxSize of 3
    cache.set('k4', mockPayload);

    expect(cache.has('k1')).toBe(true);
    expect(cache.has('k2')).toBe(false); // k2 was evicted
    expect(cache.has('k3')).toBe(true);
    expect(cache.has('k4')).toBe(true);

    const stats = cache.getStats();
    expect(stats.evictions).toBe(1);
    expect(stats.size).toBe(3);
  });

  test('expires entries after TTL and handles cleanup', async () => {
    const shortTtlCache = new SearchCache({ maxSize: 5, defaultTtlMs: 50 });
    shortTtlCache.set('temp-key', mockPayload, 40);

    expect(shortTtlCache.has('temp-key')).toBe(true);

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(shortTtlCache.get('temp-key')).toBeNull();
    const stats = shortTtlCache.getStats();
    expect(stats.expirations).toBe(1);
  });

  test('cleanup method purges all expired keys and returns count', async () => {
    cache.set('expire-soon-1', mockPayload, 30);
    cache.set('expire-soon-2', mockPayload, 30);
    cache.set('keep-alive', mockPayload, 5000);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const cleaned = cache.cleanup();
    expect(cleaned).toBe(2);
    expect(cache.has('expire-soon-1')).toBe(false);
    expect(cache.has('expire-soon-2')).toBe(false);
    expect(cache.has('keep-alive')).toBe(true);
  });

  test('delete and clear operate properly', () => {
    cache.set('k1', mockPayload);
    cache.set('k2', mockPayload);

    expect(cache.delete('k1')).toBe(true);
    expect(cache.has('k1')).toBe(false);
    expect(cache.delete('non-existent')).toBe(false);

    cache.clear(true);
    const stats = cache.getStats();
    expect(stats.size).toBe(0);
    expect(stats.sets).toBe(0);
    expect(stats.hits).toBe(0);
  });
});
