/**
 * Logger utility for consistent logging across services.
 * Wraps console methods with timestamp and level prefixes.
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

function formatTimestamp() {
  return new Date().toISOString();
}

const logger = {
  error(message, ...args) {
    if (currentLevel >= LOG_LEVELS.ERROR) {
      console.error(`[${formatTimestamp()}] [ERROR] ${message}`, ...args);
    }
  },

  warn(message, ...args) {
    if (currentLevel >= LOG_LEVELS.WARN) {
      console.warn(`[${formatTimestamp()}] [WARN] ${message}`, ...args);
    }
  },

  info(message, ...args) {
    if (currentLevel >= LOG_LEVELS.INFO) {
      console.info(`[${formatTimestamp()}] [INFO] ${message}`, ...args);
    }
  },

  debug(message, ...args) {
    if (currentLevel >= LOG_LEVELS.DEBUG) {
      console.debug(`[${formatTimestamp()}] [DEBUG] ${message}`, ...args);
    }
  },
};

module.exports = logger;
