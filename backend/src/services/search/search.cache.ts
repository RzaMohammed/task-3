import crypto from 'crypto';
import { SearchResponsePayload } from './search.types';
import { logger } from '../../utils/logger';

export interface CacheEntry<T> {
  key: string;
  value: T;
  createdAt: number;
  expiresAt: number;
  accessCount: number;
  lastAccessedAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  evictions: number;
  expirations: number;
  size: number;
  hitRatio: number;
}

export interface SearchCacheOptions {
  maxSize?: number;
  defaultTtlMs?: number;
}

export class SearchCache {
  private cache: Map<string, CacheEntry<SearchResponsePayload>> = new Map();
  private maxSize: number;
  private defaultTtlMs: number;

  private stats: {
    hits: number;
    misses: number;
    sets: number;
    evictions: number;
    expirations: number;
  } = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0,
    expirations: 0
  };

  constructor(options: SearchCacheOptions = {}) {
    this.maxSize = options.maxSize ?? 100;
    this.defaultTtlMs = options.defaultTtlMs ?? 60 * 60 * 1000; // 1 hour
  }

  /**
   * Deterministically computes a SHA-256 cache key from an image buffer or input identifier.
   */
  public static computeKey(imageBuffer: Buffer, prefix: string = 'search:'): string {
    const hash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
    return `${prefix}${hash}`;
  }

  /**
   * Retrieves an item from cache if present and unexpired. Updates LRU access ordering.
   */
  public get(key: string): SearchResponsePayload | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.stats.expirations++;
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Refresh access metrics and move to end for LRU
    entry.accessCount++;
    entry.lastAccessedAt = now;
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Stores an item in the cache, evicting the least recently used item if max capacity is reached.
   */
  public set(key: string, value: SearchResponsePayload, ttlMs?: number): void {
    const now = Date.now();
    const ttl = ttlMs ?? this.defaultTtlMs;
    const expiresAt = now + ttl;

    // If key exists, delete first to re-insert at modern position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict oldest (first key in Map insertion order)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.stats.evictions++;
        logger.info(`[SEARCH_CACHE] Evicted oldest entry: ${oldestKey}`);
      }
    }

    this.cache.set(key, {
      key,
      value,
      createdAt: now,
      expiresAt,
      accessCount: 0,
      lastAccessedAt: now
    });

    this.stats.sets++;
  }

  /**
   * Checks if key exists and is unexpired without modifying hit/miss counts.
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.expirations++;
      return false;
    }
    return true;
  }

  /**
   * Deletes a specific key.
   */
  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Cleans up all expired entries in bulk.
   */
  public cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        this.stats.expirations++;
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Clears the entire cache and resets counters if specified.
   */
  public clear(resetStats: boolean = false): void {
    this.cache.clear();
    if (resetStats) {
      this.stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        evictions: 0,
        expirations: 0
      };
    }
  }

  /**
   * Returns snapshot statistics including hit ratio.
   */
  public getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRatio = totalRequests === 0 ? 0 : Number((this.stats.hits / totalRequests).toFixed(4));

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      evictions: this.stats.evictions,
      expirations: this.stats.expirations,
      size: this.cache.size,
      hitRatio
    };
  }
}

// Global default search cache instance
export const searchCache = new SearchCache({
  maxSize: 100,
  defaultTtlMs: 60 * 60 * 1000 // 1 hour
});
