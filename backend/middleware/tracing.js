const crypto = require('crypto');

function isValidTraceId(traceId) {
  if (!traceId || traceId.length !== 32) return false;
  return /^[0-9a-f]{32}$/i.test(traceId) && traceId !== '0'.repeat(32);
}

function isValidSpanId(spanId) {
  if (!spanId || spanId.length !== 16) return false;
  return /^[0-9a-f]{16}$/i.test(spanId) && spanId !== '0'.repeat(16);
}

function generateTraceId() {
  let id = crypto.randomBytes(16).toString('hex');
  while (id === '0'.repeat(32)) id = crypto.randomBytes(16).toString('hex');
  return id;
}

function generateSpanId() {
  let id = crypto.randomBytes(8).toString('hex');
  while (id === '0'.repeat(16)) id = crypto.randomBytes(8).toString('hex');
  return id;
}

function parseTraceparent(header) {
  if (!header || typeof header !== 'string') return null;
  const parts = header.trim().split('-');
  if (parts.length < 4 || parts[0] !== '00') return null;
  const traceId = parts[1].toLowerCase();
  const parentId = parts[2].toLowerCase();
  const flags = parts[3].toLowerCase();

  if (!isValidTraceId(traceId) || !isValidSpanId(parentId) || !/^[0-9a-f]{2}$/i.test(flags)) {
    return null;
  }
  return { version: '00', traceId, parentId, traceFlags: flags };
}

function tracingMiddleware(req, res, next) {
  const incoming = req.headers ? req.headers['traceparent'] : undefined;
  const existing = parseTraceparent(incoming);

  const traceId = existing ? existing.traceId : generateTraceId();
  const spanId = generateSpanId();
  const traceFlags = existing ? existing.traceFlags : '01';
  const headerVal = `00-${traceId}-${spanId}-${traceFlags}`;

  req.traceId = traceId;
  req.spanId = spanId;

  if (typeof res.setHeader === 'function') {
    res.setHeader('traceparent', headerVal);
    res.setHeader('x-trace-id', traceId);
  }

  next();
}

module.exports = tracingMiddleware;
