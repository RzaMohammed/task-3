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
- [x] **Improve error handling & system observability**
  - Domain-specific error hierarchies (`AppError`, `ValidationError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`).
  - Blockchain-specific errors (`BlockchainWalletError`, `BlockchainFundsError`, `BlockchainTransactionError`).
  - Standardized JSON error envelope with timestamp, error code, and HTTP status codes.
  - System memory and uptime metrics in `/api/health/deep`.
  - Centralized constants for HTTP status codes (`backend/constants/httpStatus.js`) and error codes (`backend/constants/errorCodes.js`).
- [x] **Visual search caching & event-driven pipeline architecture**
  - In-memory deterministic LRU search cache (`SearchCache`) with configurable TTL and hit ratio tracking.
  - Integration into `SearchService` and `SearchController` with `bypassCache` query param and `X-Bypass-Cache` header support.
  - Event-driven stage telemetry bus (`PipelineEventEmitter`) with bounded event history for real-time WebSocket progress updates.
  - Decentralized IPFS evidence storage client (`IpfsService`) with deterministic CIDv1 generation and tamper verification.
  - Architectural documentation in `docs/SEARCH_CACHE_AND_IPFS.md`.

## Upcoming Roadmap

- [ ] Support Redis cluster backend for distributed search caching
- [ ] Connect WebSocket server to `PipelineEventEmitter` for frontend streaming
- [ ] Implement rate-limit burst protection via sliding-window Redis counter
- [ ] Zero-Knowledge Proof (zk-SNARKs) privacy layer for biometric verification

