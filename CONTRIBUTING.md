# Contributing Guidelines

Thank you for your interest in contributing to the **Face Recognition Blockchain Verification Pipeline**!

## Development Standards

### Commit Message Guidelines
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
- `feat:` Introduces a new feature or capability.
- `fix:` Patches a bug or resolves an issue.
- `docs:` Documentation-only modifications.
- `ui:` Visual adjustments, CSS changes, styling enhancements.
- `test:` Adding or updating unit/integration tests.
- `chore:` Routine tasks, dependencies, workspace configs.
- `ci:` Continuous integration workflow updates.

### Local Setup & Testing
1. Clone the repository and install dependencies in backend and frontend:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
2. Run backend tests to verify core modules:
   ```bash
   npm --prefix backend test
   ```
3. Build the frontend client:
   ```bash
   npm --prefix frontend run build
   ```

### Branching Model
- Feature branches: `feat/<feature-name>`
- Bugfixes: `fix/<issue-name>`
- Main branch: `main` (requires all tests and builds passing)

## Pull Request Checklist
- [ ] Code follows TypeScript best practices and passes typechecking.
- [ ] Unit tests are included for new features or bugfixes.
- [ ] Documentation is updated where applicable.
- [ ] All CI checks pass cleanly.
