import {
  isValidTraceId,
  isValidSpanId,
  generateTraceId,
  generateSpanId,
  parseTraceparent,
  formatTraceparent,
  createTraceContext,
  createChildSpan,
} from '../../backend/src/utils/traceUtils';

describe('W3C Traceparent Context Utilities Unit Tests', () => {
  describe('isValidTraceId & isValidSpanId', () => {
    it('accepts valid 32-character hexadecimal trace IDs', () => {
      expect(isValidTraceId('4bf92f3577b34da6a3ce929d0e0e4736')).toBe(true);
      expect(isValidTraceId('0123456789abcdef0123456789abcdef')).toBe(true);
    });

    it('rejects all-zeros or wrong length trace IDs', () => {
      expect(isValidTraceId('0'.repeat(32))).toBe(false);
      expect(isValidTraceId('4bf92f3577b34da6a3ce929d0e0e473')).toBe(false); // 31 chars
      expect(isValidTraceId('4bf92f3577b34da6a3ce929d0e0e47361')).toBe(false); // 33 chars
      expect(isValidTraceId('4bf92f3577b34da6a3ce929d0e0e473g')).toBe(false); // non-hex
      expect(isValidTraceId('')).toBe(false);
    });

    it('accepts valid 16-character hexadecimal span IDs', () => {
      expect(isValidSpanId('00f067aa0ba902b7')).toBe(true);
      expect(isValidSpanId('1234567890abcdef')).toBe(true);
    });

    it('rejects all-zeros or invalid span IDs', () => {
      expect(isValidSpanId('0'.repeat(16))).toBe(false);
      expect(isValidSpanId('00f067aa0ba902b')).toBe(false); // 15 chars
      expect(isValidSpanId('00f067aa0ba902b71')).toBe(false); // 17 chars
      expect(isValidSpanId('xyz1234567890abc')).toBe(false); // non-hex
    });
  });

  describe('generateTraceId & generateSpanId', () => {
    it('generates non-zero 32-character trace ID', () => {
      const traceId = generateTraceId();
      expect(isValidTraceId(traceId)).toBe(true);
      expect(traceId).toHaveLength(32);
    });

    it('generates non-zero 16-character span ID', () => {
      const spanId = generateSpanId();
      expect(isValidSpanId(spanId)).toBe(true);
      expect(spanId).toHaveLength(16);
    });

    it('generates distinct IDs on successive invocations', () => {
      expect(generateTraceId()).not.toBe(generateTraceId());
      expect(generateSpanId()).not.toBe(generateSpanId());
    });
  });

  describe('parseTraceparent', () => {
    it('successfully parses standard valid W3C traceparent header', () => {
      const header = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
      const parsed = parseTraceparent(header);
      expect(parsed).not.toBeNull();
      expect(parsed?.version).toBe('00');
      expect(parsed?.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
      expect(parsed?.parentId).toBe('00f067aa0ba902b7');
      expect(parsed?.traceFlags).toBe('01');
      expect(parsed?.sampled).toBe(true);
    });

    it('parses unsampled flag correctly', () => {
      const header = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00';
      const parsed = parseTraceparent(header);
      expect(parsed?.sampled).toBe(false);
      expect(parsed?.traceFlags).toBe('00');
    });

    it('returns null for unsupported version', () => {
      const header = '01-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
      expect(parseTraceparent(header)).toBeNull();
    });

    it('returns null for all-zero traceId or parentId', () => {
      expect(
        parseTraceparent(`00-${'0'.repeat(32)}-00f067aa0ba902b7-01`)
      ).toBeNull();
      expect(
        parseTraceparent(`00-4bf92f3577b34da6a3ce929d0e0e4736-${'0'.repeat(16)}-01`)
      ).toBeNull();
    });

    it('returns null for malformed or empty inputs', () => {
      expect(parseTraceparent(undefined)).toBeNull();
      expect(parseTraceparent('')).toBeNull();
      expect(parseTraceparent('invalid-traceparent')).toBeNull();
      expect(parseTraceparent('00-short-id-01')).toBeNull();
    });
  });

  describe('formatTraceparent & Span Derivation', () => {
    it('formats TraceContext back into W3C string faithfully', () => {
      const ctx = {
        version: '00',
        traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
        parentId: '00f067aa0ba902b7',
        traceFlags: '01',
        sampled: true,
      };
      expect(formatTraceparent(ctx)).toBe('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01');
    });

    it('creates root trace context with valid IDs', () => {
      const root = createTraceContext(true);
      expect(root.version).toBe('00');
      expect(isValidTraceId(root.traceId)).toBe(true);
      expect(isValidSpanId(root.parentId)).toBe(true);
      expect(root.traceFlags).toBe('01');
      expect(root.sampled).toBe(true);
    });

    it('derives child span preserving traceId while changing spanId', () => {
      const parent = createTraceContext(true);
      const child = createChildSpan(parent);

      expect(child.traceId).toBe(parent.traceId);
      expect(child.parentId).not.toBe(parent.parentId);
      expect(isValidSpanId(child.parentId)).toBe(true);
      expect(child.sampled).toBe(parent.sampled);
    });
  });
});
