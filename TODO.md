# Project Roadmap & Completed Milestones

## Completed Tasks

- [x] **Add integration tests**
  - Live and mock endpoint integration tests for `/api/health`, `/api/health/deep`, and `/api/health/ready`.
  - Comprehensive unit test suites for utilities, middleware (`requestId`, `validateRequest`, `requestTimeout`), and validators.
  - Granular `npm run test:unit` and `npm run test:integration` test runners.
- [x] **Set up CI/CD pipeline**
  - GitHub Actions workflow (`.github/workflows/ci.yml`) validating backend test suite, frontend compilation, and Python AI service testing.
- [x] **Improve error handling**
  - Domain-specific error hierarchies (`AppError`, `ValidationError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`).
  - Blockchain-specific errors (`BlockchainWalletError`, `BlockchainFundsError`, `BlockchainTransactionError`).
  - Standardized JSON error envelope with timestamp, error code, and HTTP status codes.

## Upcoming Roadmap

- [ ] Add Redis caching layer for reverse image search results
- [ ] Implement WebSocket real-time progress updates for pipeline stages
- [ ] Support IPFS decentralized storage for persistent evidence package retention
