/**
 * Barrel export for all middleware modules.
 */

const errorHandler = require('./errorHandler');
const rateLimit = require('./rateLimit');
const corsMiddleware = require('./cors');
const requestId = require('./requestId');

module.exports = {
  ...errorHandler,
  rateLimit,
  corsMiddleware,
  requestId,
};
