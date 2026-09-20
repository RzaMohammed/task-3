import { Request, Response, NextFunction, RequestHandler } from 'express';

export interface SlidingWindowRateLimiterOptions {
  windowMs?: number;
  maxRequests?: number;
  burstLimit?: number;
  burstWindowMs?: number;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  message?: string;
  cleanupIntervalMs?: number;
}

interface ClientRequestRecord {
  timestamps: number[];
}

export class SlidingWindowRateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private burstLimit: number;
  private burstWindowMs: number;
  private keyGenerator: (req: Request) => string;
  private skip: (req: Request) => boolean;
  private message: string;
  private store: Map<string, ClientRequestRecord> = new Map();
  private cleanupTimer?: NodeJS.Timeout;

  constructor(options: SlidingWindowRateLimiterOptions = {}) {
    this.windowMs = options.windowMs ?? 60_000;
    this.maxRequests = options.maxRequests ?? 100;
    this.burstLimit = options.burstLimit ?? Math.ceil(this.maxRequests * 0.4);
    this.burstWindowMs = options.burstWindowMs ?? Math.min(5_000, this.windowMs);
    this.keyGenerator = options.keyGenerator ?? ((req: Request) => {
      const forwarded = req.headers['x-forwarded-for'];
      if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
      }
      return req.ip || req.socket.remoteAddress || '127.0.0.1';
    });
    this.skip = options.skip ?? (() => false);
    this.message = options.message ?? 'Too many requests. Please slow down and try again later.';

    const cleanupInterval = options.cleanupIntervalMs ?? 60_000;
    if (cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => this.cleanup(), cleanupInterval);
      if (this.cleanupTimer.unref) {
        this.cleanupTimer.unref();
      }
    }
  }

  public middleware(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      if (this.skip(req)) {
        return next();
      }

      const key = this.keyGenerator(req);
      const now = Date.now();
      const cutoff = now - this.windowMs;
      const burstCutoff = now - this.burstWindowMs;

      let record = this.store.get(key);
      if (!record) {
        record = { timestamps: [] };
        this.store.set(key, record);
      }

      // Filter timestamps outside primary window
      record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

      // Check burst limit
      const recentBurstCount = record.timestamps.filter((ts) => ts > burstCutoff).length;
      if (this.burstLimit > 0 && recentBurstCount >= this.burstLimit) {
        const oldestBurstTimestamp = record.timestamps.find((ts) => ts > burstCutoff) ?? now;
        const retryAfterSec = Math.max(1, Math.ceil((oldestBurstTimestamp + this.burstWindowMs - now) / 1000));

        res.setHeader('X-RateLimit-Limit', this.maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('Retry-After', retryAfterSec.toString());

        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_BURST_EXCEEDED',
            message: `Burst limit of ${this.burstLimit} requests per ${this.burstWindowMs}ms exceeded.`,
            retryAfter: retryAfterSec
          }
        });
      }

      // Check window limit
      if (record.timestamps.length >= this.maxRequests) {
        const oldestTimestamp = record.timestamps[0] ?? now;
        const resetTimeMs = oldestTimestamp + this.windowMs;
        const retryAfterSec = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));

        res.setHeader('X-RateLimit-Limit', this.maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', Math.ceil(resetTimeMs / 1000).toString());
        res.setHeader('Retry-After', retryAfterSec.toString());

        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: this.message,
            retryAfter: retryAfterSec
          }
        });
      }

      // Record this request
      record.timestamps.push(now);

      const remaining = Math.max(0, this.maxRequests - record.timestamps.length);
      const resetTime = Math.ceil((record.timestamps[0] + this.windowMs) / 1000);

      res.setHeader('X-RateLimit-Limit', this.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());
      res.setHeader('X-RateLimit-Reset', resetTime.toString());

      return next();
    };
  }

  public cleanup(): void {
    const cutoff = Date.now() - this.windowMs;
    for (const [key, record] of this.store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => ts > cutoff);
      if (record.timestamps.length === 0) {
        this.store.delete(key);
      }
    }
  }

  public reset(key?: string): void {
    if (key) {
      this.store.delete(key);
    } else {
      this.store.clear();
    }
  }

  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.store.clear();
  }

  public getRecordCount(key: string): number {
    const record = this.store.get(key);
    if (!record) return 0;
    const cutoff = Date.now() - this.windowMs;
    return record.timestamps.filter((ts) => ts > cutoff).length;
  }
}

export const createSlidingWindowLimiter = (options?: SlidingWindowRateLimiterOptions): RequestHandler => {
  const limiter = new SlidingWindowRateLimiter(options);
  return limiter.middleware();
};
