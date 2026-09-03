# Kisan Vyapar — System Architecture

## High-level view

```mermaid
flowchart TB
    F[Farmer] --> APP
    V[Vendor] --> APP
    A[Admin] --> APP

    subgraph APP[Next.js Application - App Router]
        UI[React UI - mobile-first]
        API[Route Handlers /api/*]
        LAYERS[Business Logic / Features]
        SVC[Services]
        VAL[Validation - Zod]
        ERR[Error taxonomy]
    end

    UI --> API
    API --> LAYERS
    LAYERS --> VAL
    LAYERS --> SVC
    SVC --> ERR

    subgraph EXT[External service boundaries - interfaces only in Sprint 0]
        MANDI[Mandi provider]
        MAPS[Maps / distance]
        LOGI[Logistics / transport]
        AI[AI assistant]
    end

    SVC --> MANDI
    SVC --> MAPS
    SVC --> LOGI
    SVC --> AI

    SVC --> DB[(MongoDB)]
```

## Product flow

```mermaid
flowchart LR
    D[Discover] --> M[Match] --> N[Negotiate] --> S[Sell] --> T[Transport] --> TR[Track] --> P[Payment]
```

## Repository layout

```text
Kisan-Vyapar/
├── src/
│   ├── app/                 # App Router pages + /api route handlers
│   ├── components/          # React components (ui, shared, role-scoped)  [future]
│   ├── features/            # Feature-specific application logic           [future]
│   ├── lib/                 # Cross-cutting utilities
│   │   ├── api/             #   response helpers, error wrapper
│   │   ├── db/              #   Mongo/Mongoose connection utility
│   │   ├── errors/          #   error taxonomy + safe HTTP envelopes
│   │   └── validation/      #   shared Zod schemas + parse helper
│   ├── services/            # External/business service boundaries
│   │   ├── mandi/ maps/ logistics/ ai/ matching/ realization/
│   ├── models/              # Mongoose schemas/models
│   ├── types/               # Shared TypeScript types
│   ├── constants/           # Centralized domain constants
│   └── config/              # Centralized server configuration
├── docs/                    # Documentation set (01–10)
├── public/
└── ...
```

Planned route segments under `src/app` (created when their first page/route lands):
`(auth)`, `farmer`, `vendor`, `admin`, `api`.

## Separation of concerns

- **UI** renders and reacts; contains no business logic.
- **Features** own feature-specific application logic.
- **Services** own external integrations and business operations.
- **Models** own Mongo schemas.
- **Validation** (Zod) guards application boundaries.
- **Types / constants / config** centralize shared vocabulary.
- **Route handlers** receive → validate → authorize (later) → call services → respond.

## Status summary

- **Implemented:** app shell, config, DB connection, models, constants, types,
  error/API utilities, `/api/health`, service interfaces, docs.
- **Planned:** auth, role dashboards, listing/requirement CRUD, matching, offers,
  orders, market ingestion adapters.
- **Future:** payments, logistics execution, AI advisor, multilingual engine,
  voice, ratings engine.

No unimplemented system is documented as if it works.
