/**
 * Configuration loader.
 * Centralizes environment variable access with defaults and validation.
 */

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,

  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/evidenceai',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
      max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  solana: {
    network: process.env.SOLANA_NETWORK || 'devnet',
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  },

  ai: {
    modelPath: process.env.AI_MODEL_PATH || './models/default',
    confidenceThreshold: parseFloat(process.env.AI_CONFIDENCE_THRESHOLD) || 0.85,
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 50 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'video/mp4', 'application/pdf'],
  },
};

module.exports = config;
