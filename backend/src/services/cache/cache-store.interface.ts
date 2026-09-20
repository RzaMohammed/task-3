export interface CacheStoreStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  expirations: number;
  size: number;
  hitRatio: number;
}

export interface CacheStoreOptions {
  maxSize?: number;
  defaultTtlMs?: number;
  prefix?: string;
}

export interface ICacheStore<T = unknown> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
  size(): Promise<number>;
  getStats(): CacheStoreStats;
  isHealthy(): boolean;
  getMode(): 'memory' | 'redis' | 'cluster';
}
