# Contributing to ALPINEX

We welcome contributions from the community! To maintain architectural purity, stability, and code quality, please adhere to these standards.

## Engineering Standards

1. **Domain-Driven Design (DDD):**
   - Core domain business logic in `internal/core/domain` must have zero external dependencies.
   - All state transitions must adhere to domain aggregate invariants.
2. **Clean Architecture:**
   - Inward-pointing dependencies only: Presentation → Application → Domain ← Infrastructure.
3. **Test-Driven Development (TDD):**
   - Write tests first (`RED → GREEN → REFACTOR`).
   - Run unit tests with `make test`.
4. **SOLID Principles:**
   - Single responsibility per package and service.
   - Interfaces belong to the consuming package (driven ports).

## Pull Request Guidelines

- Branch naming: `feature/<epic-id>-<short-description>`, `fix/<issue-id>-<description>`.
- Commit messages: Follow [Conventional Commits](https://www.conventionalcommits.org/) (e.g. `feat(execution): add k6 subprocess runner`).
- Every PR touching domain logic must include unit tests.
