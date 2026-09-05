# Kisan Vyapar — API Architecture

## Principles

- Route handlers live under `src/app/api/...` (App Router `route.ts` files).
- Handlers are thin: **receive → validate (Zod) → authorize → call a
  feature/service → respond**.
- Business logic lives in `src/features` / `src/services`.
- Consistent envelope: success `{ data }`, failure `{ error: { code, message, details? } }`.
- Client-facing messages are safe; stack traces/internal detail stay in logs.
- No fake endpoints return fake business data.

## Live endpoints (implemented)

### `POST /api/auth/register`

Registers a farmer/vendor, hashes the password (bcrypt), and signs the user in.

Request body (Zod validated):

```jsonc
{
  "fullName": "Ramesh Kumar",
  "phone": "9876543210",
  "email": "optional@example.com", // optional
  "password": "a-secret-passphrase-with-a-number-1",
  "role": "farmer" // "farmer" | "vendor"
}
```

Returns `201` and sets the session cookie. Duplicate accounts → `409`.

### `POST /api/auth/login`

Signs an existing user in by phone number or email + password. Returns `200`, sets
the session cookie. Unknown user / wrong password / inactive user → `401` with a
generic message (no account enumeration).

### `POST /api/auth/logout`

Revokes the session server-side and clears the cookie. Returns `200`.

### `GET /api/auth/session`

Returns the signed-in user or `null`:

```jsonc
{ "data": { "user": { "id": "...", "role": "farmer", "fullName": "...", "phone": "...", "language": "en" } } }
```

### `GET/PATCH /api/profile`

Role-scoped profile read/save for the signed-in user.

- `GET` → current farmer/vendor profile or `null`.
- `PATCH` → validates the role-specific profile schema and upserts the profile.

### `GET /api/health`

Service health (see Sprint 0 docs). Reports database configured/reachable without
leaking connection details.

### Farmer produce (Sprint 2)

All routes require a signed-in **farmer** whose profile exists; ownership is always
derived from the session — the client can never choose an owner. Operations on
another farmer's listing return `404` (no existence leak).

```text
POST   /api/farmer/produce          create listing            → 201
GET    /api/farmer/produce          list my listings          → 200
GET    /api/farmer/produce/:id      my listing detail         → 200 / 404
PATCH  /api/farmer/produce/:id      update fields/status      → 200 / 404
DELETE /api/farmer/produce/:id      delete my listing         → 200 / 404
```

`PATCH` accepts partial listing fields plus a `status` transition. Setting
`status: "active"` **publishes** the listing (Sprint 5 publish flow) and
`status: "withdrawn"` deactivates it. Vendors and other roles are rejected with
`403`.

Create payload (Zod validated; no price field in Sprint 2):

```jsonc
{
  "crop": "tomato",                 // supported catalogue id
  "variety": "Hybrid",              // optional
  "quantity": 20,
  "unit": "quintal",                // kg | quintal | tonne
  "quality": "a",                   // a | b | c | ungraded
  "location": {
    "address": { "village": "…", "district": "…", "state": "…", "pincode": "…" }
  },
  "expectedHarvestDate": "2026-09-20"
}
```

New listings are created as **`draft`** (Sprint 5): a listing only participates
in buyer matching after the farmer intentionally publishes it with
`PATCH … { "status": "active" }`. Asking prices are set through
`PATCH /api/farmer/produce/:id/asking-price` (Sprint 4).

### Buying requirements (Sprint 5)

Vendor-owned demand records. Identity always comes from the session; a vendor
can only create/read/update/transition **their own** requirements (someone
else's reads as `404`).

```text
POST   /api/vendor/requirements             post requirement (becomes active) → 201
GET    /api/vendor/requirements             list my requirements + status counts → 200
GET    /api/vendor/requirements/:id         my requirement detail → 200 / 404
PATCH  /api/vendor/requirements/:id         edit fields, or transition status → 200 / 404
```

`PATCH` is either a field edit (active/paused only) or a **status transition**:

| body `status` | transition | allowed from |
| --- | --- | --- |
| `paused` | pause | active |
| `active` | resume | paused |
| `fulfilled` | mark fulfilled | active |
| `cancelled` | cancel | active / paused |

Requirements are validated with Zod (supported crop, quality grade, quantity >
0, `targetPriceMax ≥ targetPriceMin`, non-past `requiredBy`, district + state).

### Matching (Sprint 5)

Deterministic, explainable matching between *published* produce and *active*
requirements (see [matching algorithm](../07-Algorithms/matching-guidance.md)).

```text
GET /api/farmer/produce/:listingId/matches      farmer: requirements for own published listing
GET /api/vendor/requirements/:requirementId/matches  vendor: published listings for own active requirement
```

Both enforce ownership and return the same shape:

```jsonc
{
  "data": {
    "listing": { "id": "…", "cropName": "Tomato", "quantity": 20, "askingPricePerUnit": 2750, "locationText": "…" },
    "matches": [
      {
        "requirement": { "id": "…", "vendor": { "businessName": "…" }, "cropName": "Tomato", "targetPriceMin": 2600, "targetPriceMax": 2800, "requiredBy": "2026-09-15" },
        "match": {
          "score": 94,
          "band": "strong",
          "factors": [ { "key": "price", "label": "Price", "score": 100, "detail": "…" } ],
          "reasons": [ { "tone": "positive", "text": "The asking price (₹2,750) fits inside the target range (₹2,600–₹2,800)." } ],
          "flags": { "strong": true, "priceCompatible": true, "qualityCompatible": true, "quantityCompatible": false, "nearby": true }
        }
      }
    ],
    "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1, "filter": "all", "sort": "score" }
  }
}
```

Query params (`filter` in `all | strong | price | quality | quantity | nearby`,
`sort` in `score | deadline | nearest`, `page` ≥ 1, `limit` 1–50) are
Zod-validated. Match DTOs expose only public data — never phone numbers, emails
or internal fields. An active-but-unmatched query returns `matches: []`, never
sample data.

### Market prices (Sprint 3)

```text
GET /api/market/prices                       → 200 (signed-in user)
GET /api/farmer/produce/:id/prices           → 200 (farmer, own listing only)
```

`GET /api/market/prices` filters (Zod validated): `crop` (supported id), `state`,
`district`, `market`, `from`/`to` (YYYY-MM-DD), `limit` (1–100, default 25).

`GET /api/farmer/produce/:id/prices` derives crop/state/district from the saved
listing server-side (no manual re-entry) and enforces farmer ownership.

Response envelope:

```jsonc
{
  "data": {
    "availability": "fresh | stale | unavailable | unconfigured",
    "prices": [ /* MarketPriceView DTOs (never raw external responses) */ ],
    "meta": { "count": 0, "scopeLabel": "…", "lastUpdated": "…", "source": "…", "message": "…" }
  }
}
```

`unconfigured`/`unavailable` are honest states — market prices are never invented.
Until the official source is verified and configured, the pipeline persists and
serves cached DB records but does not fabricate live data.

## Session model

Opaque random token (32 bytes, base64url) stored in an HttpOnly, SameSite=Lax,
Secure-in-production cookie named `kv_session`. Only the sha-256 hash is stored in
the `Session` collection, with a 30-day `expiresAt` (TTL-indexed). Each protected
request resolves the user from the DB by token, so role/status changes apply
immediately and sessions can be revoked (logout deletes the session document).

## Planned route map

Created in the sprint that implements them.

```text
/api/auth/*            auth (register/login/logout/session)        [live]
/api/profile           role-scoped profile                         [live]
/api/farmer/*          farmer produce + matches                    [live]
/api/vendor/*          vendor buying requirements + matches        [live]
/api/admin/*           admin governance                            [planned]
/api/market/prices     market/mandi prices (normalized)            [live]
/api/offers            negotiation / offers                        [planned — Sprint 6]
/api/orders            order lifecycle                             [planned]
/api/logistics         transport estimates & tracking              [planned]
/api/payments          payment lifecycle                           [future]
/api/reviews           ratings and reviews                         [future]
/api/notifications     user notifications                          [future]
```

## Authorization rules

| Area | Allowed roles |
| --- | --- |
| `/api/auth/*` | public (register/login), signed-in (logout/session) |
| `/api/profile` | signed-in farmer or vendor (role-scoped) |
| `/api/farmer/*` | farmer (own listings only; matches for published own listings) |
| `/api/vendor/*` | vendor (own requirements only; matches for active own requirements) |
| `/api/admin/*` | admin |

Server enforcement: layouts/guards on pages (`requirePageRole`), explicit auth on
API handlers (`requireApiUser`). Authorization never relies on hidden navigation.

## Error model

| Error | HTTP | `code` |
| --- | --- | --- |
| Validation | 400 | `VALIDATION_ERROR` |
| Authentication | 401 | `AUTHENTICATION_ERROR` |
| Authorization | 403 | `AUTHORIZATION_ERROR` |
| Not found | 404 | `NOT_FOUND_ERROR` |
| Conflict | 409 | `CONFLICT_ERROR` |
| Configuration | 500 | `CONFIGURATION_ERROR` |
| Database | 500 | `DATABASE_ERROR` |
| External service | 502 | `EXTERNAL_SERVICE_ERROR` |
| Unexpected | 500 | `INTERNAL_ERROR` |

4xx errors may include structured `details` (e.g. Zod issues). 5xx errors never
leak internal messages to the client.

## Security notes / deferred

- Password hashes are `select: false`; passwords never reach the client.
- **Rate limiting on auth endpoints is deferred** — a required hardening step for
  a public deployment, not implemented in Sprint 1 to avoid adding infrastructure
  without need. Add before enabling public signups at scale.
- Cookie `Secure` flag is applied when `NODE_ENV === "production"`.
