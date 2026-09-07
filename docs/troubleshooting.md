# Troubleshooting & Debugging Guide

This guide provides resolutions for common issues encountered during local development, test execution, or deployment.

## Common Issues & Solutions

### 1. Solana Devnet Rate Limits (429 Too Many Requests)
**Symptom**: `429 Too Many Requests` or RPC timeout when sending transactions to `https://api.devnet.solana.com`.
**Cause**: Public Solana Devnet RPC nodes have strict IP rate limits.
**Solution**:
- Use an RPC provider with higher limits (e.g. QuickNode, Helius, Alchemy).
- Configure `SOLANA_RPC_URL` in `.env`:
  ```env
  SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=your-key
  ```
- Or enable `DEMO_MODE=true` for deterministic offline testing.

### 2. AI Service Connection Refused (ECONNREFUSED)
**Symptom**: Backend logs show `ECONNREFUSED 127.0.0.1:8000`.
**Solution**:
- Ensure the Python FastAPI face service is running:
  ```bash
  cd ai-service && uvicorn app:app --port 8000
  ```
- Or run the multi-container stack via Docker Compose:
  ```bash
  docker-compose up -d
  ```

### 3. Face Detection Failure (NO_FACE or MULTIPLE_FACES)
**Symptom**: Pipeline aborts with status `NO_FACE` or `MULTIPLE_FACES`.
**Cause**: The input image must contain exactly one clearly visible face for high-confidence biometric matching.
**Solution**:
- Ensure the query image is well-lit, frontal, and unobstructed.
- Supported file types: PNG, JPEG, WebP. Maximum file size: 10MB.

### 4. Port Conflicts (EADDRINUSE)
**Symptom**: `Error: listen EADDRINUSE: address already in use :::5000` or `:::5173`.
**Solution**:
- Change the port in `.env` (`BACKEND_PORT=5001`).
- Or terminate lingering node processes:
  - Windows: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force`
  - Linux/macOS: `fuser -k 5000/tcp`
