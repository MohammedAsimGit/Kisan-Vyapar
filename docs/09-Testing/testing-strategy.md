# Kisan Vyapar — Testing Strategy

## Status

Sprint 1 added **Vitest** (node environment). Currently **8 files / 44 unit tests**
pass locally via `npm run test`. There are no live-database or browser e2e tests
yet (see notes below). Anything that later claims coverage must point at real
tests, not this document.

## Implemented coverage (Sprint 1)

| Area | What is tested |
| --- | --- |
| Auth schemas | register schema (weak password, bad phone, admin role blocked, invalid email, missing name), login schema |
| Password hashing | bcrypt hash/verify, incorrect password, salt uniqueness, plaintext never stored |
| Session tokens | random tokens, deterministic sha-256 hashing, safe comparison |
| Page guards / authorization | unauth redirect to login, role allowed, role blocked + redirected to own dashboard |
| User model validation | required/enum/phone/email rules and `passwordHash select:false` via local `validate()` (no DB) |
| Profiles | completeness rules (farmer/vendor), DTO mapping + empty-string normalization |
| Shared validation | role enum, object id, `parseOrThrow` → `ValidationError` |

## Tooling

- Unit/integration: **Vitest** (`npm run test`, `vitest run`).
- Config: `vitest.config.mts` — aliases `@` to `src` and stubs `server-only`
  (`tests/helpers/server-only-stub.ts`) so plain-Node tests can import modules.
- `mongodb-memory-server` was **evaluated and not installed**: no MongoDB binary /
  connection is available in this environment, and the existing unit suite does not
  require a live server. Revisit when live-DB integration tests are added.
- Component/E2E tooling (React Testing Library, Playwright) is **not installed**;
  it belongs to the sprint that adds the first full-journey browser tests.

## Verification commands

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run test        # Vitest (44 tests)
npm run build       # production build + type pass
```

## Target test pyramid (future)

### Unit
- Zod validation, password/token utilities, profile completeness, calculations,
  response/error helpers.

### Integration (needs a database)
- Real auth flows against MongoDB (`mongodb-memory-server` or a dev URI):
  registration uniqueness, session create/resolve/expire/revoke, profile upsert.
- API route handlers (request → validation → service → response).

### End-to-end (future)
- Farmer journey: register → role → profile → dashboard → refresh → logout →
  protected route blocked.
- Vendor journey: same shape.
- Invalid auth: wrong password, unknown account, invalid/weak inputs, duplicates.

## Known gaps (honest)

- **No live-MongoDB test run** (no connection available) — session expiry via TTL,
  unique constraints, and actual upserts are unverified at runtime.
- **No browser-level responsive/accessibility automation** yet; Sprint 1 UI was
  built mobile-first and manually reviewed across widths, but automated visual
  regression is future work.
