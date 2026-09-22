# Security Safeguards, Observability Metrics & Network Utilities

This document outlines the defense-in-depth security layers, Prometheus observability endpoints, and blockchain network utilities implemented across the Face Verification Pipeline.

---

## 1. SSRF (Server-Side Request Forgery) Defense

To prevent malicious image URLs from probing internal network infrastructure, cloud instance metadata, or local services, the pipeline enforces strict URL validation before issuing any HTTP request.

### Protected Ranges & Blacklisted Destinations
- **Loopback Addresses**: `127.0.0.0/8`, `localhost`, `::1`
- **RFC 1918 Private Subnets**:
  - `10.0.0.0/8`
  - `172.16.0.0/12`
  - `192.168.0.0/16`
- **Cloud Metadata Services**:
  - `169.254.169.254` (AWS, GCP, Azure metadata)
  - `metadata.google.internal`
  - `instance-data`
- **Protocols**: Only `http:` and `https:` are permitted. Schemes like `file:`, `ftp:`, `gopher:`, `javascript:`, or `data:` are immediately blocked.

### Usage
```typescript
import { isSafeUrl, assertSafeUrl } from './utils/urlValidator';

if (!isSafeUrl(userSuppliedUrl)) {
  throw new ValidationError('Blocked potentially unsafe remote URL');
}
```

---

## 2. Security Response Headers Middleware

The `securityHeaders` middleware applies defense-in-depth headers on all API responses:
- `X-Content-Type-Options: nosniff`: Prevents MIME confusion attacks.
- `X-Frame-Options: DENY`: Protects against clickjacking.
- `X-XSS-Protection: 1; mode=block`: Activates reflective XSS filtering.
- `Referrer-Policy: strict-origin-when-cross-origin`: Controls referrer leakage.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`: Restricts sensitive browser features.
- `Strict-Transport-Security` (HSTS): Enforces HTTPS connections.

---

## 3. Prometheus & OpenMetrics Telemetry

The backend exposes real-time telemetry metrics formatted for Prometheus scraping and dashboard ingestion.

### Endpoints
- `GET /metrics` or `GET /api/metrics`
  - Returns plain-text OpenMetrics format (`Content-Type: text/plain; version=0.0.4`).
- `GET /api/metrics/json`
  - Returns structured JSON payload containing counters and latency quantiles.

### Sample Prometheus Output
```text
# HELP pipeline_runs_total Total number of pipeline executions
# TYPE pipeline_runs_total counter
pipeline_runs_total{status="success"} 42
pipeline_runs_total{status="failed"} 1
pipeline_runs_total{status="tampered"} 0

# HELP pipeline_latency_ms Pipeline execution latency quantiles in milliseconds
# TYPE pipeline_latency_ms summary
pipeline_latency_ms{quantile="0.5"} 320
pipeline_latency_ms{quantile="0.9"} 580
pipeline_latency_ms{quantile="0.99"} 940
pipeline_latency_ms_count 43
pipeline_latency_ms_sum 14800

# HELP cache_operations_total Cache hit and miss operations
# TYPE cache_operations_total counter
cache_operations_total{result="hit"} 128
cache_operations_total{result="miss"} 14
```

---

## 4. Solana Network Clusters & Explorer Helpers

Network cluster endpoints and explorer URL generators are centralized in `backend/constants/networks.js`:

```javascript
const { CLUSTERS, buildExplorerUrl } = require('./constants/networks');

// Generate transaction link
const txUrl = buildExplorerUrl('tx', '5VERv8NM...', CLUSTERS.DEVNET);
// -> https://explorer.solana.com/tx/5VERv8NM...?cluster=devnet
```

---

## 5. Resilient RPC Exponential Backoff

For reliable communication with Solana Devnet and external search providers, `retryWithBackoff` introduces jittered exponential backoff:

```typescript
import { retryWithBackoff } from './utils/retryUtils';

const signature = await retryWithBackoff(
  () => connection.sendRawTransaction(txBuffer),
  {
    maxRetries: 3,
    initialDelayMs: 250,
    jitter: true,
  }
);
```
