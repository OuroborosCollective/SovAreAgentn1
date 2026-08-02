# ADR 0001: Monorepo Structure and Domain Boundaries

## Status
Accepted

## Context
The current repository bundles the N+1 engine, Voice, OAuth, GitHub, Database, Diagnostics, Agents, Toolchain, Archives, Learning, and a large React UI within a monolithic `server.ts` and a single frontend. This tight coupling makes testing, security, and the future development of a lightweight Android mobile application difficult.

## Decision
We will transition to a monorepo structure with strict domain boundaries and dependency rules.

The target directory structure will be:
- `apps/backend`: Express-based API and server application.
- `apps/web-admin`: React-based web interface for administration, diagnostics, and development.
- `apps/mobile`: Future mobile application (React Native / Android).
- `packages/core`: Core N+1 logic and personality state machines, with NO dependencies on UI or external providers.
- `packages/contracts`: Shared TypeScript interfaces and DTOs.
- `packages/providers`: Implementations for external services (GitHub, LLMs, PostgreSQL, Memcached).

## Consequences
- **Positive:** Clear separation of concerns, smaller entry points (e.g., `server.ts`), enabling a lightweight mobile app, improved testability and security.
- **Negative:** Increased initial complexity in project setup and dependency management (Workspaces).
- **Migration:** We will extract domains incrementally, ensuring build, tests, and Docker remain functional after each step.
