# Kisan Vyapar — Negotiation & Offers (Sprint 6)

## What this builds

Sprint 5 matched **published supply** (farmer produce) with **posted demand**
(active buying requirements) and produced a deterministic, explainable score.
Sprint 6 turns a match into a real transaction negotiation:

```text
MATCH → OFFER → COUNTEROFFER → ACCEPT / REJECT → AGREEMENT → (Sprint 7) ORDER
```

Every negotiation references **real farmer produce** and a **real buying
requirement**. There is no generic "chat" and no way to negotiate without those
two anchors.

## Offer domain

One `Offer` document is **one negotiation thread** between one farmer and one
vendor about one produce listing and one buying requirement.

| Field | Meaning |
| --- | --- |
| `produceListing` | the published produce listing (supply anchor) |
| `requirement` | the active buying requirement (demand anchor) |
| `farmer` / `vendor` | profile refs; the farmer owns the listing, the vendor owns the requirement |
| `quantity` / `unit` | the **latest proposed** quantity; unit is always the listing's unit |
| `pricePerUnit` | the latest proposed price per unit |
| `totalAmount` | **server-computed** `quantity × pricePerUnit` (rounded to 2 decimals) — never trusted from the client |
| `status` | controlled lifecycle (below) |
| `history` | immutable, append-only negotiation record |

## Status lifecycle

```text
PENDING (farmer's proposal awaits buyer)
  ├─ buyer accepts  → ACCEPTED
  ├─ buyer rejects  → REJECTED
  ├─ buyer counters → COUNTERED
  └─ farmer withdraws own proposal → WITHDRAWN

COUNTERED (buyer's counter awaits farmer)
  ├─ farmer accepts  → ACCEPTED
  ├─ farmer rejects  → REJECTED
  ├─ farmer counters → PENDING
  └─ buyer withdraws own counter → WITHDRAWN

ACCEPTED / REJECTED / WITHDRAWN are terminal — no further actions.
```

Rules enforced **server-side** by a single centralized transition function
(`canActOnOffer` in `src/features/offers/offer-service.ts`):

- **Accept / Reject / Counter** are only available to the party whose response
  is awaited (`PENDING` → vendor, `COUNTERED` → farmer).
- **Withdraw** is only available to the party who made the **latest proposal**
  (you withdraw your own pending offer/counter — never the other side's).
- Terminal states can never be reopened; the frontend simply never offers
  actions the API will reject anyway.

## Immutable history

Every proposal and decision appends an event to `history`:

```text
{ party: "farmer"|"vendor", action: "offer"|"counter"|"accept"|"reject"|"withdraw",
  quantity, unit, pricePerUnit, totalAmount, note?, at }
```

Events are **never edited or deleted** — the final agreed terms are always
traceable step by step (e.g. ₹2,750 → ₹2,680 → ₹2,720 → accepted ₹2,720).
The `quantity`/`pricePerUnit` on the document mirror the latest history entry.

## Ownership & identity

- Identity always comes from the authenticated session — never from the
  request body.
- A farmer only ever sees/acts on offers where `farmer = their profile`.
- A vendor only ever sees/acts on offers where `vendor = their profile`.
- Someone else's negotiation reads as `404` (no existence leak).
- Route guards reuse the Sprint 5 `requireFarmerProfileId` /
  `requireVendorProfileId` helpers.

## Offer creation rules

Before an offer is created the service verifies, in order:

1. The farmer owns the produce listing.
2. The listing exists and is **published** (`status: "active"`).
3. The requirement exists and is **active** (not paused/fulfilled/expired/
   cancelled) and its `requiredBy` has not passed.
4. **Crop matches**: a tomato listing cannot be offered against an onion
   requirement (strict catalogue-id comparison, no fuzzy guessing).
5. **Quantity is admissible** (both ceilings enforced server-side):
   - `offer.quantity ≤ listing available` (same unit), where available =
     `listing.quantity − listing.committedQuantity`. A listing's
     `committedQuantity` is the supply already locked by **accepted**
     agreements, so a listing that is fully committed (available = 0) can no
     longer receive offers. This stops the same produce from being
     double-counted across separate negotiations.
   - `offer.quantity ≤ requirement remaining` (units normalized via the same
     quintal conversion the matching engine uses). Partial supply is
     supported — offering 20 of a 50-QTL need is fine.
6. **Price > 0**. The price is **not** forced inside the buyer's target range —
   a farmer may intentionally ask ₹2,900 against a ₹2,600–₹2,800 range and let
   the buyer accept or counter. The UI shows an informational note instead of
   blocking.
7. **No duplicate live thread**: only one `PENDING`/`COUNTERED` offer per
   (farmer, listing, requirement). A unique **partial index** on
   `(produceListing, requirement, farmer)` where `status ∈ [pending, countered]`
   is the hard backstop against double-clicks/retries; a friendlier pre-check
   runs first. Once a thread is terminal, a fresh offer can start (e.g. partial
   fulfilment with remaining demand).

## Remaining requirement quantity

Requirements now carry `allocatedQuantity` (default 0) and expose
`remainingQuantity = quantity − allocatedQuantity`.

- Only **accepted** offers consume quantity. Sending offers never fulfils a
  requirement.
- When an acceptance brings `allocatedQuantity` to the full `quantity`, the
  requirement atomically becomes **`fulfilled`** and stops matching/accepting.
- Editing a requirement cannot reduce its quantity below the amount already
  committed.

## Concurrency (double-acceptance protection)

Two offers for the same remaining quantity must not both succeed:

```text
Requirement: 50 QTL, 30 remaining
Offer A: 30 QTL   Offer B: 30 QTL   → both try to accept simultaneously
```

Acceptance runs as a short sequence with an atomic resource gate on **both**
the demand and supply side:

1. **Reserve on the requirement** with a single atomic conditional update:
   `{ status: active, $expr: allocatedQuantity + offered ≤ quantity }` →
   `$inc allocatedQuantity`. MongoDB serializes this update, so only one of the
   two acceptances of the same remaining demand can match; the loser gets a
   `409 ConflictError` and nothing is reserved. There is no way to reach a
   negative remaining quantity.
2. **Reserve on the produce listing** with the same conditional pattern:
   `{ $expr: committedQuantity + offered ≤ quantity }` →
   `$inc committedQuantity`. Two acceptances of the *same listing* against
   *different requirements* cannot both over-commit the supply — the loser
   reverts its requirement reservation and fails safely.
3. **Mark the offer accepted** (conditional on its current status), then
   auto-fulfil the requirement if fully committed. If an offer state changed in
   the tiny window between the steps, both reservations are reverted and the
   acceptance fails safely.

This needs no multi-document transactions, so it works on a single-node
MongoDB while remaining correct under concurrency.

## Expiration

Offers have **no expiry timestamp** in Sprint 6. Instead, negotiation is
gated by the anchors' real state: the requirement must be `active` with a
future `requiredBy` (expired requirements reject new offers/actions), and the
produce must still be published. This keeps the model honest without inventing
a separate expiry mechanism; it is documented rather than silently added.

## API

Farmer:

```text
POST  /api/farmer/offers                    create offer        → 201
GET   /api/farmer/offers                    list my negotiations → 200 (paginated)
GET   /api/farmer/offers/:id                my negotiation       → 200 / 404
POST  /api/farmer/offers/:id/counter        counter the buyer   → 200
POST  /api/farmer/offers/:id/accept         accept the counter  → 200
POST  /api/farmer/offers/:id/reject         reject the counter  → 200
POST  /api/farmer/offers/:id/withdraw       withdraw my proposal → 200
```

Vendor:

```text
GET   /api/vendor/offers                     list offers on my requirements → 200 (paginated, optional ?requirementId=)
GET   /api/vendor/offers/:id                 my negotiation       → 200 / 404
POST  /api/vendor/offers/:id/counter         counter the farmer   → 200
POST  /api/vendor/offers/:id/accept          accept the offer     → 200
POST  /api/vendor/offers/:id/reject          reject the offer     → 200
POST  /api/vendor/offers/:id/withdraw        withdraw my counter  → 200
```

Create body: `{ produceId, requirementId, quantity, pricePerUnit, note? }`.
Counter body: `{ quantity?, pricePerUnit?, note? }` — at least one of
quantity/price must change. All inputs Zod-validated; the authoritative total
is always recomputed server-side.

## Honesty rules

- No demo offers, no demo negotiations, no invented terms — empty lists show
  honest empty states.
- The Sprint 5 match score shown on a negotiation is **informational** and is
  recomputed with the *same* engine and inputs, so it never differs from the
  match page. It is never recalculated "differently" mid-negotiation.
- A **match score is not a price promise**, and the suggested asking price is
  not a guaranteed selling price — same principle as Sprint 4/5.

## Sprint 7 boundary

Acceptance locks the final terms but creates **no order**. The UI shows an
"Agreement reached" panel (crop, quantity, agreed price, total, farmer, buyer,
requirement, produce) with a disabled "Continue to Order · Next update" action.
Sprint 7 will create orders directly from accepted offers.