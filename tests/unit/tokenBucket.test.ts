import { TokenBucketRateLimiter } from '../../backend/src/utils/tokenBucket';

describe('TokenBucketRateLimiter Unit Tests', () => {
  it('allows burst requests up to configured capacity', () => {
    const limiter = new TokenBucketRateLimiter({
      capacity: 5,
      refillRatePerSec: 1,
    });

    const now = 1700000000000;
    for (let i = 0; i < 5; i++) {
      const decision = limiter.consume('client-1', now);
      expect(decision.allowed).toBe(true);
      expect(decision.remainingTokens).toBe(4 - i);
    }

    // 6th request immediately should be rejected
    const blocked = limiter.consume('client-1', now);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  it('refills tokens over time at configured rate', () => {
    const limiter = new TokenBucketRateLimiter({
      capacity: 10,
      refillRatePerSec: 2, // 2 tokens per sec
    });

    const t0 = 1700000000000;
    for (let i = 0; i < 10; i++) {
      limiter.consume('client-2', t0);
    }

    expect(limiter.consume('client-2', t0).allowed).toBe(false);

    // Advance 3 seconds -> 6 tokens refilled
    const t1 = t0 + 3000;
    const decision = limiter.consume('client-2', t1);
    expect(decision.allowed).toBe(true);
    expect(decision.remainingTokens).toBe(5); // 6 - 1
  });

  it('enforces lockout penalty while within cooldown window', () => {
    const limiter = new TokenBucketRateLimiter({
      capacity: 2,
      refillRatePerSec: 1,
    });

    const t0 = 1700000000000;
    limiter.consume('abuser', t0);
    limiter.consume('abuser', t0);

    // 1st violation
    const v1 = limiter.consume('abuser', t0);
    expect(v1.allowed).toBe(false);
    expect(v1.penaltyMultiplier).toBe(1);

    // Requesting immediately within penalty period remains blocked
    const insidePenalty = limiter.consume('abuser', t0 + 500);
    expect(insidePenalty.allowed).toBe(false);
    expect(insidePenalty.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('prunes stale idle buckets to reclaim memory', () => {
    const limiter = new TokenBucketRateLimiter({
      capacity: 5,
      refillRatePerSec: 1,
      staleBucketTtlMs: 5000,
    });

    const t0 = 1700000000000;
    limiter.consume('temp-client', t0);
    expect(limiter.getActiveClientCount()).toBe(1);

    // Prune before TTL
    expect(limiter.prune(t0 + 1000)).toBe(0);

    // Advance past TTL
    const tPast = t0 + 10_000;
    const pruned = limiter.prune(tPast);
    expect(pruned).toBe(1);
    expect(limiter.getActiveClientCount()).toBe(0);
  });

  it('resets rate limit for specific client', () => {
    const limiter = new TokenBucketRateLimiter({
      capacity: 1,
      refillRatePerSec: 1,
    });

    limiter.consume('reset-client');
    expect(limiter.getActiveClientCount()).toBe(1);
    limiter.reset('reset-client');
    expect(limiter.getActiveClientCount()).toBe(0);
  });
});
