# Project Roadmap & Completed Milestones

## Completed Tasks

- [x] **Add integration tests & unit test coverage**
  - Live and mock endpoint integration tests for `/api/health`, `/api/health/deep`, and `/api/health/ready`.
  - Comprehensive unit test suites for utilities, middleware (`requestId`, `validateRequest`, `requestTimeout`), and validators.
  - Unit test suite for frontend formatters (`formatBytes`, `formatPercentage`, `truncateHash`, `formatDuration`).
  - Automated Pytest coverage for AI service health, readiness, and `X-Process-Time` latency headers.
  - Granular `npm run test:unit` and `npm run test:integration` test runners.
- [x] **Set up CI/CD pipeline & developer tooling**
  - GitHub Actions workflow (`.github/workflows/ci.yml`) validating backend test suite, frontend compilation, and Python AI service testing.
  - Performance benchmark script (`scripts/benchmark-hashing.js`) verifying 150k+ ops/sec throughput for SHA-256 canonical hashing.
  - Automated cache cleanup utility (`scripts/clear-cache.js`) with `--dry-run` and `--force` support.
  - Offline evidence audit bundle verification CLI (`scripts/verify-bundle.js` / `npm run verify:bundle`).
- [x] **Improve error handling & system observability**
  - Domain-specific error hierarchies (`AppError`, `ValidationError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`).
  - Blockchain-specific errors (`BlockchainWalletError`, `BlockchainFundsError`, `BlockchainTransactionError`).
  - Standardized JSON error envelope with timestamp, error code, and HTTP status codes.
  - System memory and uptime metrics in `/api/health/deep`.
  - Centralized constants for HTTP status codes (`backend/constants/httpStatus.js`) and error codes (`backend/constants/errorCodes.js`).
- [x] **Visual search caching & event-driven pipeline architecture**
  - In-memory deterministic LRU search cache (`SearchCache`) with configurable TTL and hit ratio tracking.
  - Integration into `SearchService` and `SearchController` with `bypassCache` query param and `X-Bypass-Cache` header support.
  - Event-driven stage telemetry bus (`PipelineEventEmitter`) with bounded event history for real-time progress updates.
  - Decentralized IPFS evidence storage client (`IpfsService`) with deterministic CIDv1 generation and tamper verification.
  - Architectural documentation in `docs/SEARCH_CACHE_AND_IPFS.md`.
- [x] **Real-time telemetry streaming & cryptographic audit trees**
  - Burst-protected sliding-window rate limiter (`SlidingWindowRateLimiter`) with retry headers and whitelisting.
  - Real-time Server-Sent Events (SSE) telemetry bridge (`/api/stream/pipeline/:pipelineId`) connected to `PipelineEventEmitter` with replay and keepalives.
  - Cryptographic Merkle Tree verification service (`MerkleTree`) with domain separation (`0x00`/`0x01`) and selective inclusion proofs.
  - Evidence Audit Bundle exporter (`EvidenceBundleService`) encapsulating manifest checksums, on-chain anchors, and Merkle proofs.
  - Comprehensive architectural documentation in `docs/STREAMING_AND_MERKLE_AUDIT.md`.

## Upcoming Roadmap

- [ ] Support Redis cluster backend for distributed search caching & rate-limit synchronization
- [ ] Implement Circom / SnarkJS zk-SNARK circuit for private biometric embedding cosine distance verification
- [ ] Connect React frontend `usePipelineStream` hook directly to SSE streaming endpoint
- [ ] Decentralized relayer network for subsidized Solana evidence gas fees
