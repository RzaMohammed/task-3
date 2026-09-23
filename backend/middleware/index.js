/**
 * Barrel export for all middleware modules.
 */

const errorHandler = require('./errorHandler');
const rateLimit = require('./rateLimit');
const corsMiddleware = require('./cors');
const requestId = require('./requestId');
const securityHeaders = require('./securityHeaders');
const tracingMiddleware = require('./tracing');

module.exports = {
  ...errorHandler,
  rateLimit,
  corsMiddleware,
  requestId,
  securityHeaders,
  tracingMiddleware,
};

