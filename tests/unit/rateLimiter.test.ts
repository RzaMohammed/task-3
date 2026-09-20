import { SlidingWindowRateLimiter } from '../../backend/src/middleware/rate-limiter';

describe('SlidingWindowRateLimiter Unit Test Suite', () => {
  let limiter: SlidingWindowRateLimiter;

  const createMockReqRes = (ip = '127.0.0.1', headers: Record<string, string> = {}) => {
    const req: any = {
      ip,
      headers: { ...headers },
      socket: { remoteAddress: ip }
    };

    const resHeaders: Record<string, string> = {};
    let statusCode = 200;
    let jsonBody: any = null;

    const res: any = {
      setHeader: jest.fn((name: string, value: string) => {
        resHeaders[name.toLowerCase()] = value;
      }),
      status: jest.fn((code: number) => {
        statusCode = code;
        return res;
      }),
      json: jest.fn((body: any) => {
        jsonBody = body;
        return res;
      }),
      headersSent: false
    };

    return { req, res, resHeaders, getStatusCode: () => statusCode, getJson: () => jsonBody };
  };

  afterEach(() => {
    if (limiter) {
      limiter.destroy();
    }
  });

  test('allows requests below limit and attaches standard rate limit headers', () => {
    limiter = new SlidingWindowRateLimiter({
      windowMs: 10_000,
      maxRequests: 5,
      burstLimit: 5,
      cleanupIntervalMs: 0
    });

    const mw = limiter.middleware();
    const { req, res, resHeaders } = createMockReqRes('192.168.1.10');
    const next = jest.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(resHeaders['x-ratelimit-limit']).toBe('5');
    expect(resHeaders['x-ratelimit-remaining']).toBe('4');
    expect(resHeaders['x-ratelimit-reset']).toBeDefined();
  });

  test('decrements remaining tokens sequentially across successive requests', () => {
    limiter = new SlidingWindowRateLimiter({
      windowMs: 10_000,
      maxRequests: 3,
      burstLimit: 5,
      cleanupIntervalMs: 0
    });

    const mw = limiter.middleware();
    const next = jest.fn();

    for (let i = 0; i < 3; i++) {
      const { req, res, resHeaders } = createMockReqRes('10.0.0.1');
      mw(req, res, next);
      expect(resHeaders['x-ratelimit-remaining']).toBe((3 - (i + 1)).toString());
    }

    expect(next).toHaveBeenCalledTimes(3);
  });

  test('returns 429 RATE_LIMIT_EXCEEDED when maxRequests is reached', () => {
    limiter = new SlidingWindowRateLimiter({
      windowMs: 5_000,
      maxRequests: 2,
      burstLimit: 10,
      cleanupIntervalMs: 0
    });

    const mw = limiter.middleware();
    const next = jest.fn();

    // 2 allowed requests
    const call1 = createMockReqRes('10.0.0.2');
    mw(call1.req, call1.res, next);

    const call2 = createMockReqRes('10.0.0.2');
    mw(call2.req, call2.res, next);

    // 3rd request should exceed
    const call3 = createMockReqRes('10.0.0.2');
    mw(call3.req, call3.res, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(call3.getStatusCode()).toBe(429);
    expect(call3.getJson().error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(call3.resHeaders['retry-after']).toBeDefined();
  });

  test('enforces burstLimit when requests arrive too quickly in burst window', () => {
    limiter = new SlidingWindowRateLimiter({
      windowMs: 60_000,
      maxRequests: 100,
      burstLimit: 2,
      burstWindowMs: 2_000,
      cleanupIntervalMs: 0
    });

    const mw = limiter.middleware();
    const next = jest.fn();

    // First two within burst limit
    const call1 = createMockReqRes('10.0.0.3');
    mw(call1.req, call1.res, next);

    const call2 = createMockReqRes('10.0.0.3');
    mw(call2.req, call2.res, next);

    // Third exceeds burst
    const call3 = createMockReqRes('10.0.0.3');
    mw(call3.req, call3.res, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(call3.getStatusCode()).toBe(429);
    expect(call3.getJson().error.code).toBe('RATE_LIMIT_BURST_EXCEEDED');
  });

  test('honors skip option to bypass rate limiting for whitelisted requests', () => {
    limiter = new SlidingWindowRateLimiter({
      windowMs: 10_000,
      maxRequests: 1,
      skip: (req) => req.headers['x-bypass-token'] === 'secret-admin'
    });

    const mw = limiter.middleware();
    const next = jest.fn();

    const call1 = createMockReqRes('10.0.0.4', { 'x-bypass-token': 'secret-admin' });
    mw(call1.req, call1.res, next);

    const call2 = createMockReqRes('10.0.0.4', { 'x-bypass-token': 'secret-admin' });
    mw(call2.req, call2.res, next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  test('reset clears recorded requests allowing new requests', () => {
    limiter = new SlidingWindowRateLimiter({
      windowMs: 10_000,
      maxRequests: 1,
      burstLimit: 1
    });

    const mw = limiter.middleware();
    const next = jest.fn();

    const call1 = createMockReqRes('10.0.0.5');
    mw(call1.req, call1.res, next);

    limiter.reset('10.0.0.5');

    const call2 = createMockReqRes('10.0.0.5');
    mw(call2.req, call2.res, next);

    expect(next).toHaveBeenCalledTimes(2);
  });
});
