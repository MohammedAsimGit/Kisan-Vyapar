# Kisan Vyapar — Testing Strategy

## Status

No automated tests are implemented in Sprint 0 (no test runner is configured).
This document defines the strategy future sprints execute against. Anything that
later claims test coverage must point at real tests, not this document.

## Target test pyramid

### Unit tests

- Zod validation schemas (valid/invalid inputs).
- Calculations: net realization, price/unit math, pagination.
- Matching scoring (deterministic, weighted cases) once implemented.
- Utility functions: error envelope mapping, config parsing, response helpers.

### Integration tests

- API route handlers (request → validation → service → response).
- Database operations against MongoDB (real or `mongodb-memory-server`):
  schema validation, indexes, references, enum behavior.
- Authentication/authorization once implemented.

### End-to-end tests

- Farmer journey: register → list produce → receive offers → sell.
- Vendor journey: register → post requirement → discover → buy.
- Offer/negotiation lifecycle.
- Order lifecycle through status transitions.
- Net-realization framing on opportunity screens.

## Tooling direction (not yet installed)

- Unit/integration: Vitest.
- Component/UI: React Testing Library.
- E2E: Playwright.
- DB in tests: `mongodb-memory-server` to avoid external credentials.

The choice is confirmed in the sprint that adds the first tests; no tooling is
installed speculatively today.

## What to test first (next sprint)

1. Error envelope + response helpers (pure functions, no IO).
2. Server environment validation (`src/config/env.ts`).
3. Mongoose schema registration and required/enum/unique behavior.
4. `/api/health` behavior in configured/unconfigured states.

## Verification commands (current)

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run build       # production build + type pass
```

These run in CI-equivalent checks today; a real CI pipeline is future work.
