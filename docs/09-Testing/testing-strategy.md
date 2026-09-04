# Kisan Vyapar — Testing Strategy

## Status

Vitest (node environment) runs the unit suite: **12 files / 72 tests** pass locally
via `npm run test`. Sprint 1 also ran a **manual live-DB verification** against a
development MongoDB (auth + profiles). There are no browser e2e tests yet.
Anything that later claims coverage must point at real tests, not this document.

## Implemented coverage

| Area | What is tested |
| --- | --- |
| Auth schemas | register schema (weak password, bad phone, admin role blocked, invalid email, missing name), login schema |
| Password hashing | bcrypt hash/verify, incorrect password, salt uniqueness, plaintext never stored |
| Session tokens | random tokens, deterministic sha-256 hashing, safe comparison |
| Page guards / authorization | unauth redirect to login, role allowed, role blocked + redirected to own dashboard |
| Phone login variants | `+91…`/`91…`/`0…`/national/space formats resolve to the same account |
| User model validation | required/enum/phone/email rules and `passwordHash select:false` via local `validate()` (no DB) |
| Profiles | completeness rules (farmer/vendor), DTO mapping + empty-string normalization |
| Shared validation | role enum, object id, `parseOrThrow` → `ValidationError` |
| Crop catalogue | supported ids, unique ids, popular set, varieties |
| Produce validation | supported/unsupported/missing crop, quantity (zero/negative/non-numeric), unit, quality, dates, partial updates + status transitions |
| Produce DTO | date-only formatting, location text, full mapping, unknown-crop fallback |

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
npm run test        # Vitest (72 tests)
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

- **No automated database integration tests yet**, and Sprint 2's planned live
  produce CRUD/ownership run **was NOT executed** — the configured MongoDB Atlas
  cluster was unreachable from this network (IP whitelist) during verification.
  Sprint 1's live verification (registration, sessions, profiles, logout, login)
  is still valid. Produce create/list/update/status/delete + cross-farmer and
  vendor rejection need a live run once the database is reachable.
- **No browser-level responsive/accessibility automation** yet; UI is built
  mobile-first and manually reviewed, but automated visual regression is future
  work.
