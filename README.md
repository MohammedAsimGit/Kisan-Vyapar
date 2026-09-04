# Kisan Vyapar

An agricultural marketplace that connects **farmers** and **vendors** to improve
price discovery and market linkage — and helps farmers find where they can
**potentially earn the most**, not just where the headline price is highest.

> Premium on the outside. Extremely simple on the inside.

## Problem

Farmers often sell at the nearest mandi with limited knowledge of other buyers and
markets. The headline price of a market is not the farmer's earnings: transport,
handling, and other costs vary by destination and can erase the benefit of a
"higher" price. Vendors, meanwhile, struggle to find reliable farmers who can supply
the quantity, quality, and timing they need.

## Solution

Kisan Vyapar is a two-sided marketplace. Farmers list produce; vendors post buying
requirements. Both sides discover each other, negotiate with structured offers, and
convert agreements into trackable orders. Market/mandi data, buyer discovery, and
matching are designed around **estimated net realization**:

```text
Estimated Net Realization
  = Expected Selling Value
  - Estimated Transportation Cost
  - Applicable Costs
```

## Core Flow

```text
Discover → Match → Negotiate → Sell → Transport → Track → Payment
```

## Project status

**Sprint 3 — Market Price Intelligence (current).** On top of Sprint 0–2, Kisan
Vyapar now has a validated, normalized, history-safe market-price pipeline:
`MarketPrice` persistence with dedupe, a 6-hour cache with explicit
fresh/stale/unavailable states, a centralized crop→commodity mapping, a
Zod-validated price API, and a farmer-facing "View Market Prices" page. The
**live official source is still pending verification** — the provider is the
Government of India **data.gov.in** resource API ("Current Daily Price of Various
Commodities from Various Markets (Mandi)", AGMARKNET mandi data published on
data.gov.in). A real response has **not** been captured in this environment
(`MARKET_DATA_*` is not configured locally), so the provider stays safely
unconfigured and no schema is guessed — the app never invents prices.

**Sprint 2 (done):** Farmer crop discovery & produce entry — see roadmap.

No asking price or market data is collected or displayed yet (deliberate — see
[docs/02](docs/02-Requirements/requirements.md)). Future sprints add market-price
intelligence on top of this structured crop data.

```text
Register → Role → Profile → Dashboard → Add Crop → My Produce
```

Nothing in the UI shows fabricated numbers — unimplemented areas use honest
empty/"Coming soon" states. See each `docs/` file for implemented/planned/future
status.

## Technology

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI | React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (semantic tokens) |
| Icons | lucide-react |
| Database | MongoDB + Mongoose |
| Validation | Zod |
| Password hashing | bcrypt |
| Auth sessions | DB-backed opaque tokens + HttpOnly cookies |
| Linting | ESLint (flat config) |
| Testing | Vitest |

Only technologies actually used are listed.

## Architecture

```
farmer ⇄ Kisan Vyapar ⇄ vendor
```

A high-level diagram, the auth flow, and the full module map are in
[docs/03-System-Architecture/architecture.md](docs/03-System-Architecture/architecture.md).

Source layout highlights:

```text
src/
├── app/          # App Router pages + /api route handlers
│                 #   /auth/*, /onboarding, /farmer, /vendor, /admin, /api/*
├── components/   # ui kit, auth, profiles, dashboard shell, shared
├── features/     # auth (sessions/guards), profiles
├── lib/          # api, client, db, errors, utils, validation
├── services/     # mandi, maps, logistics, ai, matching, realization boundaries
├── models/       # Mongoose models (User, profiles, Session, domain models)
├── types/        # shared domain types
├── constants/    # roles, statuses, units, languages, auth
└── config/       # centralized server configuration
```

## Development

### Prerequisites

- Node.js 20+ (developed on Node 22)
- npm
- MongoDB (local or remote) for database-backed features

### Setup

```bash
# 1. Clone
git clone https://github.com/MohammedAsimGit/Kisan-Vyapar.git
cd Kisan-Vyapar

# 2. Install
npm install

# 3. Configure environment variables
cp .env.example .env.local
# then edit .env.local and set MONGODB_URI (and optionally DATABASE_NAME)
```

Never commit `.env` or `.env.local`. Only `.env.example` (variable names, no
secrets) is tracked.

### Commands

```bash
npm run dev        # start the development server (http://localhost:3000)
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run test       # Vitest unit tests
npm run build      # production build (includes type check)
npm run start      # run the production build
```

With a configured MongoDB, verify connectivity:

```bash
curl http://localhost:3000/api/health
```

### Account flows

Routes (all protected routes require a MongoDB-backed session):

| Route | Purpose |
| --- | --- |
| `/auth/register` | create an account and choose Farmer/Vendor |
| `/auth/login` | sign in with phone/email + password |
| `/onboarding` | complete the role profile |
| `/farmer` `/vendor` `/admin` | protected role dashboards |
| `/farmer/produce` | manage your crops (list) |
| `/farmer/produce/new` | add a crop (visual multi-step) |
| `/farmer/produce/[id]` | view / edit / deactivate / delete a crop |

Known limitation: authentication, profile and session flows were verified
end-to-end against a development MongoDB. The **Sprint 2 produce CRUD/ownership run
could not be executed** because the configured MongoDB Atlas cluster was
unreachable from this network (IP whitelist) during verification — run it once the
database is reachable. There are no automated database integration tests or
browser e2e tests yet.

## Environment variables

| Variable | Used for | Notes |
| --- | --- | --- |
| `MONGODB_URI` | MongoDB connection | required for any DB access |
| `DATABASE_NAME` | Database name | defaults to `kisan-vyapar` |
| `MARKET_DATA_PROVIDER` | Market provider name | `data.gov.in` |
| `MARKET_DATA_BASE_URL` | data.gov.in API base | `https://api.data.gov.in` |
| `MARKET_DATA_API_KEY` | data.gov.in API key | server-only; never committed |
| `MARKET_DATA_RESOURCE_ID` | data.gov.in resource id | from "Current Daily Price of Various Commodities from Various Markets (Mandi)" |
| `MARKET_COST_TRANSPORT_PER_QTL` / `MARKET_COST_OTHER_PER_QTL` / `MARKET_COST_COMMISSION_PERCENT` | optional net-price cost model | empty ⇒ net = modal price |

Environment variables for future integrations (`AUTH_SECRET`, `MANDI_API_URL`,
`MANDI_API_KEY`, `MAPS_API_KEY`, `AI_API_KEY`) will be added as those features are
implemented.

## Documentation

- [Problem statement](docs/01-Problem-Statement/problem-statement.md)
- [Requirements](docs/02-Requirements/requirements.md)
- [System architecture](docs/03-System-Architecture/architecture.md)
- [Database design](docs/04-Database-Design/database-design.md)
- [API architecture](docs/05-API-Documentation/api-architecture.md)
- [UI/UX principles](docs/06-UI-UX/ui-ux-principles.md)
- [Algorithm overview](docs/07-Algorithms/algorithm-overview.md)
- [Price guidance methodology](docs/07-Algorithms/pricing-guidance.md)
- [AI architecture](docs/08-AI/ai-architecture.md)
- [Testing strategy](docs/09-Testing/testing-strategy.md)
- [Deployment overview](docs/10-Deployment/deployment-overview.md)

## Roadmap

- **Sprint 1 (done):** authentication, role selection, sessions, profiles,
  protected dashboards, responsive UI, testing.
- **Sprint 2 (done):** Farmer Crop Discovery & Produce Entry — centralized crop
  catalogue, visual multi-step add-crop, My Produce management (view/edit/
  deactivate/delete), ownership-enforced APIs, live dashboard data, tests.
- **Sprint 3 (done):** Market Price Intelligence — validated/normalized ingestion
  pipeline, history-safe `MarketPrice` store + dedupe, crop→commodity mapping,
  cache/freshness, price API, farmer price UI, optional net-price cost model.
  **data.gov.in** provider implemented but live response still pending
  verification (no key/resource configured locally).
- **Sprint 4 (done):** Price Guidance — deterministic recommendation engine
  (median baseline, trend, volatility, confidence, data sufficiency, suggested
  range) over real data.gov.in observations; farmer can use the suggestion or set
  their own asking price; market-price screen redesigned as a compact Market
  Intelligence view (Snapshot → Guidance → Trend → compact market rows).
- **Next:** vendor buying requirements + farmer discovery; matching & net
  realization; offers/negotiation; orders.
