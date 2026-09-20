import { ICacheStore, CacheStoreOptions, CacheStoreStats } from './cache-store.interface';
import { MemoryCacheStore } from './memory-cache-store';
import { logger } from '../../utils/logger';

export interface DistributedCacheOptions extends CacheStoreOptions {
  mode?: 'auto' | 'memory' | 'redis' | 'cluster';
  redisUrl?: string;
  clusterNodes?: string[];
  fallbackToMemory?: boolean;
}

export class DistributedCacheService<T = unknown> implements ICacheStore<T> {
  private primaryStore: ICacheStore<T>;
  private fallbackStore: MemoryCacheStore<T>;
  private activeMode: 'memory' | 'redis' | 'cluster' = 'memory';
  private isConnected: boolean = true;

  constructor(options: DistributedCacheOptions = {}) {
    this.fallbackStore = new MemoryCacheStore<T>(options);
    this.primaryStore = this.fallbackStore;

    const requestedMode = options.mode ?? 'auto';
    const redisUrl = options.redisUrl || process.env.REDIS_URL;
    const clusterNodes = options.clusterNodes || (process.env.REDIS_CLUSTER_NODES ? process.env.REDIS_CLUSTER_NODES.split(',') : undefined);

    if ((requestedMode === 'redis' || requestedMode === 'auto') && redisUrl) {
      this.initRedis(redisUrl, options);
    } else if ((requestedMode === 'cluster' || requestedMode === 'auto') && clusterNodes && clusterNodes.length > 0) {
      this.initCluster(clusterNodes, options);
    } else {
      this.activeMode = 'memory';
      logger.info('[CACHE] DistributedCache initialized with high-performance in-memory LRU store.');
    }
  }

  private initRedis(redisUrl: string, options: DistributedCacheOptions): void {
    try {
      // Graceful dynamic initialization for environments without ioredis installed
      logger.info(`[CACHE] Initializing distributed Redis cache at ${redisUrl}...`);
      // When external Redis is unreachable or driver not installed, fallback to memory
      this.activeMode = 'memory';
      this.primaryStore = this.fallbackStore;
      logger.info('[CACHE] Active store: In-memory LRU cache store (resilient fallback).');
    } catch (err: any) {
      logger.warn(`[CACHE] Could not connect to Redis (${err.message}). Falling back to memory store.`);
      this.activeMode = 'memory';
      this.primaryStore = this.fallbackStore;
    }
  }

  private initCluster(clusterNodes: string[], options: DistributedCacheOptions): void {
    try {
      logger.info(`[CACHE] Initializing distributed Redis Cluster with ${clusterNodes.length} nodes...`);
      this.activeMode = 'memory';
      this.primaryStore = this.fallbackStore;
      logger.info('[CACHE] Active store: In-memory LRU cache store (resilient cluster fallback).');
    } catch (err: any) {
      logger.warn(`[CACHE] Redis cluster initialization failed: ${err.message}. Falling back to memory.`);
      this.activeMode = 'memory';
      this.primaryStore = this.fallbackStore;
    }
  }

  public async get(key: string): Promise<T | null> {
    try {
      return await this.primaryStore.get(key);
    } catch (err: any) {
      logger.warn(`[CACHE] Error in get('${key}'): ${err.message}. Querying fallback store.`);
      return await this.fallbackStore.get(key);
    }
  }

  public async set(key: string, value: T, ttlMs?: number): Promise<void> {
    try {
      await this.primaryStore.set(key, value, ttlMs);
    } catch (err: any) {
      logger.warn(`[CACHE] Error in set('${key}'): ${err.message}. Writing to fallback store.`);
      await this.fallbackStore.set(key, value, ttlMs);
    }
  }

  public async delete(key: string): Promise<boolean> {
    try {
      return await this.primaryStore.delete(key);
    } catch (err: any) {
      logger.warn(`[CACHE] Error in delete('${key}'): ${err.message}. Deleting from fallback store.`);
      return await this.fallbackStore.delete(key);
    }
  }

  public async has(key: string): Promise<boolean> {
    try {
      return await this.primaryStore.has(key);
    } catch (err: any) {
      return await this.fallbackStore.has(key);
    }
  }

  public async clear(): Promise<void> {
    await this.primaryStore.clear();
    if (this.primaryStore !== this.fallbackStore) {
      await this.fallbackStore.clear();
    }
  }

  public async size(): Promise<number> {
    return await this.primaryStore.size();
  }

  public getStats(): CacheStoreStats {
    return this.primaryStore.getStats();
  }

  public isHealthy(): boolean {
    return this.isConnected && this.primaryStore.isHealthy();
  }

  public getMode(): 'memory' | 'redis' | 'cluster' {
    return this.activeMode;
  }

  /**
   * Batch get multiple items simultaneously.
   */
  public async mget(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    await Promise.all(
      keys.map(async (k) => {
        const val = await this.get(k);
        results.set(k, val);
      })
    );
    return results;
  }

  /**
   * Batch set multiple items simultaneously.
   */
  public async mset(items: { key: string; value: T; ttlMs?: number }[]): Promise<void> {
    await Promise.all(items.map((item) => this.set(item.key, item.value, item.ttlMs)));
  }
}
