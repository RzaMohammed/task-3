# Environment Variables Reference

This document provides a comprehensive reference of all environment variables used by the Face Recognition Blockchain Verification Pipeline.

## Core Backend Variables

| Variable | Description | Default / Example | Required in Production |
|----------|-------------|-------------------|------------------------|
| `NODE_ENV` | Runtime environment (`development`, `production`, `test`) | `development` | Yes |
| `BACKEND_PORT` | Port for Express HTTP server | `5000` | No |
| `FRONTEND_URL` | Allowed CORS origin for frontend client | `http://localhost:5173` | Yes |
| `LOG_LEVEL` | Logging verbosity (`debug`, `info`, `warn`, `error`) | `info` | No |
| `AI_SERVICE_URL` | Base URL for FastAPI Python AI service | `http://localhost:8000` | Yes |

## Visual Search Configuration

| Variable | Description | Default / Example | Required in Production |
|----------|-------------|-------------------|------------------------|
| `SEARCH_PROVIDER` | Reverse search provider (`serpapi`, `bing`, `mock`) | `serpapi` | Yes |
| `SEARCH_API_KEY` | API authentication key for search provider | `""` | Yes |
| `SEARCH_API_URL` | Custom search API endpoint URL | `https://serpapi.com/search.json` | No |
| `SEARCH_MAX_RESULTS` | Maximum visual matches to retrieve (1-50) | `10` | No |
| `SEARCH_TIMEOUT_MS` | Search provider HTTP request timeout | `15000` (15s) | No |

## Face Analysis & Matching Configuration

| Variable | Description | Default / Example | Required in Production |
|----------|-------------|-------------------|------------------------|
| `MATCH_THRESHOLD` | Minimum cosine similarity threshold for positive match | `0.85` | No |
| `MAX_CONCURRENT_CANDIDATES` | Max parallel image downloads for face analysis | `3` | No |
| `CANDIDATE_DOWNLOAD_TIMEOUT_MS` | Timeout per candidate image download | `10000` (10s) | No |

## Solana Blockchain Anchoring Configuration

| Variable | Description | Default / Example | Required in Production |
|----------|-------------|-------------------|------------------------|
| `SOLANA_NETWORK` | Solana cluster (`devnet`, `testnet`, `mainnet-beta`) | `devnet` | Yes |
| `SOLANA_RPC_URL` | Solana JSON-RPC cluster endpoint | `https://api.devnet.solana.com` | Yes |
| `SOLANA_PRIVATE_KEY` | Base58 or JSON byte array private key for fee payer | `""` | Yes |
| `MAX_BLOCKCHAIN_RETRIES` | Max retry attempts for transient RPC timeouts | `2` | No |
| `BLOCKCHAIN_TIMEOUT_MS` | Solana transaction confirmation timeout | `15000` (15s) | No |

## Security Best Practices

1. **Private Keys**: Never commit `.env` or hardcode `SOLANA_PRIVATE_KEY` in source control. Use environment variable injection or secret management vaults (e.g. AWS Secrets Manager, Doppler, Vault).
2. **Key Rotation**: Rotate `SEARCH_API_KEY` and Solana fee-payer keypairs regularly.
3. **Restricted RPC**: In production, use a dedicated RPC provider (Helius, QuickNode, Alchemy) instead of the public rate-limited devnet endpoint.

