# Kisan Vyapar — Algorithm Overview

Status of every algorithm described here is explicit. Nothing is documented as
working unless it works.

## Matching (Planned — boundary only today)

Kisan Vyapar will rank farmer↔vendor opportunities instead of showing a flat list.
Candidate scoring factors:

- crop compatibility
- quality fit
- quantity fit
- price fit
- distance (transport cost proxy)
- availability (harvest/required-by timing)
- buyer demand
- reliability (history/reputation, once reviews exist)

Design constraints established in Sprint 0:

- Matching depends on the **normalized interfaces** in
  `src/services/matching/types.ts` (`MatchListingCandidate`,
  `MatchRequirementCandidate`, `MatchScore`, `MatchingService`).
- Weights are **not hardcoded in features**. A `MatchingWeights` shape exists;
  calibrated defaults are intentionally absent until the algorithm is implemented
  and tuned against real data.
- Matching output is explainable — a score should carry human-readable reasons
  (`explanation`), not a black-box number.

## Net realization (Planned — boundary only today)

Core concept: headline market price ≠ farmer earnings.

```text
Estimated Net Realization
  = Expected Selling Value
  - Estimated Transportation Cost
  - Applicable Costs (handling, commissions, other)
```

Sprint 0 provides the domain vocabulary and boundary
(`src/services/realization/types.ts`: `CostItem`, `NetRealizationEstimate`,
`RealizationService`). It does **not** compute or invent any cost figures.

Dependencies that must exist before a real implementation:

1. A mandi provider producing normalized price records (`MandiPriceRecord`).
2. A maps/distance provider (`MapsService`).
3. A logistics estimator producing transport cost estimates (`LogisticsService`).

## Market price pipeline (Planned)

```text
External provider response
  → adapter (provider-specific)
  → normalize to MandiPriceRecord
  → validate (Zod + schema)
  → store/cache (MarketPrice collection)
  → application queries
```

External response formats never leak into application code.

## Status legend

| Algorithm | Status |
| --- | --- |
| Matching scoring | Planned (interface only) |
| Net realization estimate | Planned (interface only) |
| Market price normalization/ingestion | Planned (interface only) |
| Distance/transport estimation | Planned (interface only) |
| Unit/quantity math, offer-to-order flow | Not started (needs business sprint) |
