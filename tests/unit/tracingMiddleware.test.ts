import { tracingMiddleware as tsTracingMiddleware } from '../../backend/src/middleware/tracing.middleware';
// @ts-ignore
const jsTracingMiddleware = require('../../backend/middleware/tracing');

describe('Distributed Tracing Middleware Unit Tests', () => {
  let mockReq: any;
  let mockRes: any;
  let nextFn: jest.Mock;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      headers: {} as Record<string, string>,
      setHeader: jest.fn((key: string, val: string) => {
        mockRes.headers[key.toLowerCase()] = val;
      }),
    };
    nextFn = jest.fn();
  });

  describe('TypeScript Tracing Middleware', () => {
    it('generates a fresh trace ID and sets response headers when no traceparent is supplied', () => {
      tsTracingMiddleware(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalledTimes(1);
      expect(mockReq.traceId).toBeDefined();
      expect(mockReq.traceId).toHaveLength(32);
      expect(mockReq.spanId).toBeDefined();
      expect(mockReq.spanId).toHaveLength(16);

      expect(mockRes.setHeader).toHaveBeenCalledWith('traceparent', expect.stringMatching(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/));
      expect(mockRes.setHeader).toHaveBeenCalledWith('x-trace-id', mockReq.traceId);
    });

    it('propagates incoming trace ID from valid traceparent and spawns child span ID', () => {
      const incomingTraceId = '4bf92f3577b34da6a3ce929d0e0e4736';
      const incomingSpanId = '00f067aa0ba902b7';
      mockReq.headers['traceparent'] = `00-${incomingTraceId}-${incomingSpanId}-01`;

      tsTracingMiddleware(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalledTimes(1);
      expect(mockReq.traceId).toBe(incomingTraceId);
      // New child span should differ from parent span
      expect(mockReq.spanId).not.toBe(incomingSpanId);
      expect(mockReq.spanId).toHaveLength(16);

      const sentTraceparent = mockRes.headers['traceparent'];
      expect(sentTraceparent).toContain(incomingTraceId);
      expect(sentTraceparent).toContain(mockReq.spanId);
    });

    it('replaces malformed traceparent with fresh trace context safely', () => {
      mockReq.headers['traceparent'] = 'garbage-traceparent-header';

      tsTracingMiddleware(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalledTimes(1);
      expect(mockReq.traceId).toBeDefined();
      expect(mockReq.traceId).toHaveLength(32);
      expect(mockRes.setHeader).toHaveBeenCalledWith('x-trace-id', mockReq.traceId);
    });
  });

  describe('CommonJS Tracing Middleware', () => {
    it('behaves consistently in CommonJS runtime', () => {
      jsTracingMiddleware(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalledTimes(1);
      expect(mockReq.traceId).toBeDefined();
      expect(mockReq.traceId).toHaveLength(32);
      expect(mockRes.setHeader).toHaveBeenCalledWith('x-trace-id', mockReq.traceId);
      expect(mockRes.setHeader).toHaveBeenCalledWith('traceparent', expect.stringMatching(/^00-/));
    });
  });
});
