# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Backend Infrastructure & Reliability**:
  - ESLint configuration (`.eslintrc.json`) for backend TypeScript linting.
  - Graceful shutdown signal handling (SIGINT/SIGTERM) for clean HTTP connection draining.
  - Request timeout middleware (`requestTimeout.js`) to protect against long-running requests.
  - RFC 6585 compliant `X-RateLimit-*` and `Retry-After` headers in rate-limiting middleware.
  - Startup environment variable validation warnings for critical Solana, search, and port configurations.
  - Deep dependency health check (`/api/health/deep`) probing AI service and Solana RPC endpoints with latency metrics.
  - Enhanced logger with ISO timestamps, configurable log levels (`LOG_LEVEL`), and contextual child loggers.
  - Expanded social platform classifier with support for Bluesky, Mastodon, Snapchat, and Telegram.
  - Missing HTTP and domain error classes (`ForbiddenError`, `ConflictError`, `BlockchainWalletError`, `BlockchainFundsError`, `BlockchainTransactionError`).
  - Shared TypeScript interfaces for API envelopes, pagination, and service health checks.
  - Input validation helpers: `isValidUrl`, `isValidSHA256`, and `escapeHtml`.
- **AI Service**:
  - Model metadata (`model_name`) and application version reporting in `/health` endpoint.
- **Frontend**:
  - API client methods `checkHealth` and `checkDeepHealth` in `apiService`.
- **Docker & Deployment**:
  - Backend health check configuration in `docker-compose.yml` for automated dependency ordering.
- **Testing & Quality Assurance**:
  - Jest configuration updated to discover both TypeScript (`.test.ts`) and JavaScript (`.test.js`) suites.
  - Integration test suite for deep health check endpoint in `tests/api.test.ts`.
  - Comprehensive unit test suites for `isValidUrl`, `isValidSHA256`, and `escapeHtml` in `tests/unit/validators.test.js`.
  - Automated test coverage for AI service health metadata in `tests/test_face_api.py`.

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
