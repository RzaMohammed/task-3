/**
 * Request ID middleware.
 * Attaches a unique request ID to each incoming request for tracing.
 */

const crypto = require('crypto');

function requestId(req, res, next) {
  const id = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
}

module.exports = requestId;
