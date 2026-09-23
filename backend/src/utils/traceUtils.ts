import crypto from 'crypto';

export interface TraceContext {
  version: string;
  traceId: string;
  parentId: string;
  traceFlags: string;
  sampled: boolean;
}

const HEX_32_REGEX = /^[0-9a-f]{32}$/i;
const HEX_16_REGEX = /^[0-9a-f]{16}$/i;
const ALL_ZEROS_32 = '0'.repeat(32);
const ALL_ZEROS_16 = '0'.repeat(16);

/**
 * Validates a 32-character hex trace ID (non-empty and not all zeroes)
 */
export function isValidTraceId(traceId: string): boolean {
  if (!traceId || traceId.length !== 32) return false;
  return HEX_32_REGEX.test(traceId) && traceId !== ALL_ZEROS_32;
}

/**
 * Validates a 16-character hex span/parent ID (non-empty and not all zeroes)
 */
export function isValidSpanId(spanId: string): boolean {
  if (!spanId || spanId.length !== 16) return false;
  return HEX_16_REGEX.test(spanId) && spanId !== ALL_ZEROS_16;
}

/**
 * Generates a random 32-character hex trace identifier
 */
export function generateTraceId(): string {
  let traceId = crypto.randomBytes(16).toString('hex');
  // Highly improbable, but guarantee non-zero per W3C specification
  while (traceId === ALL_ZEROS_32) {
    traceId = crypto.randomBytes(16).toString('hex');
  }
  return traceId;
}

/**
 * Generates a random 16-character hex span identifier
 */
export function generateSpanId(): string {
  let spanId = crypto.randomBytes(8).toString('hex');
  while (spanId === ALL_ZEROS_16) {
    spanId = crypto.randomBytes(8).toString('hex');
  }
  return spanId;
}

/**
 * Parses a standard W3C traceparent header string.
 * Format: 00-{traceId}-{parentId}-{traceFlags}
 */
export function parseTraceparent(header?: string | null): TraceContext | null {
  if (!header || typeof header !== 'string') {
    return null;
  }

  const parts = header.trim().split('-');
  if (parts.length < 4) {
    return null;
  }

  const [version, traceId, parentId, traceFlags] = parts;

  // Currently only version 00 is supported by W3C specification
  if (version !== '00') {
    return null;
  }

  const normalizedTraceId = traceId.toLowerCase();
  const normalizedParentId = parentId.toLowerCase();
  const normalizedFlags = traceFlags.toLowerCase();

  if (!isValidTraceId(normalizedTraceId) || !isValidSpanId(normalizedParentId)) {
    return null;
  }

  if (normalizedFlags.length !== 2 || !/^[0-9a-f]{2}$/i.test(normalizedFlags)) {
    return null;
  }

  const flagsNum = parseInt(normalizedFlags, 16);
  const sampled = (flagsNum & 1) === 1;

  return {
    version: '00',
    traceId: normalizedTraceId,
    parentId: normalizedParentId,
    traceFlags: normalizedFlags,
    sampled,
  };
}

/**
 * Formats a TraceContext object into a W3C traceparent header string
 */
export function formatTraceparent(context: TraceContext): string {
  return `${context.version}-${context.traceId}-${context.parentId}-${context.traceFlags}`;
}

/**
 * Creates a brand new root TraceContext
 */
export function createTraceContext(sampled = true): TraceContext {
  return {
    version: '00',
    traceId: generateTraceId(),
    parentId: generateSpanId(),
    traceFlags: sampled ? '01' : '00',
    sampled,
  };
}

/**
 * Derives a child span context from an existing parent trace context
 */
export function createChildSpan(parent: TraceContext): TraceContext {
  return {
    version: parent.version,
    traceId: parent.traceId,
    parentId: generateSpanId(), // fresh span ID for the child
    traceFlags: parent.traceFlags,
    sampled: parent.sampled,
  };
}
