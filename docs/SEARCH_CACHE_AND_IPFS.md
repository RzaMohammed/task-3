# Visual Search Caching & IPFS Evidence Persistence Architecture

This document provides technical design specifications for the search caching layer, real-time pipeline event lifecycle, and decentralized IPFS evidence storage within the Face Recognition Blockchain Verifier.

---

## 1. Visual Search Caching Subsystem

### 1.1 Overview
Reverse image queries are computationally expensive and subject to third-party rate limits. To minimize latency and upstream provider requests, `SearchCache` provides deterministic cryptographic caching with LRU (Least Recently Used) eviction and configurable TTL.

```
[Query Image Buffer]
        │
        ▼
[Compute SHA-256 Digest: key = 'search:' + hash]
        │
        ├─── Cache Hit (Valid TTL) ───► Return Cached Normalized Payload (cached: true)
        │
        └─── Cache Miss / Expired
                 │
                 ▼
        [Execute Visual Search Provider]
                 │
                 ▼
        [Normalize Results]
                 │
                 ▼
        [Store in LRU Map + Record Stats]
                 │
                 ▼
        [Return Search Response (cached: false)]
```

### 1.2 Cache Key Derivation
The cache key is computed deterministically from the raw input image bytes using SHA-256:
```typescript
const key = SearchCache.computeKey(imageBuffer); // e.g. "search:e3a5338722a056d5..."
```
If an explicit search provider override is passed (e.g. `google`, `bing`, `mock`), the provider name is appended as a secondary key component: `search:<hash>:<provider>`.

### 1.3 Eviction & Expiration Policy
- **Algorithm**: LRU (Least-Recently-Used) based on ES6 `Map` insertion and re-insertion ordering.
- **Capacity**: Configurable maximum entries (`maxSize`, default `100`).
- **TTL**: Configurable expiration per entry (`defaultTtlMs`, default 1 hour).
- **On-demand Bypass**: Query parameter `?bypassCache=true` or HTTP header `X-Bypass-Cache: true` forces a fresh provider lookup.

---

## 2. Real-Time Pipeline Event Bus

### 2.1 Event Lifecycle
The `PipelineEventEmitter` provides pub/sub progress telemetry across all six verification stages:

| Event | Status | Payload Attributes |
| :--- | :--- | :--- |
| `stage:start` | `PROCESSING` | `pipelineId`, `stage`, `progressPercent: 0`, `timestamp` |
| `stage:progress`| `PROCESSING` | `pipelineId`, `stage`, `progressPercent`, `message` |
| `stage:complete`| `COMPLETED` | `pipelineId`, `stage`, `progressPercent: 100`, `durationMs` |
| `stage:error` | `FAILED` | `pipelineId`, `stage`, `message`, `durationMs` |
| `pipeline:complete`| Final Status | `pipelineId`, `status`, `totalMs`, `timestamp` |

### 2.2 Replay History
Bounded per-pipeline event histories (default 50 events) are maintained in memory to allow WebSocket reconnects or post-execution diagnostic audit trails.

---

## 3. Decentralized IPFS Storage

### 3.1 Content Addressing with CIDv1
Evidence packages are transformed into canonical JSON (RFC 8785 sorting) and pinned to decentralized storage with deterministic Content Identifiers (CIDv1):

```typescript
const pinResult = await ipfsService.pinEvidence(evidencePackage);
// pinResult.cid => "bafkrei5857e3f236ab48bbb4c45b2744463fad5e8b652dc2ae70f062f2"
// pinResult.gatewayUrl => "https://ipfs.io/ipfs/bafkrei..."
```

### 3.2 Tamper Verification via CID
Because the CID is derived directly from the content's cryptographic multihash, any alteration of the evidence package (even a single bit change) generates a different CID:
```typescript
const isAuthentic = ipfsService.verifyCid(evidencePackage, claimedCid);
// Returns true only if the package exactly matches the stored CID
```

---

## 4. Benchmark & Metrics Snapshot

| Metric | Target / Benchmark | Measurement Unit |
| :--- | :--- | :--- |
| **Search Cache Latency** | `< 2ms` on hit | Response Time |
| **Search Hit Ratio** | Tracked via `getStats().hitRatio` | Float `0.0 - 1.0` |
| **CIDv1 Derivation** | `< 1ms` | Computation Time |
| **Pipeline Event Emission** | `< 0.5ms` per event | Non-blocking callback |
