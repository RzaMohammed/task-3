/**
 * Token Bucket Rate Limiter with Progressive Penalty Backoff
 *
 * Implements token bucket algorithm for smoothing burst traffic while protecting
 * expensive AI face inference and Solana RPC endpoints from abuse. Features
 * adaptive penalty escalations for repeat offenders.
 */

export interface TokenBucketOptions {
  capacity: number;           // Max bucket capacity (burst size)
  refillRatePerSec: number;   // Number of tokens added per second
  costPerRequest?: number;    // Tokens consumed per request (default: 1)
  maxPenaltyMultiplier?: number; // Max penalty factor for repeat violations (default: 8)
  staleBucketTtlMs?: number;  // TTL after which idle client bucket is removed (default: 10 mins)
}

export interface RateLimitDecision {
  allowed: boolean;
  remainingTokens: number;
  retryAfterSeconds: number;
  penaltyMultiplier: number;
  resetTimeMs: number;
}

interface ClientBucket {
  tokens: number;
  lastRefillTimestamp: number;
  consecutiveViolations: number;
  penaltyExpiryTimestamp: number;
}

export class TokenBucketRateLimiter {
  private readonly capacity: number;
  private readonly refillRatePerSec: number;
  private readonly costPerRequest: number;
  private readonly maxPenaltyMultiplier: number;
  private readonly staleBucketTtlMs: number;
  private buckets: Map<string, ClientBucket> = new Map();

  constructor(options: TokenBucketOptions) {
    if (options.capacity <= 0 || options.refillRatePerSec <= 0) {
      throw new Error('Capacity and refillRatePerSec must be positive numbers');
    }
    this.capacity = options.capacity;
    this.refillRatePerSec = options.refillRatePerSec;
    this.costPerRequest = options.costPerRequest ?? 1;
    this.maxPenaltyMultiplier = options.maxPenaltyMultiplier ?? 8;
    this.staleBucketTtlMs = options.staleBucketTtlMs ?? 10 * 60 * 1000;
  }

  private getOrInitBucket(clientId: string, now: number): ClientBucket {
    let bucket = this.buckets.get(clientId);
    if (!bucket) {
      bucket = {
        tokens: this.capacity,
        lastRefillTimestamp: now,
        consecutiveViolations: 0,
        penaltyExpiryTimestamp: 0,
      };
      this.buckets.set(clientId, bucket);
    }
    return bucket;
  }

  private refill(bucket: ClientBucket, now: number): void {
    const elapsedSec = (now - bucket.lastRefillTimestamp) / 1000;
    if (elapsedSec > 0) {
      const addedTokens = elapsedSec * this.refillRatePerSec;
      bucket.tokens = Math.min(this.capacity, bucket.tokens + addedTokens);
      bucket.lastRefillTimestamp = now;
    }
  }

  consume(clientId: string, now = Date.now(), cost = this.costPerRequest): RateLimitDecision {
    const bucket = this.getOrInitBucket(clientId, now);
    this.refill(bucket, now);

    // If client is currently serving a penalty lockout
    if (now < bucket.penaltyExpiryTimestamp) {
      const retryAfterSec = Math.ceil((bucket.penaltyExpiryTimestamp - now) / 1000);
      return {
        allowed: false,
        remainingTokens: Math.floor(bucket.tokens),
        retryAfterSeconds: Math.max(1, retryAfterSec),
        penaltyMultiplier: Math.pow(2, Math.min(bucket.consecutiveViolations, 3)),
        resetTimeMs: bucket.penaltyExpiryTimestamp,
      };
    }

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return {
        allowed: true,
        remainingTokens: Math.floor(bucket.tokens),
        retryAfterSeconds: 0,
        penaltyMultiplier: 1,
        resetTimeMs: now,
      };
    }

    // Rate limited
    bucket.consecutiveViolations += 1;
    const penaltyFactor = Math.min(
      this.maxPenaltyMultiplier,
      Math.pow(2, Math.min(bucket.consecutiveViolations - 1, 4))
    );

    const neededTokens = cost - bucket.tokens;
    const baseWaitSec = Math.ceil(neededTokens / this.refillRatePerSec);
    const retryAfterSec = Math.max(1, baseWaitSec * penaltyFactor);

    bucket.penaltyExpiryTimestamp = now + retryAfterSec * 1000;

    return {
      allowed: false,
      remainingTokens: Math.floor(bucket.tokens),
      retryAfterSeconds: retryAfterSec,
      penaltyMultiplier: penaltyFactor,
      resetTimeMs: bucket.penaltyExpiryTimestamp,
    };
  }

  reset(clientId: string): void {
    this.buckets.delete(clientId);
  }

  prune(now = Date.now()): number {
    let removed = 0;
    for (const [clientId, bucket] of this.buckets.entries()) {
      if (
        now - bucket.lastRefillTimestamp > this.staleBucketTtlMs &&
        now > bucket.penaltyExpiryTimestamp
      ) {
        this.buckets.delete(clientId);
        removed++;
      }
    }
    return removed;
  }

  getActiveClientCount(): number {
    return this.buckets.size;
  }
}
