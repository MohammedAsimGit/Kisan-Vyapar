# Kisan Vyapar — Buyer Requirement Matching (Sprint 5)

This document describes the deterministic matching that connects **published
farmer supply** with **posted vendor demand** (buying requirements), how the
score is computed, why a match is the score it is, and the rules that keep the
system honest.

> ## Score ≠ price
> - **MATCH SCORE ≠ PRICE.** A 94% match is a compatibility score, never a
>   promised selling price.
> - **MARKET PRICE ≠ BUYER TARGET PRICE.** Government mandi prices inform a
>   *suggested asking price*; a buyer requirement carries its own target range.
> - **SUGGESTED ASKING PRICE ≠ GUARANTEED SELLING PRICE.** The farmer always
>   decides their final asking price.

## Where it sits

```text
REAL MARKET DATA ──► PRICE INTELLIGENCE ──► FARMER ASKING PRICE ──► PUBLISHED SUPPLY
                                                                          ↕
                                          DETERMINISTIC MATCHING ENGINE ↕
                                                                    POSTED BUYER DEMAND
                                                                          │
                                                      NEGOTIATION (Sprint 6) ─► ORDER
```

- **Supply** is a *published* produce listing: status `active` (farmers must
  explicitly **Publish Produce**; new listings start as `draft`), with an
  optional asking price and an expected harvest date.
- **Demand** is an *active* buying requirement (`active` status, `requiredBy`
  not in the past). Requirements are created active and have a controlled
  lifecycle (`active` / `paused` / `fulfilled` / `expired` / `cancelled`).

## Data flow

1. A vendor posts a requirement (`POST /api/vendor/requirements`) — it becomes
   `active` immediately.
2. A farmer adds produce and explicitly publishes it (`PATCH` listing →
   `status: "active"`).
3. Both sides ask for matches:
   - `GET /api/farmer/produce/:listingId/matches` — active requirements for one
     published listing.
   - `GET /api/vendor/requirements/:requirementId/matches` — published listings
     for one active requirement.
4. The database pre-filters the obvious mismatch dimensions first
   (`crop` exact match, `status` active, `requiredBy ≥ today` /
   `pricePerUnit` present where required), **then** the engine scores the
   reduced candidate set. No N+1 loops, no scoring of every record in memory.
5. Scores are computed deterministically, sorted (default: highest score) and
   paginated (`page`, `limit`, `total`).

## Scoring formula

Each factor produces a score between 0 and 100 — or **null** when the data
needed for it genuinely does not exist (see honesty rules below). The match
score is the weighted average over the factors that could actually be scored,
renormalised by the applicable weight:

```text
                Σ (factorScoreᵢ × weightᵢ)   for factors that were scored
matchScore = ─────────────────────────────────────────────── × 100
                      Σ weightᵢ             for factors that were scored
```

Rounding to an integer keeps scores explainable and deterministic. Because a
factor with missing data simply drops out, a match is never dragged down for
something we cannot see — and it is never credited either.

### Weights (centralised in `src/features/matching/config.ts`)

| Factor | Weight | Status |
| --- | --- | --- |
| Crop compatibility | 25% | active |
| Quality fit | 20% | active |
| Quantity fit | 15% | active |
| Price fit | 15% | active |
| Location / distance | 10% | active |
| Availability | 10% | active |
| Buyer reliability | 5% | **disabled** — no trustworthy history exists yet |

`MATCHING_WEIGHTS` totals 1.0 and is the only place weights live; the engine
reads from it, tests pin the total, and tuning is a one-file change.

## Per-factor rules (deterministic)

### Crop (strict)
Compatibility is exact: both sides must use the same canonical catalogue id
(`tomato` ↔ `tomato`). A different crop is a **hard veto** — the score is 0 and
the reasons say why. No fuzzy or LLM guessing.

### Quality
Uses the shared grade vocabulary (`a`/`b`/`c`/`ungraded`). Exact match scores
100; a higher offered grade than required scores 95/90; a lower offered grade
scores lower (50/40/25); *ungraded* produce is treated honestly (55–70, “quality
fit uncertain”). Rules live in `QUALITY_SCORE_MATRIX` in
`src/features/matching/config.ts`, never scattered in code.

### Quantity (partial supply is a real match)
Quantities and prices are normalised to **quintals** so `5000 kg` compares
correctly against `50 quintal`. The factor is `min(offered, required) /
required`:

- Full or excess supply → 100.
- 20 offered of 50 required → 40 — scored, not failed, and the reason says
  “Partial supply: the listing offers 20 of the 50 required.” Splitting one
  requirement across several farmers is future work (order workflows), not a
  reason to discard a real opportunity.

### Price
Compares the farmer's actual asking price (converted per quintal) with the
buyer's `targetPriceMin–targetPriceMax`:

- Inside the range → 100 (“fits inside the target range”).
- Below the minimum → 75 (“cheaper than expected” — interpretation left to the
  sides).
- Above the maximum → decays 200 points per multiple over max (`₹3,100` vs
  `₹2,800` ≈ 79 — a weaker but not failed match).
- No asking price set → price not scored (never penalised blindly).

The engine **never changes the farmer's price** and never calls a score a
guaranteed selling price.

### Location / distance
- Both sides with real coordinates → great-circle distance (haversine) in km,
  score decays linearly (100 at 0 km). `[0,0]` is rejected as a placeholder —
  it is never a farm.
- No coordinates but the same text region → honest region proximity only when
  both states match: same district + state = 100, same state = 85. The reason
  says “same district/state”, never “X km away”.
- Different states without coordinates → distance **not scored** (factor
  dropped) and the reason says so. Distance is never fabricated.

### Availability
Compares the listing's `expectedHarvestDate` with the requirement's
`requiredBy`:

- Ready 7+ days before → 100; 3–6 days → 95; 0–2 days → 85.
- Ready after the required date → 0 (incompatible) with an explicit reason.
- Missing dates → not scored.

### Buyer reliability
**Off.** There is no real transaction/fulfilment history yet, so a reliability
score would be invented. `RELIABILITY_SCORING_ENABLED = false` in config, the 5%
weight is reserved, and no UI ever shows a fabricated “98% reliable”.

## Explaining a match

Every match returns per-factor scores plus human-readable reasons with a tone
(`positive` / `limitation` / `neutral`) that pages render as ✓ / ⚠ / ℹ. Reasons
are generated from the actual comparison results — a partial quantity is shown
as a limitation, a price above range as a limitation, a same-state region as a
positive. There is no template that claims “Location is nearby” when no location
data exists.

## Filters, sorting, pagination

Validated query params (`filter`, `sort`, `page`, `limit`; max `limit` 50):

| Filter | Rule |
| --- | --- |
| `all` | everything |
| `strong` | score ≥ 75 |
| `price` / `quality` / `quantity` / `nearby` | that factor scored ≥ 75 |

| Sort | Rule |
| --- | --- |
| `score` (default) | highest match score first |
| `deadline` | soonest `requiredBy` first |
| `nearest` | best-scored location first |

Sorting by match score is deliberately distinct from market price or asking
price — different concepts, never conflated.

## Security & ownership

- Identity always comes from the authenticated session (`requireApiUser` +
  role/profile guards); `farmerId`/`vendorId` are never accepted from the body.
- A farmer can only see matches for their own published listings; a vendor only
  for their own active requirements. Someone else's record reads as `404`.
- Only a farmer can publish/withdraw produce; only a vendor can create, edit,
  pause, resume, fulfil or cancel their own requirement. Transitions are
  validated server-side (`nextStatusForAction`), never just hidden in the UI.
- Requirement fields are Zod-validated at the boundary (crop catalogue id,
  quality enum, positive quantity, `targetPriceMax ≥ targetPriceMin`,
  non-past `requiredBy`, district + state).
- Match DTOs expose only public data (business name, crop facts, prices) —
  never phone numbers, emails, hashes or internal fields.

## Indexes backing the hot queries

- `BuyerRequirement`: `(vendor, status, createdAt)`, `(crop, status)`,
  `(status, requiredBy)`, geo `2dsphere`.
- `ProduceListing`: `(farmer, status, createdAt)`, `(crop, status)`, geo
  `2dsphere`.

Matching queries first narrow by `crop + status (+ requiredBy ≥ today /
published)`, then fetch the vendor/farmer display names with batched `$in`
queries — never one query per row.

## Honesty rules

- No fake buyers, requirements, produce listings, scores, prices, distances,
  coordinates or reliability figures anywhere in this flow.
- Zero matches → an empty collection and an honest empty state
  (“No matching farmer produce yet” / “No matching buyer requirements yet”), not
  sample data.
- A requirement that is not `active` (paused/fulfilled/expired/cancelled) never
  appears in matching; unpublished/deactivated produce never appears either.
- The engine is pure and deterministic — the same inputs always produce the same
  score, which is what makes the whole feature auditable. No LLM is involved in
  scoring (AI advisors are a later sprint).

## Sprint 6 boundary

Matching is deliberately read-only. Farmer and vendor surfaces show a disabled
“Make Offer · Next update” action instead of a half-working negotiation. Sprint 6
builds offers/counter-offers on top of this demand layer (`Offer`/`Order`
models already exist and are documented in the database design).

## Source layout

- `src/features/matching/config.ts` — weights, thresholds, quality matrix,
  unit conversion, feature flags (the only tuning surface).
- `src/features/matching/engine.ts` — pure, deterministic scoring + reasons
  (unit-testable without a database).
- `src/features/matching/matching-service.ts` — DB pre-filtering, joins,
  filter/sort/pagination, DTO assembly.
- `src/features/buyer-requirements/` — requirement schemas, service and
  lifecycle rules.
