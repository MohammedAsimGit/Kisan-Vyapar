# Kisan Vyapar — Requirements Overview

Every requirement below is tagged with its status. This file is a living document;
statuses change as sprints land.

**Status legend**

- **Implemented** — works in this repository today.
- **Planned** — specified and designed, to be built in a later sprint.
- **Future** — directionally desired; details not yet designed.

## Product principles (all sprints)

1. **Premium on the outside, extremely simple on the inside.**
2. Mobile-first; usable by people with limited digital literacy.
3. Big touch targets, clear icons, simple language, minimal typing.
4. The platform shows **net earning potential**, not just headline price.
5. Both sides of the marketplace are first-class: farmers and vendors.
6. Trust is earned through reliable orders, payments, and ratings.

## Sprint 0 — Foundation (status: Implemented)

See `docs/03-System-Architecture` for the Sprint 0 record. Sprint 0 delivered the
Next.js/React/TypeScript/Tailwind foundation, MongoDB + Mongoose data layer,
centralized configuration and validation, error taxonomy, API utilities,
external-service boundaries, and the documentation set.

## Sprint 1 — Authentication + roles + profiles + dashboards (status: Implemented)

| Requirement | Status |
| --- | --- |
| User registration (name, phone, optional email, password, role) | Implemented |
| Farmer / Vendor role selection during registration | Implemented |
| Password hashing (bcrypt, never stored or returned in plaintext) | Implemented |
| DB-backed session sign-in (HttpOnly cookie, server-side validation, expiry) | Implemented |
| Logout (server-side session revoke + cookie clear) | Implemented |
| Session persistence + current-user retrieval | Implemented |
| Role-based route protection (farmer / vendor / admin) server-enforced | Implemented |
| Farmer profile creation + completion flow | Implemented |
| Vendor profile creation + completion flow | Implemented |
| Farmer, Vendor, and Admin dashboard shells with honest empty states | Implemented |
| Reusable UI kit (button, input, card, alert, badge, empty state, …) | Implemented |
| Responsive behavior across phone → tablet → desktop → large screens | Implemented (see testing) |
| Vitest unit tests for validation/password/tokens/guards/models/profiles | Implemented (44 tests) |
| Documentation updates for auth, sessions, authorization, profiles, API, testing | Implemented |

### Definition of "account flows that work end-to-end"

- Farmer: register → choose Farmer → create farmer profile → farmer dashboard.
- Vendor: register → choose Vendor → create vendor profile → vendor dashboard.
- Returning user: sign in → session restored → role detected → correct dashboard
  (or profile completion if the profile is missing).
- Admin: role exists in the auth system and `/admin` is protected; admin accounts
  are provisioned directly in the database (no public self-serve admin signup).

## User roles (vocabulary + enforcement Implemented)

- **Farmer** — `/farmer/*` (profile + dashboard implemented).
- **Vendor** — `/vendor/*` (profile + dashboard implemented).
- **Admin** — `/admin/*` (protected foundation; admin tooling later).

Role identifiers live in `src/constants/roles.ts`; authorization is enforced in
server layouts and API guards, never only by hiding navigation.

## Sprint 2 — Farmer crop discovery & produce entry (status: Implemented)

| Requirement | Status |
| --- | --- |
| Centralized crop catalogue (ids, names, categories, popular set, varieties) | Implemented |
| Quality grade vocabulary (A/B/C + "not sure") | Implemented |
| Visual crop selection with search + "view all" categories | Implemented |
| Multi-step entry: Crop → Details → Review → Save | Implemented |
| Quantity + unit (kg/quintal/tonne), quality, optional variety | Implemented |
| Location reused from farmer profile (listing copy, profile untouched) | Implemented |
| Expected harvest date + "already harvested" | Implemented |
| No asking price collected in Sprint 2 (price stays unset) | Implemented |
| `ProduceListing` model: crop id, quality enum, optional price, harvest date | Implemented |
| Produce APIs (list/create/get/patch/delete) + ownership enforcement | Implemented |
| My Produce list, detail, edit, deactivate/reactivate, delete | Implemented |
| Farmer dashboard shows real produce data from MongoDB | Implemented |
| Ownership: listing operations scoped to the authenticated farmer's profile | Implemented |
| Tests for crop catalogue, produce validation, DTO mapping | Implemented (72 tests total) |

**Deferred to next sprints:** asking price, market-price intelligence, trend,
recommended price, net realization, buyer discovery.

## Sprint 3 — Market price intelligence (status: Implemented — source unverified)

| Requirement | Status |
| --- | --- |
| Market data provider boundary + env config (`MARKET_DATA_*`) | Implemented (disabled until verified/configured) |
| External record validation + normalization (no silent fixes) | Implemented |
| `MarketPrice` model: crop, commodity, grade, source, fetchedAt, recordKey | Implemented |
| Duplicate prevention (deterministic recordKey) + history by arrival date | Implemented |
| Centralized crop → commodity mapping | Implemented (needs validation vs official data) |
| Cache strategy + freshness/stale/unavailable states | Implemented (6 h TTL) |
| `GET /api/market/prices` with Zod-validated filters | Implemented |
| Produce-scoped prices endpoint (ownership enforced) | Implemented |
| Farmer market-price page + states (fresh/stale/empty/unconfigured) | Implemented |
| Official source verification (endpoint/fields/rates) | **NOT VERIFIED** — provider is data.gov.in (mandi dataset); no key/resource configured locally, so no real response captured |
| Manual real-data verification | **NOT VERIFIED** — Atlas unreachable at verification time |

**Deferred to Sprint 4:** price recommendation, trend prediction, "best market".

## Farmer journey

- **Implemented:** register, role select, farmer profile, dashboard, add/list/
  edit/deactivate/delete produce (visual crop entry).
- **Planned:** market context & asking price, buyer discovery/matches,
  negotiation, orders.

## Vendor journey

- **Implemented:** register, role select, vendor profile, vendor dashboard shell.
- **Planned:** buying requirements, farmer discovery/matches, negotiation, orders.

## Market price architecture

- **Implemented:** provider/client boundary, validation + normalization, cache +
  Mongo persistence (history-safe), crop mapping, price API, farmer UI.
- **Planned/blocked:** live data.gov.in resource verified + enabled (requires a
  valid API key and the Resource ID of the mandi price dataset).
- **No fake prices exist; no provider field mapping is guessed.**

## Smart matching & net realization (Planned)

Matching factors and the net-realization concept are designed (see
`docs/07-Algorithms`). No fabricated scores, prices, or costs exist.

## Trust, payments, logistics, AI (Future)

Ratings/reviews, payments, live logistics, voice, and AI advisory remain future
work behind the `src/services/*` boundaries.

## Non-functional requirements

- Server-side Zod validation at every application boundary.
- Password hashing with bcrypt; password hashes are `select: false`.
- Sessions: random opaque tokens stored hashed (sha-256) in MongoDB; HttpOnly,
  SameSite=Lax cookie; expiry (30 days) enforced server-side; logout revokes.
- Role-based authorization server-side.
- No secrets in source, logs, or client bundles.
- Safe error responses (no stack traces to users).
- Rate limiting on auth endpoints: **deferred** (documented requirement, no extra
  infrastructure installed in Sprint 1).
