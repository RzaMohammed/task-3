import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  BACKEND_PORT: parseInt(process.env.BACKEND_PORT || '5000', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',

  // Visual Search Configuration
  SEARCH_PROVIDER: process.env.SEARCH_PROVIDER || 'serpapi',
  SEARCH_API_KEY: process.env.SEARCH_API_KEY || '',
  SEARCH_API_URL: process.env.SEARCH_API_URL || 'https://serpapi.com/search.json',
  SEARCH_MAX_RESULTS: parseInt(process.env.SEARCH_MAX_RESULTS || '10', 10),
  SEARCH_TIMEOUT_MS: parseInt(process.env.SEARCH_TIMEOUT_MS || '15000', 10),

  // Face Matching Configuration
  MATCH_THRESHOLD: parseFloat(process.env.MATCH_THRESHOLD || '0.85'),
  MAX_CONCURRENT_CANDIDATES: parseInt(process.env.MAX_CONCURRENT_CANDIDATES || '3', 10),
  CANDIDATE_DOWNLOAD_TIMEOUT_MS: parseInt(process.env.CANDIDATE_DOWNLOAD_TIMEOUT_MS || '10000', 10),

  // Blockchain Configuration (Solana Devnet)
  SOLANA_NETWORK: process.env.SOLANA_NETWORK || 'devnet',
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  SOLANA_PRIVATE_KEY: process.env.SOLANA_PRIVATE_KEY || '',
  MAX_BLOCKCHAIN_RETRIES: parseInt(process.env.MAX_BLOCKCHAIN_RETRIES || '2', 10),
  BLOCKCHAIN_TIMEOUT_MS: parseInt(process.env.BLOCKCHAIN_TIMEOUT_MS || '15000', 10),
};
