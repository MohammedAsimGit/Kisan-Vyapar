# Kisan Vyapar — API Architecture

## Principles

- Route handlers live under `src/app/api/...` (App Router `route.ts` files).
- Handlers are thin: **receive → validate (Zod) → authorize (later) → call a
  service/feature → respond**.
- Business logic belongs in `src/features` / `src/services`, never in a handler or
  a React component.
- All responses use a consistent envelope: success `{ data }`, failure
  `{ error: { code, message, details? } }`.
- Client-facing messages are safe; stack traces/internal detail stay in server logs.
- No fake endpoints return fake business data.

## Planned route map

The following boundaries are the long-term API surface. Each is created in the
sprint that implements it. **None except `/api/health` exists yet.**

```text
/api/auth/*            registration, sign-in, session        [planned]
/api/farmer/*          farmer profile + dashboard            [planned]
/api/vendor/*          vendor profile + dashboard            [planned]
/api/admin/*           admin governance                      [planned]
/api/market/prices     market/mandi prices (normalized)      [planned]
/api/produce/listings  farmer produce listings CRUD          [planned]
/api/buyers/requirements  vendor buying requirements CRUD    [planned]
/api/matching          smart matching results                [planned]
/api/offers            negotiation / offers                  [planned]
/api/orders            order lifecycle                       [planned]
/api/logistics         transport estimates & tracking        [planned]
/api/payments          payment lifecycle                     [future]
/api/reviews           ratings and reviews                   [future]
/api/notifications     user notifications                    [future]
```

## Foundation utilities (implemented)

- `src/lib/api/response.ts` — `ok(data)`, `created(data)`, `noContent()`.
- `src/lib/api/with-error-handling.ts` — wraps a handler; logs unexpected/5xx
  errors and maps any error to a safe envelope via the error taxonomy.
- `src/lib/errors/*` — `AppError` hierarchy and `toErrorEnvelope(error)`.
- `src/lib/validation/*` — shared Zod schemas and `parseOrThrow`.

## Live route (implemented)

### `GET /api/health`

Readiness/liveness check. Dynamic. Returns service status without exposing
connection details.

```jsonc
// 200
{
  "data": {
    "status": "ok",
    "services": {
      "database": { "configured": true, "reachable": true }
    }
  }
}

// 200 when not configured / 503 when configured but unreachable
{ "data": { "status": "degraded", "services": { "database": { "configured": false, "reachable": false } } } }
```

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
