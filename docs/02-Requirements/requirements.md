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

| Requirement | Status |
| --- | --- |
| Next.js (App Router) + React + TypeScript (strict) application | Implemented |
| Tailwind CSS v4 styling foundation | Implemented |
| ESLint + typecheck + production build scripts | Implemented |
| Centralized configuration with server-side env validation (Zod) | Implemented |
| Server-only guards for secret-adjacent modules | Implemented |
| MongoDB connection utility (reused, dev hot-reload safe) | Implemented |
| Mongoose model foundation and registration pattern | Implemented |
| Centralized domain constants (roles, statuses, units, languages) | Implemented |
| Domain types (GeoPoint, addresses, location reference) | Implemented |
| Error taxonomy and safe HTTP error envelopes | Implemented |
| API foundation utilities (response helpers, error wrapper) | Implemented |
| `/api/health` route | Implemented |
| External service boundaries: Mandi, Maps, Logistics, AI, Matching, Realization | Implemented (interfaces/types only) |
| Documentation set (`docs/`) | Implemented |
| `.env.example`, `.gitignore`, README | Implemented |

## User roles (Planned — vocabulary implemented)

- **Farmer** — lists produce, discovers buyers, negotiates, sells.
- **Vendor** — posts buying requirements, discovers farmers, negotiates, procures.
- **Admin** — governs the marketplace, monitors integrity and trust.

Role identifiers are centralized in `src/constants/roles.ts`.

## Farmer journey (Planned)

1. Register / sign in (role = farmer).
2. Complete farmer profile (identity, location, language).
3. List produce: crop, variety, quality description, quantity + unit, expected price,
   images, location, availability.
4. See relevant market context and buying requirements.
5. Receive matched buyer opportunities.
6. Negotiate offers (accept / reject / counter — counter-offers Planned).
7. Convert to an order; track status through delivery.
8. Receive payment and rate the counterparty.

## Vendor journey (Planned)

1. Register / sign in (role = vendor).
2. Complete vendor profile (business name, type, location).
3. Post a buying requirement: crop, quantity, quality, max price, required-by date,
   pickup location.
4. Discover and shortlist farmers/listings.
5. Make offers on listings; negotiate (Planned).
6. Confirm orders; track procurement.
7. Pay and rate the counterparty.

## Market price architecture (Planned)

- Ingest market/mandi data from an external source behind a `MandiPriceProvider`
  boundary (`src/services/mandi`).
- Normalize provider responses into `MandiPriceRecord` (internal shape).
- Validate, store/cache, and serve to the application.
- **No government API is hardcoded or invented.** An adapter for a real,
  documented source is added in a later sprint once the source is confirmed.

## Smart matching & net realization (Planned)

- Matching considers crop compatibility, quality, quantity, price, distance,
  availability, buyer demand, reliability (weights centralized and tuned later —
  see `docs/07-Algorithms`).
- Net realization = expected selling value − transport cost − applicable costs.
- No fabricated prices, transport costs, or AI scoring exist in Sprint 0.

## Trust, payments, logistics, AI (Future)

- Ratings/reviews, escrow-style payments, live logistics tracking, voice input,
  and an AI advisor are future work. Service boundaries exist
  (`src/services/*`) so they can be added cleanly.

## Non-functional requirements

- Server-side input validation (Zod) at application boundaries.
- Role-based authorization foundation (implemented vocabulary; enforcement later).
- No secrets in source, logs, or client bundles.
- Safe error responses (no stack traces to users).
- Consistent commit/push workflow per completed step.
