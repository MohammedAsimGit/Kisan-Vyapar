# Kisan Vyapar — Deployment Overview

## Status

No deployment has been performed. No hosting account, domain, or CI is wired up.
This document captures the intended path and the operational rules the codebase
already follows so deployment is low-risk later.

## Runtime characteristics (current)

- Next.js 16 App Router application (Node.js runtime; dynamic route: `/api/health`).
- Server-side MongoDB access via Mongoose. The `/api/health` route is the only live
  API route; the homepage is fully static and prerendered.
- No build-time database connection is required — models import without connecting;
  connections happen on demand at request time.

## Configuration rules

- All environment variables are read server-side through validated config
  (`src/config/env.ts`). Secrets never reach client bundles (server-only guard).
- `.env.example` documents variable names; real values live only in local/private
  environment stores.

| Variable | Required by | Notes |
| --- | --- | --- |
| `MONGODB_URI` | any DB access | validated non-empty when set |
| `DATABASE_NAME` | any DB access | defaults to `kisan-vyapar` |

Future variables (not yet used): `AUTH_SECRET`, `MANDI_API_URL`, `MANDI_API_KEY`,
`MAPS_API_KEY`, `AI_API_KEY`. They will be added to `.env.example` only when the
feature that needs them is implemented.

## Intended deployment target (Future)

- **Next.js** served on a Node-compatible host (e.g. a VPS, a container runtime,
  or a platform such as Vercel), with:
- **MongoDB** as a managed or self-hosted database reachable from the app.
- Environment secrets injected by the host — never committed.
- Health checks against `/api/health`.

## CI/CD (Future)

- On every push/PR: `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build`,
  then tests once a runner is added.
- Promote only after the quality gate passes.
- Database migrations/schema changes handled deliberately before release (Mongo has
  no fixed schema; indexes are declared in code and applied via a controlled step).

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
npm run lint
npm run typecheck
npm run build
```

Requires a reachable MongoDB and a matching `MONGODB_URI` in `.env.local` for any
database-backed feature or for `/api/health` to report `reachable: true`.

## Production security posture

Foundations present: server-only env handling, centralized validation, safe error
responses, secret hygiene, role vocabulary. **Not yet production-secure**: no
authentication, no authorization enforcement, no rate limiting, no audit logging,
no secrets manager integration, no TLS termination config. These are later sprints.
