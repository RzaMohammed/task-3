# API Reference & Endpoints

## Base URL

```
http://localhost:5000/api
```

All responses conform to a unified JSON format with HTTP status codes indicating success or error condition.

---

## Health & Probes

### `GET /api/health`
Returns basic backend service health status, environment, uptime, and configured upstream service URLs.

**Response (200 OK):**
```json
{
  "success": true,
  "service": "backend",
  "status": "running",
  "data": {
    "status": "healthy",
    "uptime": 124,
    "timestamp": "2026-09-17T15:00:00.000Z",
    "version": "1.0.0",
    "environment": "development",
    "services": {
      "backend": "online",
      "ai_service": "http://localhost:8000",
      "search_provider": "serpapi"
    },
    "blockchain_config": {
      "network": "devnet",
      "rpc_url": "https://api.devnet.solana.com"
    }
  }
}
```

### `GET /api/health/deep`
Performs active liveness probes against downstream dependencies (FastAPI AI Service and Solana RPC Devnet cluster) and reports latency metrics.

**Response (200 OK / 503 Service Unavailable):**
```json
{
  "success": true,
  "service": "backend",
  "status": "healthy",
  "timestamp": "2026-09-17T15:00:00.000Z",
  "checks": {
    "ai_service": { "status": "healthy", "latencyMs": 42 },
    "solana_rpc": { "status": "healthy", "latencyMs": 115 }
  }
}
```

### `GET /api/health/ready`
Readiness probe for container orchestrators (Kubernetes / Docker Compose health checks).

**Response (200 OK):**
```json
{
  "success": true,
  "service": "backend",
  "ready": true,
  "timestamp": "2026-09-17T15:00:00.000Z"
}
```

---

## Pipeline & Verification

### `POST /api/pipeline/run`
Multipart form upload executing end-to-end face detection, embedding extraction, reverse web image search, similarity matching, SHA-256 fingerprinting, Solana blockchain memo recording, and on-chain ledger verification.

- **Request**: `multipart/form-data` with `image` file field.
- **Response**: Full pipeline execution trace with status `VERIFIED` or error breakdown.

### `POST /api/evidence/create`
Builds a deterministic canonical JSON representation of match evidence and computes its cryptographic SHA-256 fingerprint.

**Request:**
```json
{
  "match": {
    "url": "https://example.com/photo.jpg",
    "similarity": 0.94,
    "domain": "example.com",
    "title": "Profile Picture"
  },
  "threshold": 0.85
}
```

**Response (200 OK):**
```json
{
  "evidenceId": "ev-...",
  "version": "1.0",
  "sha256Hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "payload": { ... }
}
```

### `POST /api/evidence/verify`
Verifies whether a provided off-chain evidence package has been tampered with by re-computing its canonical JSON SHA-256 hash.

### `POST /api/verification/verify`
Performs cryptographic verification of off-chain evidence against the recorded memo on the Solana blockchain ledger using transaction signatures.

**Request:**
```json
{
  "transactionSignature": "5wKk7pM1zJ8Vsamp...",
  "evidence": { ... },
  "evidenceId": "optional-id"
}
```

### Distributed Tracing Headers
Every HTTP response now includes W3C TraceContext headers:
- `traceparent`: `00-{traceId}-{spanId}-{flags}` (e.g. `00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`)
- `x-trace-id`: 32-character hexadecimal correlation trace identifier.

### Solana Relayer Gas Station
Subsidized evidence anchoring is enabled via `RelayerService`. Sponsoring keypairs co-sign transactions as fee-payers within client rate quotas. See [AUDIT_TRACING_AND_RELAYER.md](./AUDIT_TRACING_AND_RELAYER.md) for detailed specifications.
