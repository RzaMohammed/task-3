# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Backend Infrastructure & Reliability**:
  - Memory usage metrics (RSS, heapUsed, heapTotal) and runtime platform metadata added to `GET /api/health/deep`.
  - Standardized HTTP status codes (e.g. `REQUEST_TIMEOUT`, `CONFLICT`, `TOO_MANY_REQUESTS`, `SERVICE_UNAVAILABLE`) in `backend/constants/httpStatus.js`.
  - Comprehensive application error code definitions in `backend/constants/errorCodes.js`.
  - Input validation utilities: `truncateString`, `isNonEmptyArray`, and object key sanitizer `sanitizeObject`.
  - In-memory deterministic LRU search cache (`SearchCache`) with configurable TTL and hit ratio tracking in `backend/src/services/search/search.cache.ts`.
  - Integration of caching layer into `SearchService.searchByImage` and `SearchController` with `bypassCache` option.
  - Event-driven stage telemetry bus (`PipelineEventEmitter`) with bounded event history in `backend/src/services/pipeline/pipeline.events.ts`.
  - Decentralized IPFS storage client (`IpfsService`) with deterministic CIDv1 generation and tamper verification in `backend/src/services/storage/ipfs.service.ts`.
  - Sliding-window rate limiter middleware (`SlidingWindowRateLimiter`) with dual-window burst protection, retry headers, and whitelist support in `backend/src/middleware/rate-limiter.ts`.
  - Real-time Server-Sent Events (SSE) stream endpoint `GET /api/stream/pipeline/:pipelineId` in `backend/src/controllers/stream.controller.ts` and `backend/src/routes/stream.routes.ts`.
  - Cryptographic Merkle tree verification engine (`MerkleTree`) with domain separation (`0x00`/`0x01`), balanced binary trees, and selective inclusion proofs in `backend/src/services/verification/merkle.service.ts`.
  - Evidence audit bundle exporter and integrity verifier (`EvidenceBundleService`) in `backend/src/services/hashing/evidence-bundle.service.ts`.
  - REST endpoints for audit bundle export (`POST /api/evidence/bundle/export`) and integrity verification (`POST /api/evidence/bundle/verify`) in `EvidenceController` and `evidence.routes.ts`.
  - Cryptographic Merkle inclusion proof verification endpoint (`POST /api/verification/merkle`) in `VerificationController` and `verification.routes.ts`.
  - Distributed cache storage subsystem (`ICacheStore`, `MemoryCacheStore`, `DistributedCacheService`) with Redis / Redis Cluster configuration and resilient memory fallback in `backend/src/services/cache/`.
  - Solana network cluster definitions and explorer URL builders (`CLUSTERS`, `buildExplorerUrl`) in `backend/constants/networks.js`.
  - SSRF guard and URL validation engine (`isSafeUrl`, `assertSafeUrl`) blocking loopback, private subnets, and cloud metadata in `backend/src/utils/urlValidator.ts`.
  - Security response headers middleware (`securityHeaders`) enforcing HSTS, X-Content-Type-Options, and X-Frame-Options in `backend/middleware/securityHeaders.js`.
  - Cryptographic nonce, salt, constant-time compare, and HMAC-SHA256 signature helpers in `backend/src/utils/cryptoUtils.ts`.
  - Base58 and Base64 encoding/decoding and validation utilities in `backend/src/utils/encodingUtils.ts`.
  - Resilient RPC exponential backoff retry utility with jitter (`retryWithBackoff`) in `backend/src/utils/retryUtils.ts`.
  - In-memory metrics collector (`MetricsCollector`) with p50/p90/p99 latency quantiles in `backend/src/utils/metricsCollector.ts`.
  - Prometheus plain-text and structured JSON metrics endpoints (`GET /metrics`, `GET /api/metrics`, `GET /api/metrics/json`) in `backend/src/routes/metrics.routes.ts`.
  - Automated environment verification CLI (`scripts/check-env.js` / `npm run env:check`).
  - Mock canonical JSON evidence generator with CLI flags (`scripts/generate-mock-evidence.js` / `npm run mock:evidence`).
  - Comprehensive architectural documentation in `docs/SECURITY_AND_METRICS.md`.
- **AI Service**:
  - Execution latency measurement ASGI middleware attaching `X-Process-Time` HTTP header to all responses.
  - Test coverage for `X-Process-Time` latency header verification in `test_face_api.py`.
- **Frontend Architecture**:
  - TypeScript definitions for visual search items, similarity matches, and provider responses in `frontend/src/types/search.ts`.
  - Centralized barrel re-export for search types in `frontend/src/types/index.ts`.
  - API client methods `searchFaces` and `getEvidenceById` in `frontend/src/services/api.ts`.
  - Formatter utilities (`formatBytes`, `formatPercentage`, `truncateHash`, `formatDuration`) in `frontend/src/utils/formatters.ts`.
  - React hook `usePipelineStream` in `frontend/src/hooks/usePipelineStream.ts` for real-time Server-Sent Events lifecycle and stage progress tracking.
  - API client methods `getPipelineStreamUrl`, `exportEvidenceBundle`, `verifyEvidenceBundle`, and `verifyMerkleProof` in `frontend/src/services/api.ts`.
  - Streaming event, Merkle proof, and audit bundle type definitions in `frontend/src/types/pipeline.ts`.
- **Developer Tooling & Scripts**:
  - Safe cache cleanup utility (`scripts/clear-cache.js`) supporting `--dry-run` and `--force` flags.
  - Performance benchmark tool (`scripts/benchmark-hashing.js`) measuring canonicalization and SHA-256 throughput.
  - Offline evidence audit bundle verification CLI tool (`scripts/verify-bundle.js`).
  - NPM convenience scripts `cache:clean`, `bench:hashing`, and `verify:bundle` in root `package.json`.
- **Testing & Quality Assurance**:
  - System metrics validation assertions in deep health check integration test (`tests/api.test.ts`).
  - Unit tests for `truncateString`, `isNonEmptyArray`, and `sanitizeObject` in `tests/unit/validators.test.js`.
  - Unit test suite for frontend formatters in `tests/unit/formatters.test.ts`.
  - Unit test suite for `SearchCache` covering TTL, LRU eviction, and hit ratios in `tests/unit/searchCache.test.ts`.
  - Unit test suite for `PipelineEventEmitter` stage telemetry in `tests/unit/pipelineEvents.test.ts`.
  - Unit test suite for `IpfsService` CID generation and tamper verification in `tests/unit/ipfsStorage.test.ts`.
  - Unit test suite for `SlidingWindowRateLimiter` covering tokens, bursts, and resets in `tests/unit/rateLimiter.test.ts`.
  - Unit test suite for `MerkleTree` covering roots, sibling proofs, and selective disclosure in `tests/unit/merkle.test.ts`.
  - Unit test suite for `EvidenceBundleService` covering bundle integrity and tamper detection in `tests/unit/evidenceBundle.test.ts`.
  - Integration test suite for real-time SSE streaming in `tests/stream.test.ts`.
  - API test suite for audit bundle export, bundle verification, and Merkle proofs in `tests/bundle-verification-api.test.ts`.
  - Unit test suite for distributed cache store and in-memory fallback in `tests/unit/distributedCache.test.ts`.
- **Documentation**:
  - Enhanced Solana verification guide (`docs/solana-verification.md`) with SPL Memo v2 program ID, fee estimates, and CLI queries.
  - Comprehensive production environment variables matrix and secret management guide in `docs/ENV_REFERENCE.md`.
  - Comprehensive architecture design guide for search caching and IPFS evidence persistence in `docs/SEARCH_CACHE_AND_IPFS.md`.
  - Comprehensive architecture design guide for real-time streaming and Merkle audit trees in `docs/STREAMING_AND_MERKLE_AUDIT.md`.
  - Updated milestone tracker and roadmap in `TODO.md`.


---

## [1.0.0] - 2026-09-07

### Added
- **Face Analysis Engine**: Integration with InsightFace Buffalo_L for 512-dimensional facial embedding generation, landmark detection, and bounding box localization.
- **Visual Web Search**: Multi-provider reverse image search (SerpAPI, Bing Visual Search) with SSRF protection and rate limiting.
- **Biometric Matching**: Normalized cosine similarity matching with configurable threshold ($\ge 0.85$).
- **Evidence Fingerprinting**: RFC 8785 canonical JSON serialization with deterministic SHA-256 fingerprint generation.
- **Solana Devnet Anchoring**: On-chain evidence anchoring via the SPL Memo Program v2 with automated retries and transaction signature verification.
- **Cryptographic Verification**: End-to-end tamper detection comparing on-chain stored hashes against re-computed evidence payloads.
- **Goa Hacker House Dashboard**: Responsive dark mode React UI with live camera/file upload, progress tracking, and interactive tamper simulation sandbox.
- **Developer Experience**:
  - Unified root workspace scripts in `package.json`.
  - GitHub Actions CI workflow for testing and build verification.
  - Cross-platform Node.js health check script (`scripts/healthcheck.js`).
  - Mock evidence payload generator (`scripts/generate-mock-evidence.js`).
  - Comprehensive documentation covering architecture flows, Solana verification, and troubleshooting.

### Security
- Magic bytes buffer inspection for uploaded images (JPEG, PNG, WebP).
- Helmet HTTP security headers and CORS origin restrictions.
- Strict SSRF guards preventing candidate image fetches from private/internal network ranges.

---

## [Roadmap]
- [ ] IPFS / Arweave decentralized storage integration for high-resolution evidence images.
- [ ] Zero-Knowledge Proof (zk-SNARKs) privacy layer for zero-knowledge biometric verification.
- [ ] Batch processing API for multi-face group photo forensics.
