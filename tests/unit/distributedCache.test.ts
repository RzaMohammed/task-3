import { MemoryCacheStore } from '../../backend/src/services/cache/memory-cache-store';
import { DistributedCacheService } from '../../backend/src/services/cache/distributed-cache.service';

describe('Distributed Cache Store Unit Test Suite', () => {
  describe('MemoryCacheStore', () => {
    let cache: MemoryCacheStore<any>;

    beforeEach(() => {
      cache = new MemoryCacheStore({
        maxSize: 3,
        defaultTtlMs: 1000,
        prefix: 'test'
      });
    });

    test('stores and retrieves cached values correctly', async () => {
      await cache.set('item-1', { name: 'Alice', role: 'admin' });
      const val = await cache.get('item-1');

      expect(val).toBeDefined();
      expect(val.name).toBe('Alice');
      expect(val.role).toBe('admin');
    });

    test('returns null and increments misses when key does not exist', async () => {
      const val = await cache.get('nonexistent');
      expect(val).toBeNull();

      const stats = cache.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.hits).toBe(0);
      expect(stats.hitRatio).toBe(0);
    });

    test('expires items after TTL exceeds duration', async () => {
      await cache.set('short-lived', 'temporary-data', 20); // 20ms TTL

      // Immediately available
      let item = await cache.get('short-lived');
      expect(item).toBe('temporary-data');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 35));

      item = await cache.get('short-lived');
      expect(item).toBeNull();

      const stats = cache.getStats();
      expect(stats.expirations).toBe(1);
    });

    test('enforces LRU eviction when capacity reaches maxSize', async () => {
      await cache.set('k1', 'val1');
      await cache.set('k2', 'val2');
      await cache.set('k3', 'val3');

      // Access k1 to make k2 the least recently used
      await cache.get('k1');

      // Add k4 -> should evict k2
      await cache.set('k4', 'val4');

      expect(await cache.get('k1')).toBe('val1');
      expect(await cache.get('k2')).toBeNull();
      expect(await cache.get('k3')).toBe('val3');
      expect(await cache.get('k4')).toBe('val4');

      const stats = cache.getStats();
      expect(stats.evictions).toBe(1);
    });

    test('deletes existing keys and updates delete count', async () => {
      await cache.set('to-delete', 'xyz');
      expect(await cache.has('to-delete')).toBe(true);

      const deleted = await cache.delete('to-delete');
      expect(deleted).toBe(true);
      expect(await cache.has('to-delete')).toBe(false);

      const stats = cache.getStats();
      expect(stats.deletes).toBe(1);
    });

    test('clears all items in the cache', async () => {
      await cache.set('a', 1);
      await cache.set('b', 2);
      expect(await cache.size()).toBe(2);

      await cache.clear();
      expect(await cache.size()).toBe(0);
      expect(await cache.get('a')).toBeNull();
    });

    test('calculates accurate hit ratio statistics', async () => {
      await cache.set('target', 'found');

      await cache.get('target'); // hit 1
      await cache.get('target'); // hit 2
      await cache.get('missing-1'); // miss 1
      await cache.get('missing-2'); // miss 2

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRatio).toBe(0.5);
    });
  });

  describe('DistributedCacheService', () => {
    let distributed: DistributedCacheService<any>;

    beforeEach(() => {
      distributed = new DistributedCacheService({
        mode: 'auto',
        maxSize: 10,
        defaultTtlMs: 5000
      });
    });

    test('initializes in memory mode with healthy status', () => {
      expect(distributed.getMode()).toBe('memory');
      expect(distributed.isHealthy()).toBe(true);
    });

    test('performs basic get, set, and has operations seamlessly', async () => {
      await distributed.set('user-session', { uid: 'usr-998', ip: '10.0.0.1' });
      expect(await distributed.has('user-session')).toBe(true);

      const session = await distributed.get('user-session');
      expect(session).toEqual({ uid: 'usr-998', ip: '10.0.0.1' });
    });

    test('performs batch mset and mget operations', async () => {
      await distributed.mset([
        { key: 'item:1', value: 'Alpha' },
        { key: 'item:2', value: 'Beta' },
        { key: 'item:3', value: 'Gamma' }
      ]);

      const map = await distributed.mget(['item:1', 'item:2', 'item:3', 'item:missing']);
      expect(map.get('item:1')).toBe('Alpha');
      expect(map.get('item:2')).toBe('Beta');
      expect(map.get('item:3')).toBe('Gamma');
      expect(map.get('item:missing')).toBeNull();
    });

    test('cleans up and deletes keys cleanly', async () => {
      await distributed.set('temp', 42);
      const delResult = await distributed.delete('temp');
      expect(delResult).toBe(true);
      expect(await distributed.get('temp')).toBeNull();
    });
  });
});
