# Real-Time Telemetry Streaming & Merkle Audit Architecture

This document specifies the technical architecture and protocol specifications for real-time pipeline event streaming, burst-protected sliding-window rate limiting, and cryptographic Merkle tree evidence verification introduced in the verification platform.

---

## 1. Real-Time Pipeline Event Streaming (SSE)

### Overview
The visual search, face analysis, and blockchain verification pipeline operates asynchronously over multiple IO-heavy stages. To provide smooth real-time telemetry to clients without polling overhead or bidirectional WebSocket handshake complexity, the platform provides a **Server-Sent Events (SSE)** endpoint.

```
Client (Browser / Dashboard)
        │
        ├── HTTP GET /api/stream/pipeline/:pipelineId (Accept: text/event-stream)
        │
┌───────▼─────────────────────────────────────────────────────────────┐
│  StreamController (Express)                                         │
│                                                                     │
│  1. Flushes SSE headers (Content-Type: text/event-stream)          │
│  2. Emits 'connected' frame                                         │
│  3. Replays prior stage events from bounded event history buffer   │
│  4. Subscribes to pipelineEventEmitter:                             │
│       pipeline:${pipelineId}:progress -> event: stage:progress     │
│       pipeline:${pipelineId}:complete -> event: pipeline:complete   │
│  5. 15s Keepalive ping interval (: ping\n\n)                        │
└───────────────────────────────────▲─────────────────────────────────┘
                                    │
                       PipelineEventEmitter bus
```

### Protocol & Event Payloads
Clients receive standard SSE event streams structured as:

```http
event: connected
data: {"pipelineId":"pipe-123","status":"CONNECTED","timestamp":"2026-09-20T21:00:00Z"}

event: stage:replay
data: {"pipelineId":"pipe-123","stage":"faceAnalysis","status":"PROCESSING","progressPercent":0,"timestamp":"..."}

event: stage:progress
data: {"pipelineId":"pipe-123","stage":"faceAnalysis","status":"PROCESSING","progressPercent":60,"message":"Extracting 512-D embeddings","timestamp":"..."}

event: stage:progress
data: {"pipelineId":"pipe-123","stage":"faceAnalysis","status":"COMPLETED","progressPercent":100,"durationMs":142,"timestamp":"..."}

event: pipeline:complete
data: {"pipelineId":"pipe-123","status":"VERIFIED","totalMs":845,"timestamp":"..."}
```

---

## 2. Sliding-Window Rate Limiting with Burst Protection

### Design Principles
Standard fixed-window rate limiters suffer from boundary burst exploits (e.g. sending 100 requests at 00:59 and 100 requests at 01:00, effectively executing 200 requests within 2 seconds).

The `SlidingWindowRateLimiter` (`backend/src/middleware/rate-limiter.ts`) enforces two tiers of rate enforcement:
1. **Primary Sliding Window (`windowMs: 60,000`, `maxRequests: 300`)**: Evaluates timestamps of all requests over the trailing 60 seconds.
2. **Short-Interval Burst Guard (`burstWindowMs: 5,000`, `burstLimit: 120`)**: Prevents rapid concurrent spikes by bounding requests in any 5-second window.

### Standard Response Headers
Every response includes informative rate-limiting headers:
- `X-RateLimit-Limit`: Maximum requests permitted within primary window.
- `X-RateLimit-Remaining`: Count of remaining requests allowed.
- `X-RateLimit-Reset`: Unix epoch timestamp (seconds) when oldest request expires.
- `Retry-After`: Estimated seconds to wait when rate-limited.

---

## 3. Cryptographic Merkle Tree Evidence Verification

### Purpose & Selective Disclosure
Evidence packages contain multi-modal fields:
- High-resolution source image hash
- InsightFace 512-D normalized embedding digest
- Web search match URLs, titles, and similarity scores
- Solana transaction signatures and block timestamps
- Device and capture platform metadata

Rather than requiring an auditor or external party to view the complete evidence payload (which may contain sensitive biometric data or PII), the platform decomposes the evidence record into a **Cryptographic Merkle Tree** (`MerkleTree` in `backend/src/services/verification/merkle.service.ts`).

### Domain Separation & Second-Preimage Resistance
To mitigate second-preimage attacks and length extension vulnerabilities:
- **Leaf nodes** are hashed with a `0x00` domain separator:
  $$\text{LeafHash}(m) = \text{SHA-256}(0\text{x}00 \parallel \text{Canonicalize}(m))$$
- **Internal / parent nodes** are hashed with a `0x01` domain separator:
  $$\text{ParentHash}(L, R) = \text{SHA-256}(0\text{x}01 \parallel L \parallel R)$$

### Selective Inclusion Proofs
A client or auditor can independently verify that a specific candidate match or facial embedding hash was committed to Solana without accessing other private fields:
```typescript
import { MerkleTree } from './merkle.service';

const isVerified = MerkleTree.verifyInclusion(
  leafHash,
  proofSteps,
  merkleRoot
);
```

---

## 4. Evidence Audit Bundles & Offline CLI

### Bundle Specification
The `EvidenceAuditBundle` encapsulates:
- `manifest`: Metadata, versioning, SHA-256 checksums of payloads, and on-chain / IPFS anchor references.
- `evidence`: RFC 8785 canonical JSON-serialized evidence record.
- `merkleProof`: Cryptographic inclusion proof for the primary leaf.
- `bundleChecksum`: Deterministic SHA-256 digest of the manifest.

### Offline CLI Verification
Auditors can verify an exported audit bundle without database connections, API keys, or running backend instances:
```bash
npm run verify:bundle -- demo
# or
node scripts/verify-bundle.js path/to/evidence-bundle.json
```
