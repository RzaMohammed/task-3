import { Request, Response, NextFunction } from 'express';
import {
  parseTraceparent,
  createTraceContext,
  createChildSpan,
  formatTraceparent,
  TraceContext,
} from '../utils/traceUtils';

export interface TracedRequest extends Request {
  traceId?: string;
  spanId?: string;
  traceContext?: TraceContext;
}

/**
 * Distributed Tracing Middleware
 * Extracts incoming W3C traceparent header or initializes a new trace context,
 * attaching trace headers to the outgoing response.
 */
export function tracingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingHeader = req.headers['traceparent'] as string | undefined;
  const existingContext = incomingHeader ? parseTraceparent(incomingHeader) : null;

  let activeContext: TraceContext;
  if (existingContext) {
    // Incoming valid parent trace, create child span
    activeContext = createChildSpan(existingContext);
  } else {
    // Generate new root trace
    activeContext = createTraceContext(true);
  }

  // Attach to request object for downstream controllers and logger
  (req as TracedRequest).traceId = activeContext.traceId;
  (req as TracedRequest).spanId = activeContext.parentId;
  (req as TracedRequest).traceContext = activeContext;

  // Set outgoing headers
  const traceparentHeader = formatTraceparent(activeContext);
  res.setHeader('traceparent', traceparentHeader);
  res.setHeader('x-trace-id', activeContext.traceId);

  next();
}
