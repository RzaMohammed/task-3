import { ICacheStore, CacheStoreOptions, CacheStoreStats } from './cache-store.interface';

interface MemoryCacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number;
  lastAccessedAt: number;
}

export class MemoryCacheStore<T = unknown> implements ICacheStore<T> {
  private store: Map<string, MemoryCacheEntry<T>> = new Map();
  private maxSize: number;
  private defaultTtlMs: number;
  private prefix: string;

  private stats: {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    evictions: number;
    expirations: number;
  } = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    expirations: 0
  };

  constructor(options: CacheStoreOptions = {}) {
    this.maxSize = options.maxSize ?? 1000;
    this.defaultTtlMs = options.defaultTtlMs ?? 60 * 60 * 1000; // 1 hour
    this.prefix = options.prefix ?? '';
  }

  private formatKey(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key;
  }

  public async get(key: string): Promise<T | null> {
    const formattedKey = this.formatKey(key);
    const entry = this.store.get(formattedKey);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.stats.expirations++;
      this.store.delete(formattedKey);
      this.stats.misses++;
      return null;
    }

    // Refresh LRU ordering
    entry.lastAccessedAt = now;
    this.store.delete(formattedKey);
    this.store.set(formattedKey, entry);

    this.stats.hits++;
    return entry.value;
  }

  public async set(key: string, value: T, ttlMs?: number): Promise<void> {
    const formattedKey = this.formatKey(key);
    const now = Date.now();
    const ttl = ttlMs ?? this.defaultTtlMs;
    const expiresAt = now + ttl;

    if (this.store.has(formattedKey)) {
      this.store.delete(formattedKey);
    } else if (this.store.size >= this.maxSize) {
      // Evict oldest (first key in Map iterator)
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        this.store.delete(oldestKey);
        this.stats.evictions++;
      }
    }

    this.store.set(formattedKey, {
      value,
      createdAt: now,
      expiresAt,
      lastAccessedAt: now
    });

    this.stats.sets++;
  }

  public async delete(key: string): Promise<boolean> {
    const formattedKey = this.formatKey(key);
    const existed = this.store.delete(formattedKey);
    if (existed) {
      this.stats.deletes++;
    }
    return existed;
  }

  public async has(key: string): Promise<boolean> {
    const item = await this.get(key);
    return item !== null;
  }

  public async clear(): Promise<void> {
    this.store.clear();
  }

  public async size(): Promise<number> {
    return this.store.size;
  }

  public getStats(): CacheStoreStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRatio = totalRequests > 0 ? Number((this.stats.hits / totalRequests).toFixed(4)) : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      evictions: this.stats.evictions,
      expirations: this.stats.expirations,
      size: this.store.size,
      hitRatio
    };
  }

  public isHealthy(): boolean {
    return true;
  }

  public getMode(): 'memory' | 'redis' | 'cluster' {
    return 'memory';
  }
}
